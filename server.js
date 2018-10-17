const net = require('net');

const crypto = require('crypto');
const aesWrapper = require('./component/aes-wrapper');
const App = require('./app.js');

//Single instance of server
let server, socket;
let server_nonce;
let server_dh;
let server_dh_key;
let server_dh_secret;
let nonce_of_client;


function start(host, port, sharedSecret) {
    return new Promise((resolve, reject) => {
        if (server === undefined) {
            App.webSocketSend("Server instance created.");
            server = net.createServer(listener => {
                socket = listener;
                App.webSocketSend("Server is connected to client.");

                // Authentication on connection
                // generate DH public key g and p
                server_nonce = crypto.randomBytes(12);

                //can use (2048), this number is in bits
                server_dh = crypto.createDiffieHellman(512);
                server_dh_key = server_dh.generateKeys();

                // Send Auth1 - server send DH public key and nonce Rb
                const buffer = Buffer.concat([Buffer.from('301'), server_nonce, server_dh.getPrime(), server_dh.getGenerator()]);
                send(buffer);
                App.webSocketSend('(server sent Auth-1) Sent client DH public key and nonce');

                listener.on('data', data => {
                    App.webSocketSend("Server received data: " + data.toString('hex'));
                    //decrypt data

                    if (data.byteLength < 3) {
                        console.log('Data received not valid!');
                        return;
                    }
                    const code = data.toString().slice(0, 3);
                    switch (code) {
                        case '101': {
                            //Receive Auth2
                            //save nonce_client, compare nonce_server, calculate g^(ab) mode p
                            App.webSocketSend('(server received Auth-2) Received client DH key and nonce');
                            nonce_of_client = data.slice(3, 15);
                            let aes_msg = data.slice(15, data.byteLength);
                            try{
                            let aes_raw = Buffer.from(aesWrapper.decrypt(get32B(sharedSecret), aes_msg.toString()), 'hex');
                            let nonce_of_server_from_client = aes_raw.slice(0, 12);
                            if (nonce_of_server_from_client.equals(server_nonce)) {
                                App.webSocketSend("(server) authentication passed, nonce is correct");
                            } else {
                                App.webSocketSend("(server) authentication failed, nonce is incorrect");
                                stop();
                            }
                            let dh_key_of_client = aes_raw.slice(12, Number(aes_raw.byteLength));
                            server_dh_secret = server_dh.computeSecret(dh_key_of_client);
                            
                            
                            //Send Auth3 - server send E(Ra nonce, g^b mod p)
                            let auth3 = aesWrapper.createAesMessage(get32B(sharedSecret), Buffer.concat([nonce_of_client, server_dh_key]));
                            send(Buffer.concat([Buffer.from('302'), Buffer.from(auth3)]));
                            App.webSocketSend('(server sent Auth-3) sent client E(Ra nonce, g^b mod p)');
                            App.webSocketSend('(server) secure channel established...');
                            }catch(err){
                                App.webSocketSend('(server) authentication failed, shared secret does not match.');
                                stop();
                            }
                            break;
                        }
                        case '102': {
                            //decrypt data
                            decrypt(data);
                            //send_encry("Got your message");
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
            App.webSocketSend("(server)Sending data:" + data.toString("hex"));
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
        let msg = "Secure channel has not established...Received client DH key and nonce";
        console.error(msg);
        App.webSocketSend(msg);
        return Promise.reject(new Error(msg));
    }
}

//Decrypt Msg - using AES shared session key
function decrypt(encry_msg) {
    if (server_dh_secret) {

        let encryted_aes_msg = encry_msg.slice(3, encry_msg.byteLength);
        App.webSocketSend("(server)Received ciphertext:" + encryted_aes_msg.toString());
        try{
        let decrypted_aes_msg = Buffer.from(aesWrapper.decrypt(server_dh_secret.slice(0, 32), encryted_aes_msg.toString()), 'hex');

        App.webSocketSend("(server)Decrypted message:" + decrypted_aes_msg.toString());
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

function get32B(sdata) {
    let buffer = Buffer.from(sdata);
    if (buffer.byteLength > 32) return buffer.slice(0, 32);
    return Buffer.from(sdata.padEnd(32, '0'));
}

//Exports
module.exports.start = start;
module.exports.send_encry = send_encry;
module.exports.stop = stop;