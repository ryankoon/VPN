const net = require('net');
const crypto = require('crypto');
const aesWrapper = require('./component/aes-wrapper');
const App = require('./app.js');

let client;
let client_nonce;
let nonce_of_server;
let client_dh;
let client_dh_key;
let client_dh_secret;

function start(host, port, sharedSecret) {
    return new Promise((resolve, reject) => {
        if (client === undefined) {
            client = new net.Socket();

            client.on('data', data => {
                App.webSocketSend("Client received ciphertext: " + data);

                //decrypt data
                if (data.byteLength < 3) {
                    let msg = 'Data received not valid!';
                    App.webSocketSend(msg);
                    return;
                }
                //console.log('Data received', data);
                const code = data.toString().slice(0, 3);
                switch (code) {
                    case '301': {
                        //Receive Auth1 - server send DH public key and nonce Rb
                        //Store nonce Rb and DH g and p
                        App.webSocketSend('Receive Auth - 1');
                        nonce_of_server = data.slice(3, 15);
                        client_nonce = crypto.randomBytes(12);
                        //TODO: change this later hardcoded this length for dh prime 512b = 64B
                        let dh_prime = data.slice(15, 79);
                        let dh_generator = data.slice(79, 80);
                        client_dh = crypto.createDiffieHellman(dh_prime, dh_generator);
                        client_dh_key = client_dh.generateKeys();

                        //Send Auth2 - client send Ra and E(Rb nonce, g^b mod p)
                        let auth2 = aesWrapper.createAesMessage(get32B(sharedSecret), Buffer.concat([nonce_of_server, client_dh_key]));
                        send(Buffer.concat([Buffer.from('101'), client_nonce, Buffer.from(auth2)]));
                        App.webSocketSend('Send Auth - 2');
                        break;
                    }
                    case '302': {
                        //Auth3 - server send E(Ra nonce, g^a mod p)
                        //Extract g^a mod p, calculate session key = g^ab mod p
                        let aes_msg2 = data.slice(3, data.byteLength);
                        let aes_raw2 = Buffer.from(aesWrapper.decrypt(get32B(sharedSecret), aes_msg2.toString()), 'hex');
                        let nonce_of_client_from_server = aes_raw2.slice(0, 12);
                        let dh_key_of_server = aes_raw2.slice(12, Number(aes_raw2.byteLength));
                        if (nonce_of_client_from_server.equals(client_nonce)) {
                            console.log('Client authentication pass');
                        } else {
                            App.webSocketSend("Invalid Nonce");
                            stop();
                        }
                        client_dh_secret = client_dh.computeSecret(dh_key_of_server);
                        console.log('Receive Auth -3');

                        //Start sending msg with session key client_dh_secret(//want to earse client_dh and client_dh_key?)
                        //TODO: want to erase client_dh and client_dh_key?
                        let msg_from_UI = 'We use AES encryption for this assignment.';
                        send_encry(msg_from_UI);
                    }
                    case '303': {
                        //Decrypted Msg - server send AES encrypted message with session key = g^ab mod p
                        decrypt(data);
                        break;
                    }
                    default: {
                        App.webSocketSend('Code not valid', code);
                        reject()
                    }
                }
            });

            client.on('end', function () {
                App.webSocketSend('Client connection ending...');
                client.end();
            });

            client.on('close', () => {
                client = undefined;
                App.webSocketSend('Client connection closed');
            });

            client.on('error', e => {
                console.log("Client on error: " + e);
                reject(e);
            });

            client.connect(port, host, () => {
                App.webSocketSend("Client is connected to " + host + ":" + port);

                // TODO: Authentication on connection
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
            //TODO: encrypt data
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
        App.webSocketSend('Encrypting plaintext: ', msg);

        let encry_msg = aesWrapper.createAesMessage(client_dh_secret.slice(0, 32), Buffer.from(msg));

        App.webSocketSend("Sending ciphertext: " + encry_msg);
        return send(Buffer.from('102' + encry_msg));
    } else {
        let msg = "Message encryption failed. Mutual Authentication failed.";
        console.error(msg);
        App.webSocketSend(msg);
        return Promise.reject(new Error(msg));
    }
}

function decrypt(enc_msg) {
    if (client_dh_secret) {
        App.webSocketSend("Received ciphertext:", enc_msg);

        let encryted_aes_msg = enc_msg.slice(3, enc_msg.byteLength);
        let decrypted_aes_msg = Buffer.from(aesWrapper.decrypt(client_dh_secret.slice(0, 32), encryted_aes_msg.toString()), 'hex');

        App.webSocketSend("Decrypted message: " + decrypted_aes_msg.toString());
    } else {
        let msg = "Message decryption failed. Mutual Authentication failed.";
        console.error(msg);
        App.webSocketSend(msg);
    }
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

function get32B(sdata) {
    let buffer = Buffer.from(sdata);
    if (buffer.byteLength > 32) {
        return buffer.slice(0, 32);
    }
    return Buffer.from(sdata.padEnd(32, '0'));
}

//Exports
module.exports.start = start;
module.exports.send_encry = send_encry;
module.exports.stop = stop;