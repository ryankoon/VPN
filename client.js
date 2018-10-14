const net = require('net');
let client;

function start(host, port) {
    return new Promise((resolve, reject) => {
        if (client === undefined) {
            client = new net.Socket();

            client.connect(port, host, () => {
                console.log("Client is connected to " + host + ":" + port);

                // TODO: Authentication on connection
                resolve();
            });

            client.on('data', data => {
                console.log("Client received: " + data);
                //TODO: decrypt data
            });

            client.on('end', function () {
                console.log('Client connection ending...');
            });

            client.on('close', () => {
                client = undefined;
                console.log('Client connection closed');
            });

            client.on('error', e => {
                reject(e);
            });
        } else {
            reject(new Error("The client connection must be started first."));
        }
    });
}

function send(data) {
    return new Promise((resolve, reject) => {
        if (client) {
            //TODO: encrypt data

            client.write(data, resolve);
        } else {
            reject(new Error("The client connection must be started first."));
        }
    });
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

//Exports
module.exports.start = start;
module.exports.send = send;
module.exports.stop = stop;