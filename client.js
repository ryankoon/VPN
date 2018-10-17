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

function start(host, port, sharedSecret) {
    //hash sharedsecret
    shared_secret = crypto.createHash('sha256').update(sharedSecret).digest('base64');
    return new Promise((resolve, reject) => {
        if (client === undefined) {
            client = new net.Socket();

            client.on('data', data => {
                App.webSocketSend("Client received data: " + data.toString('base64'));
                
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
                        sendAuth2();
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
            App.webSocketSend("(client)Sending data:" + data.toString("base64"));
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
        App.webSocketSend('(client)Encrypting plaintext: '+ msg);

        let encry_msg = aesWrapper.createAesMessage(client_dh_secret.slice(0, 32), Buffer.from(msg));
        App.webSocketSend("(client)Computing ciphertext: " + encry_msg);

        return send(Buffer.from('102' + encry_msg));
    } else {
        let msg = "Secure channel has not established...";
        console.error(msg);
        App.webSocketSend(msg);
        return Promise.reject(new Error(msg));
    }
}

//Decrypted Msg - server send AES encrypted message with session key = g^ab mod p
function decrypt(enc_msg) {
    if (client_dh_secret) {
        
        let encryted_aes_msg = enc_msg.slice(3, enc_msg.byteLength);
        App.webSocketSend("(client)Received ciphertext:" + encryted_aes_msg.toString());
        try{
            let decrypted_aes_msg = Buffer.from(aesWrapper.decrypt(client_dh_secret.slice(0, 32), encryted_aes_msg.toString()), 'hex');
            App.webSocketSend("(client)Decrypted message: " + decrypted_aes_msg.toString());
        }catch(err){
            App.webSocketSend("(client)Cannot decrypt using shared key AES");
        }
    } else {
        let msg = "Secure channel has not established...";
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

//Receive Auth1 - store nonce Rb and DH g and p
function rcvAuth1(data){
    App.webSocketSend('(client received Auth-1) received DH public key and nonce from server.');
    App.webSocketSend('(client): Generating DH client secret key and nounce Ra')
    nonce_of_server = data.slice(CODELEN, CODELEN +  NONCELEN);
    client_nonce = crypto.randomBytes(NONCELEN);
    
    let dh_prime = data.slice(CODELEN +  NONCELEN, CODELEN + NONCELEN + DHPRIMELEN);
    let dh_generator = data.slice(CODELEN + NONCELEN + DHPRIMELEN, CODELEN + NONCELEN + DHPRIMELEN + 1);
    client_dh = crypto.createDiffieHellman(dh_prime, dh_generator);
    client_dh_key = client_dh.generateKeys();
}

//Receive Auth3 - extract g^a mod p, calculate session key = g^ab mod p
function rcvAuth3(data){
    try{
        App.webSocketSend('(client received Auth-3) received server DH key and nonce from server.');
        App.webSocketSend('(client) Authenticating...');
        let aes_msg2 = data.slice(3, data.byteLength);
        let aes_raw2 = Buffer.from(aesWrapper.decrypt(Buffer.from(shared_secret,'base64'), aes_msg2.toString()), 'hex');
        let nonce_of_client_from_server = aes_raw2.slice(0, NONCELEN);
        let dh_key_of_server = aes_raw2.slice(NONCELEN, Number(aes_raw2.byteLength));
        if (nonce_of_client_from_server.equals(client_nonce)) {
            App.webSocketSend("(client) Authentication passed, nonce is correct");
        } else {
            App.webSocketSend("(client) Authentication passed, nonce is correct");
            stop();
            return 0;
        }
        App.webSocketSend('(client) Secure channel established...');
        client_dh_secret = client_dh.computeSecret(dh_key_of_server);
        App.webSocketSend('(server) Computed session key');
    }catch(err){
        App.webSocketSend('(client) Authentication failed, shared secret does not match.');
        stop();
    return 0;
    }   
    return 1;    
    //TODO: want to erase client_dh and client_dh_key?
}

function sendAuth2(){
    //Send Auth2 - client send Ra and E(Rb nonce, g^a mod p)
    if(nonce_of_server && client_dh_key){
    let auth2 = aesWrapper.createAesMessage(Buffer.from(shared_secret,'base64'), Buffer.concat([nonce_of_server, client_dh_key]));
    send(Buffer.concat([Buffer.from('101'), client_nonce, Buffer.from(auth2)]));
    App.webSocketSend('(client sent Auth-2) sent server E(Rb nonce, g^a mod p)');
    }else{
        App.webSocketSend('(client sent Auth-2) Cannot send, since client has not received Auth-1 message from server');
    }
}

//Exports
module.exports.start = start;
module.exports.send_encry = send_encry;
module.exports.stop = stop;
module.exports.sendAuth2 = sendAuth2;