const net = require('net');

const crypto = require('crypto');
const aesWrapper = require('./component/aes-wrapper');
const App = require('./app.js');
const {NONCELEN, DHPRIMELEN, CODELEN} = require('./public/src/properties');

//Single instance of server
let server, socket;
let server_nonce;
let server_dh;
let server_dh_key;
let server_dh_secret;
let nonce_of_client;
let shared_secret;

//Data for next step
let auth1_dh_buffer;
let auth3_buffer;

const SERVER_STEPS = {
    CLIENT_CONNECT_WAIT: 0,
    AUTH_1: 1,
    AUTH_2_WAIT: 2,
    AUTH_3: 3,
    AUTHENTICATED: 4
};

let nextStep = SERVER_STEPS.CLIENT_CONNECT_WAIT;


function start(host, port, sharedSecret) {
    //hash sharedsecret
    shared_secret = crypto.createHash('sha256').update(sharedSecret).digest('base64');

    return new Promise((resolve, reject) => {
        if (server === undefined) {
            App.webSocketSend("Server instance created.");
            server = net.createServer(listener => {
                socket = listener;

                listener.on('data', data => {
                    App.webSocketSend("Server received data: " + data.toString('base64'));

                    //Decode message
                    if (data.byteLength < CODELEN) {
                        let msg = 'Data received not valid!';
                        App.webSocketSend(msg);
                        return;
                    }
                    const code = data.toString().slice(0, CODELEN);
                    switch (code) {
                        case '101': {
                            //Receive Auth2
                            if (rcvAuth2(data)) {
                                prepareAuth3();
                            }
                            break;
                        }
                        case '102': {
                            //Decrypt data
                            decrypt(data);
                            break;
                        }
                        default: {
                            console.log('Code not valid', code);
                        }
                    }
                });

                App.webSocketSend("Server is connected to client.");
                auth1_SetupServerDH();
            });

            server.on('close', function () {
                resetGlobals();
                App.webSocketSend("Server closed.");
            });

            server.on('error', e => {
                reject(e);
            });

            server.listen(port, host, resolve);
        } else {
            let msg = "Stop the server before starting a new connection.";
            reject(new Error(msg));
            App.webSocketSend(msg);
        }
    });
}


function send(data) {
    return new Promise((resolve, reject) => {
        if (socket) {
            App.webSocketSend("(server)Sending data: " + data.toString("base64"));
            socket.write(data, resolve);
        } else {
            let msg = "The server must be connected to a client first.";
            reject(new Error(msg));
            App.webSocketSend(msg);
        }
    });
}

//Encrypt Msg - using AES shared session key
function send_encry(msg) {
    if (server_dh_secret) {
        App.webSocketSend("(server)Encrypting plaintext: " + msg);

        let encry_msg = aesWrapper.createAesMessage(server_dh_secret.slice(0, 32), Buffer.from(msg));

        App.webSocketSend("(server)Computing ciphertext: " + encry_msg);
        return send(Buffer.from('303' + encry_msg));
    }
    let errMsg = "Secure channel has not established...";
    console.error(errMsg);
    App.webSocketSend(errMsg);
    return Promise.reject(new Error(errMsg));

}

//Decrypt Msg - using AES shared session key
function decrypt(encry_msg) {
    if (server_dh_secret) {

        let encryted_aes_msg = encry_msg.slice(3, encry_msg.byteLength);
        App.webSocketSend("(server)Received ciphertext: " + encryted_aes_msg.toString());
        try {
            let decrypted_aes_msg = Buffer.from(aesWrapper.decrypt(server_dh_secret.slice(0, 32), encryted_aes_msg.toString()), 'hex');

            App.webSocketSend("(server)Decrypted message: " + decrypted_aes_msg.toString());
        } catch (err) {
            App.webSocketSend("(server)Cannot decrypt using shared key AES.");
        }
    } else {
        let msg = "Secure channel has not established...";
        console.error(msg);
        App.webSocketSend(msg);
    }
}

function stop() {
    return new Promise(resolve => {
        if (socket) {
            App.webSocketSend("Sending FIN to client...");
            socket.end();
        }
        if (server) {
            App.webSocketSend("Closing server...");
            server.close(resolve);
        } else {
            resolve();
        }
    });
}

function resetGlobals() {
    server = undefined;
    socket = undefined;
    server_nonce = undefined;
    server_dh = undefined;
    server_dh_key = undefined;
    server_dh_secret = undefined;
    nonce_of_client = undefined;
    shared_secret = undefined;
    auth1_dh_buffer = undefined;
    auth3_buffer = undefined;

    nextStep = SERVER_STEPS.CLIENT_CONNECT_WAIT;
}

function broadcastDHConfig() {
    App.webSocketSend("Server nonce: " + server_nonce.toString("hex"));
    App.webSocketSend("Server generator: " + server_dh.getGenerator().toString("hex"));
    App.webSocketSend("Server prime: " + server_dh.getPrime().toString("hex"));
}

