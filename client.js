const net = require('net');
const crypto = require('crypto');
const aesWrapper = require('./component/aes-wrapper');
const App = require('./app.js');
const {NONCELEN, DHPRIMELEN, CODELEN} = require('./public/src/properties');

let client;
let client_nonce;
let nonce_of_server;
let client_dh;
let client_dh_key;
let client_dh_secret;
let shared_secret;

//Data for next step
let auth2_buffer;

const CLIENT_STEPS = {
    SERVER_CONNECT_WAIT: 0,
    AUTH_1_WAIT: 1,
    AUTH_2: 2,
    AUTH_3_WAIT: 3,
    AUTHENTICATED: 4
};

let nextStep = CLIENT_STEPS.SERVER_CONNECT_WAIT;

function start(host, port, sharedSecret) {
    //hash sharedsecret
    shared_secret = crypto.createHash('sha256').update(sharedSecret).digest('base64');
    return new Promise((resolve, reject) => {
        if (client === undefined) {
            client = new net.Socket();

            client.on('data', data => {
                App.webSocketSend("Client received data: " + data.toString('hex'));

                //Decode message
                if (data.byteLength < CODELEN) {
                    let msg = 'Data received not valid!';
                    App.webSocketSend(msg);
                    return;
                }
                const code = data.toString().slice(0, CODELEN);
                switch (code) {
                    case '301': {
                        //Receive Auth1
                        rcvAuth1(data);
                        //Send Auth2                
                        auth2_prepare();
                        break;
                    }
                    case '302': {
                        //Receive Auth3
                        rcvAuth3(data);
                        break;
                    }
                    case '303': {
                        //Decrypt message
                        decrypt(data);
                        break;
                    }
                    default: {
                        App.webSocketSend('Code not valid', code);
                        reject(new Error("Code not valid: " + code));
                    }
                }
            });

            client.on('end', function () {
                App.webSocketSend('Client connection ending...');
                client.end();
            });

            client.on('close', () => {
                client = undefined;
                nextStep = CLIENT_STEPS.SERVER_CONNECT_WAIT;
                App.webSocketSend('Client connection closed');
            });

            client.on('error', e => {
                console.log("Client on error: " + e);
                reject(e);
            });

            client.connect(port, host, () => {
                App.webSocketSend("Client is connected to " + host + ":" + port);
                nextStep = CLIENT_STEPS.AUTH_1_WAIT;
                broadcastWaitingForServer();
                resolve();
            });
        } else {
            let msg = "The client connection must be stopped first.";
            reject(new Error(msg));
            App.webSocketSend(msg);
        }
    });
}

function send(data) {
    return new Promise((resolve, reject) => {
        if (client) {
            App.webSocketSend("(client) Sending data: " + data.toString("hex"));
            client.write(data, resolve);
        } else {
            let msg = "The client connection must be started first.";
            reject(new Error(msg));
            App.webSocketSend(msg);
        }
    });
}

//Encrypted Msg - using AES shared session key
function send_encry(msg) {
    if (client_dh_secret) {
        App.webSocketSend('(client) Encrypting plaintext: ' + msg);

        let encry_msg = aesWrapper.createAesMessage(client_dh_secret.slice(0, 32), Buffer.from(msg));
        App.webSocketSend("(client) Computing ciphertext: " + encry_msg);

        return send(Buffer.from('102' + encry_msg));
    }
    let errMsg = "Secure channel has not been established...";
    console.error(errMsg);
    App.webSocketSend(errMsg);
    return Promise.reject(new Error(errMsg));

}

//Decrypted Msg - server send AES encrypted message with session key = g^ab mod p
function decrypt(enc_msg) {
    if (client_dh_secret) {
        let encryted_aes_msg = enc_msg.slice(3, enc_msg.byteLength);
        App.webSocketSend("(client) Received ciphertext:" + encryted_aes_msg.toString());
        try {
            let decrypted_aes_msg = Buffer.from(aesWrapper.decrypt(client_dh_secret.slice(0, 32), encryted_aes_msg.toString()), 'hex');
            App.webSocketSend("(client) Decrypted message: " + decrypted_aes_msg.toString());
            broadcastDecryptedMessage(decrypted_aes_msg.toString());
        } catch (err) {
            App.webSocketSend("(client) Cannot decrypt using shared key AES");
        }
    } else {
        let msg = "Secure channel has not been established...";
        console.error(msg);
        App.webSocketSend(msg);
    }
}

