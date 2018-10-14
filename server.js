const net = require('net');
const crypto = require('crypto');
const aesWrapper = require('./component/aes-wrapper');

//Single instance of server
let server, socket;
let shared_secret = 'scambooter';
let server_nonce ;
let server_dh;
let server_dh_key;
let server_dh_secret;
let nonce_of_client;


function start(host, port) {
    if (server === undefined) {
        server = net.createServer(listener => {
            socket = listener;
            console.log("Server is connected to client.");

            // TODO: get shared secret from UI client
            
            // generate DH public key g and p
            server_nonce = crypto.randomBytes(12);
            server_dh = crypto.createDiffieHellman(512); //can use (2048), this number is in bits
            server_dh_key = server_dh.generateKeys();

            // Send Auth1 - server send DH public key and nonce Rb
            var buffer = Buffer.concat([Buffer.from('301'), server_nonce, server_dh.getPrime(), server_dh.getGenerator()]);
            send(buffer);
            console.log('Send Auth-1');
                //console.log("Send Auth - 1: ", buffer);
                //console.log("prime: ",server_dh.getPrime());
                //console.log("generator: ",server_dh.getGenerator());


            listener.on('data', data => {
                if(data.byteLength < 3){
                    console.log('Data received not valid!');
                    return;
                }  
                //console.log('Data received', data);
                const code = data.toString().slice(0,3);
                switch (code) {
                    case '101':
                        //Receive Auth2 
                        //save nonce_client, compare nonce_server, calculate g^(ab) mode p
                        nonce_of_client = data.slice(3,15);

                        let aes_msg = data.slice(15,data.byteLength);
                        let aes_raw = Buffer.from(aesWrapper.decrypt(get32B(shared_secret),aes_msg.toString()),'hex');
                        let nonce_of_server_from_client = aes_raw.slice(0,12);
                        if(nonce_of_server_from_client.equals(server_nonce)){
                            console.log('Server authentication pass');
                        }
                        let dh_key_of_client = aes_raw.slice(12, aes_raw.byteLength);
                        server_dh_secret = server_dh.computeSecret(dh_key_of_client);
                        console.log('Receive Auth-2');

                        //Send Auth3 - server send E(Ra nonce, g^a mod p)
                        let auth3 = aesWrapper.createAesMessage(get32B(shared_secret), Buffer.concat([nonce_of_client,server_dh_key]));
                        send(Buffer.concat([Buffer.from('302'), Buffer.from(auth3)]));
                        console.log('Send Auth-3');
                        break;

                    case '102':
                        //decrypt data
                        decrypt(data);
                        send_encry("Got your message");
                        break;
                        
                        
                    default:
                        console.log('Code not valid', code);
                }
                
            });

        });

        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.log('Address in use, retrying...');
                setTimeout(() => {
                    server.close();
                    server.listen(port, host);
                }, 1000);
            } else {
                console.log("Server Error");
                console.log(e);
            }
        });


        server.listen(port, host);
        console.log("Server is listening at " + host + ":" + port);
    } else {
        console.error("Stop the server before starting a new connection.");
    }
}


function send(data) {
    if (socket) {
        socket.write(data);
        //console.log("sent data", data);
    } else {
        console.error("The server must be started first.");
    }
}

//Encrypt Msg - using AES shared session key
function send_encry(msg){
    if(server_dh_secret){
        let encry_msg = aesWrapper.createAesMessage(server_dh_secret.slice(0,32),Buffer.from(msg));
        send(Buffer.from('303'+ encry_msg));
        console.log('Send message: ', msg);
    }else{
        console.error("Mutual Authentication failed.");
    }
}

//Decrypt Msg - using AES shared session key
function decrypt(encry_msg){
    if(server_dh_secret){
        let encryted_aes_msg = encry_msg.slice(3, encry_msg.byteLength);
        let decrypted_aes_msg = Buffer.from(aesWrapper.decrypt(server_dh_secret.slice(0,32),encryted_aes_msg.toString()),'hex');
        console.log("Receive message:",decrypted_aes_msg.toString());
        //TODO: display this raw and decrypted message in UI client 
    }
    else{
        console.log("Mutual Authentication failed.");
    }
}

function stop() {
    if (server) {
        socket.close();
        server.close();
        server = undefined;
        socket = undefined;
    } else {
        console.error("The server is not running. ");
    }
}

function get32B(sdata){
    let buffer = Buffer.from(sdata);
    if(buffer.byteLength > 32)
        return buffer.slice(0, 32);
    else
        return Buffer.from(sdata.padEnd(32, '0'));
}

start("127.0.0.1", "8081");

//Exports
module.exports.start = start;
module.exports.send = send;
module.exports.stop = stop;