function auth1_SetupServerDH() {
    // Authentication on connection, generate DH public key g and p
    App.webSocketSend('(server) Generating DH prime, generator and server secret key and nonce Rb...');
    server_nonce = crypto.randomBytes(NONCELEN);
    server_dh = crypto.createDiffieHellman(DHPRIMELEN * 8);
    server_dh_key = server_dh.generateKeys();
    broadcastDHConfig();

    // Store buffer for next step of Auth1 (server send DH public key and nonce Rb to client)
    auth1_dh_buffer = Buffer.concat([Buffer.from('301'), server_nonce, server_dh.getPrime(), server_dh.getGenerator()]);
    nextStep = SERVER_STEPS.AUTH_1;
}

function auth1_Send() {
    if (auth1_dh_buffer) {
        send(auth1_dh_buffer)
            .then(() => {
                nextStep = SERVER_STEPS.AUTH_2_WAIT;
                App.webSocketSend('(server sent Auth-1) Sent client the server DH prime, generator and nonce Rb');
            })
            .catch(err => {
                App.webSocketSend('Socket error sending client the server DH prime, generator and nonce Rb:');
                App.webSocketSend(err);
                App.webSocketSend('Press "Continue" to retry.');
            });
    } else {
        App.webSocketSend('Server DH has not been configured (Auth-1). Reconfiguring...');
        auth1_SetupServerDH();
    }
}

function prepareAuth3() {
    //Send Auth3 - server send E(Ra nonce, g^b mod p)
    if (nonce_of_client && server_dh_key) {
        App.webSocketSend('(server) Preparing auth-3 encryption...');
        let auth3 = aesWrapper.createAesMessage(Buffer.from(shared_secret, 'base64'), Buffer.concat([nonce_of_client, server_dh_key]));
        auth3_buffer = Buffer.concat([Buffer.from('302'), Buffer.from(auth3)]);
        nextStep = SERVER_STEPS.AUTH_3;
    } else {
        App.webSocketSend('Cannot prepare Auth-3 since server has not received Auth-2 message from client');
        nextStep = SERVER_STEPS.AUTH_2_WAIT;
    }
}

function forgetDHValues() {
    App.webSocketSend("Forgetting server DH values for perfect forward secrecy.");
    server_dh_key = undefined;
    server_dh = undefined;
}

function auth3_Send() {
    if (auth3_buffer) {
        send(auth3_buffer)
            .then(() => {
                App.webSocketSend('(server sent Auth-3) Sent client E(Ra nonce, g^b mod p)');
                App.webSocketSend('(server) Secure channel established...');
                nextStep = SERVER_STEPS.AUTHENTICATED
                forgetDHValues();
            })
            .catch(err => {
                App.webSocketSend('Socket error sending cclient E(Ra nonce, g^b mod p):');
                App.webSocketSend(err);
                App.webSocketSend('Press "Continue" to retry.');
            });
    } else {
        App.webSocketSend('Cannot send Auth-3, since it has not been prepared');
        prepareAuth3();
    }
}

//Receive Auth2 - save nonce_client, compare nonce_server, calculate g^(ab) mode p
function rcvAuth2(data) {
    try {
        App.webSocketSend('(server received Auth-2) Received client DH key and nonce');
        App.webSocketSend('(server) Authenticating...');
        nonce_of_client = data.slice(3, 15);
        let aes_msg = data.slice(15, data.byteLength);
        let aes_raw = Buffer.from(aesWrapper.decrypt(Buffer.from(shared_secret, 'base64'), aes_msg.toString()), 'hex');
        let nonce_of_server_from_client = aes_raw.slice(0, 12);


        if (nonce_of_server_from_client.equals(server_nonce)) {
            App.webSocketSend("(server) Authentication passed, nonce is correct");
        } else {
            App.webSocketSend("(server) Authentication failed, nonce is incorrect");
            stop();
            return 0;
        }


        let dh_key_of_client = aes_raw.slice(12, Number(aes_raw.byteLength));
        server_dh_secret = server_dh.computeSecret(dh_key_of_client);
        App.webSocketSend('(server) Computed session key');
    } catch (err) {
        App.webSocketSend('(server) Authentication failed, shared secret does not match.');
        stop();
        return 0;
    }
    return 1;
}


function executeNextStep() {
    return new Promise((resolve, reject) => {
        if (nextStep === SERVER_STEPS.CLIENT_CONNECT_WAIT) {
            App.webSocketSend('Waiting for a TCP connection to be established with a client.');
            resolve();
        } else if (nextStep === SERVER_STEPS.AUTH_1) {
            auth1_Send();
            resolve();
        } else if (nextStep === SERVER_STEPS.AUTH_2_WAIT) {
            App.webSocketSend('Waiting for Auth-2 response to Diffie-Hellman exchange response from client.');
            resolve();
        } else if (nextStep === SERVER_STEPS.AUTH_3) {
            auth3_Send();
            resolve();
        } else if (nextStep === SERVER_STEPS.AUTHENTICATED) {
            App.webSocketSend('Authenticated with a client. Messages sent or received will be encrypted.');
            resolve();
        } else {
            let errMsg = 'Unexpected state. Invalid nextStep.';
            App.webSocketSend(errMsg);
            stop();
            reject(new Error(errMsg));
        }
    });
}

//Exports
module.exports.start = start;
module.exports.send_encry = send_encry;
module.exports.stop = stop;
module.exports.executeNextStep = executeNextStep;