function broadcastDecryptedMessage(msg) {
    App.webSocketSend("----------------------MESSAGE FROM SERVER----------------------");
    App.webSocketSend(msg);
    App.webSocketSend("---------------------------------------------------------------");
}


function stop() {
    return new Promise(resolve => {
        if (client) {
            client.end(resolve);
        } else {
            resolve();
        }
    });
}

function broadcastDHValuesReceived(dh_generator, dh_prime) {
    App.webSocketSend('<---DH exchange values received from server----');
    App.webSocketSend('Received server nonce (Rb): ' + nonce_of_server.toString("hex"));
    App.webSocketSend("Received generator (g): " + dh_generator.toString("hex"));
    App.webSocketSend('Received prime (p): ' + dh_prime.toString("hex"));
    App.webSocketSend('<----------------------------------------------');
}

//Receive Auth1 - store nonce Rb and DH g and p
function rcvAuth1(data) {
    App.webSocketSend('(client received Auth-1) Received generator, prime and nonce from server.');
    nonce_of_server = data.slice(CODELEN, CODELEN + NONCELEN);
    client_nonce = crypto.randomBytes(NONCELEN);

    let dh_prime = data.slice(CODELEN + NONCELEN, CODELEN + NONCELEN + DHPRIMELEN);
    let dh_generator = data.slice(CODELEN + NONCELEN + DHPRIMELEN, CODELEN + NONCELEN + DHPRIMELEN + 1);

    broadcastDHValuesReceived(dh_generator, dh_prime);

    App.webSocketSend('(client) Generating DH client secret key and nonce Ra');
    client_dh = crypto.createDiffieHellman(dh_prime, dh_generator);
    client_dh_key = client_dh.generateKeys();
}


function broadcastDHServerConfirmationValues(nonce_of_client_from_server, dh_key_of_server) {
    App.webSocketSend('---Decrypted response values received from server---');
    App.webSocketSend('Client nonce from server (Ra): ' + nonce_of_client_from_server.toString("hex"));
    App.webSocketSend("Received server DH public key (g^b mod p): " + dh_key_of_server.toString("hex"));
    App.webSocketSend('----------------------------------------------------');
}

function forgetDHValues() {
    App.webSocketSend("Forgetting client DH values for perfect forward secrecy.");
    client_dh_key = undefined;
    client_dh = undefined;
}

function broadcastSessionKey() {
    App.webSocketSend('####Session key####');
    App.webSocketSend(client_dh_secret.toString("hex"));
    App.webSocketSend('#######################################');
}

//Receive Auth3 - extract g^a mod p, calculate session key = g^ab mod p
function rcvAuth3(data) {
    try {
        App.webSocketSend('(client received Auth-3) Received server DH public key and client nonce from server.');

        let aes_msg2 = data.slice(3, data.byteLength);
        let aes_raw2 = Buffer.from(aesWrapper.decrypt(Buffer.from(shared_secret, 'base64'), aes_msg2.toString()), 'hex');
        let nonce_of_client_from_server = aes_raw2.slice(0, NONCELEN);
        let dh_key_of_server = aes_raw2.slice(NONCELEN, Number(aes_raw2.byteLength));

        App.webSocketSend('Decrypted data: ' + aes_raw2.toString("hex"));

        App.webSocketSend('(client) Authenticating...');

        broadcastDHServerConfirmationValues(nonce_of_client_from_server, dh_key_of_server);

        if (nonce_of_client_from_server.equals(client_nonce)) {
            nextStep = CLIENT_STEPS.AUTHENTICATED;
            App.webSocketSend("(client) Authentication passed. Nonce is correct");
            App.webSocketSend('(client) Secure channel established...');
            client_dh_secret = client_dh.computeSecret(dh_key_of_server);
            App.webSocketSend('Computed session key.');
            broadcastSessionKey();
            forgetDHValues();
            App.broadcastReadyToSendMessages();
        } else {
            App.webSocketSend("(client) Authentication failed. Unexpected nonce");
            stop();
            return 0;
        }
    } catch (err) {
        App.webSocketSend('(client) Authentication failed, shared secret does not match.');
        stop();
        return 0;
    }
    return 1;
}

