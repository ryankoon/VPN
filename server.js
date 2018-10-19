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


function start(host, port, sharedSecret) {
    //hash sharedsecret
    shared_secret = crypto.createHash('sha256').update(sharedSecret).digest('base64');
    
    return new Promise((resolve, reject) => {
        if (server === undefined) {
            App.webSocketSend("Server instance created.");
            server = net.createServer(listener => {
                socket = listener;
                App.webSocketSend("Server is connected to client.");
                sendAuth1();

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
                            if(rcvAuth2(data)){    
                                sendAuth3();
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
            });

            server.on('close', function () {
                server = undefined;
                socket = undefined;
                App.webSocketSend("Server closed.")
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
    } else {
        let msg = "Secure channel has not established...";
        console.error(msg);
        App.webSocketSend(msg);
        return Promise.reject(new Error(msg));
    }
}

//Decrypt Msg - using AES shared session key
function decrypt(encry_msg) {
    if (server_dh_secret) {

        let encryted_aes_msg = encry_msg.slice(3, encry_msg.byteLength);
        App.webSocketSend("(server)Received ciphertext: " + encryted_aes_msg.toString());
        try{
        let decrypted_aes_msg = Buffer.from(aesWrapper.decrypt(server_dh_secret.slice(0, 32), encryted_aes_msg.toString()), 'hex');

        App.webSocketSend("(server)Decrypted message: " + decrypted_aes_msg.toString());
        }catch(err){
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

function sendAuth1(){
    // Authentication on connection, generate DH public key g and p
    App.webSocketSend('(server) Generating DH prime, generator and server secret key and nonce Rb...');
    server_nonce = crypto.randomBytes(NONCELEN);
    server_dh = crypto.createDiffieHellman(DHPRIMELEN*8);
    server_dh_key = server_dh.generateKeys();

    // Send Auth1 - server send DH public key and nonce Rb
    const buffer = Buffer.concat([Buffer.from('301'), server_nonce, server_dh.getPrime(), server_dh.getGenerator()]);
    send(buffer);
    App.webSocketSend('(server sent Auth-1) Sent client DH p,g and nonce Rb');    
}

function sendAuth3(){
    //Send Auth3 - server send E(Ra nonce, g^b mod p)
    if(nonce_of_client && server_dh_key){
    App.webSocketSend('(server) Preparing auth-3 encryption...');
    let auth3 = aesWrapper.createAesMessage(Buffer.from(shared_secret,'base64'), Buffer.concat([nonce_of_client, server_dh_key]));
    send(Buffer.concat([Buffer.from('302'), Buffer.from(auth3)]));
    App.webSocketSend('(server sent Auth-3) Sent client E(Ra nonce, g^b mod p)');
    App.webSocketSend('(server) Secure channel established...');
    }else{
        App.webSocketSend('(server sent Auth-3) Cannot send, since server has not received Auth-2 message from client');
    }
}

//Receive Auth2 - save nonce_client, compare nonce_server, calculate g^(ab) mode p
function rcvAuth2(data){
    try{
        App.webSocketSend('(server received Auth-2) Received client DH key and nonce');
        App.webSocketSend('(server) Authenticating...');
        nonce_of_client = data.slice(3, 15);
        let aes_msg = data.slice(15, data.byteLength);
        let aes_raw = Buffer.from(aesWrapper.decrypt(Buffer.from(shared_secret,'base64'), aes_msg.toString()), 'hex');
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
    }catch(err){
        App.webSocketSend('(server) Authentication failed, shared secret does not match.');
        stop();
        return 0;
    }
    return 1;
}

//Exports
module.exports.start = start;
module.exports.send_encry = send_encry;
module.exports.stop = stop;