function broadcastDHValuesToSend() {
    App.webSocketSend('####Client DH private key/Secret exponent (a)####');
    App.webSocketSend(client_dh.getPrivateKey("hex"));
    App.webSocketSend('Using generator (g): ' + client_dh.getGenerator("hex"));
    App.webSocketSend('Using prime (p): ' + client_dh.getPrime("hex"));
    App.webSocketSend('#######################################');
    App.webSocketSend('----Values to send from client to server--->');
    App.webSocketSend('Client nonce (Ra): ' + client_nonce.toString("hex"));
    App.webSocketSend('Server nonce (Rb): ' + nonce_of_server.toString("hex"));
    App.webSocketSend('Client DH public key (g^a mod p): ' + client_dh_key.toString("hex"));
    App.webSocketSend('------------------------------------------->');
}

function auth2_prepare() {
    //Send Auth2 - client send Ra and E(Rb nonce, g^a mod p)
    if (nonce_of_server && client_dh_key) {
        App.webSocketSend("(client) Preparing auth-2 encryption...");
        broadcastDHValuesToSend();
        App.webSocketSend("####Encrypt data with AES-256-CBC-SHA256 ####");
        let auth2 = aesWrapper.createAesMessage(Buffer.from(shared_secret, 'base64'), Buffer.concat([nonce_of_server, client_dh_key]));
        auth2_buffer = Buffer.concat([Buffer.from('101'), client_nonce, Buffer.from(auth2)]);
        App.webSocketSend("Encrypted data: " + auth2_buffer.toString('hex'));
        App.webSocketSend("#######################################");
        nextStep = CLIENT_STEPS.AUTH_2;
        App.broadcastContinueHint();
    } else {
        App.webSocketSend('(client sent Auth-2) Cannot send, since client has not received Auth-1 message from server');
        nextStep = CLIENT_STEPS.AUTH_1_WAIT;
        broadcastWaitingForServer();
    }
}

function auth2_send() {
    if (auth2_buffer) {
        send(auth2_buffer)
            .then(() => {
                nextStep = CLIENT_STEPS.AUTH_3_WAIT;
                App.webSocketSend('(client sent Auth-2) sent server Ra, E(Rb nonce, g^a mod p, SharedSecret)');
                broadcastWaitingForServer()
            })
            .catch(err => {
                App.webSocketSend('Socket error sending Auth-2 - Ra, E(Rb nonce, g^a mod p, SharedSecret): ');
                App.webSocketSend(err);
                App.webSocketSend('Press "Continue" to retry.');
                App.broadcastContinueHint();
            });

    } else {
        App.webSocketSend('Client DH has not been configured (Auth-2). Reconfiguring...');
        auth2_prepare();
        App.broadcastContinueHint();
    }
}

function executeNextStep() {
    return new Promise((resolve, reject) => {
        if (nextStep === CLIENT_STEPS.SERVER_CONNECT_WAIT) {
            App.webSocketSend('Please wait for a TCP connection to be established with the server. Make sure a client connection is initialized.');
            resolve();
        } else if (nextStep === CLIENT_STEPS.AUTH_1_WAIT) {
            App.webSocketSend('Please wait for the server to initialize a Diffie-Hellman exchange (Auth-1).');
            resolve();
        } else if (nextStep === CLIENT_STEPS.AUTH_2) {
            auth2_send();
            resolve();
        } else if (nextStep === CLIENT_STEPS.AUTH_3_WAIT) {
            App.webSocketSend('Please wait for the server to return the nonce (Auth-3).');
            resolve();
        } else if (nextStep === CLIENT_STEPS.AUTHENTICATED) {
            App.webSocketSend('Authentication with the server has been completed. Messages sent or received will be encrypted.');
            resolve();
        } else {
            let errMsg = 'Unexpected state. Invalid nextStep.';
            App.webSocketSend(errMsg);
            stop();
            reject(new Error(errMsg));
        }
    });
}

function broadcastWaitingForServer() {
    App.webSocketSend('......Waiting for Server......');
}

//Exports
module.exports.start = start;
module.exports.send_encry = send_encry;
module.exports.stop = stop;
module.exports.sendAuth2 = auth2_prepare;
module.exports.executeNextStep = executeNextStep;