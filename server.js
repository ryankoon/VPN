const net = require('net');
const App = require('./app.js');

//Single instance of server
let server, socket;

function start(host, port) {
    return new Promise((resolve, reject) => {
        if (server === undefined) {
            server = net.createServer(listener => {
                socket = listener;

                // TODO: Authentication on connection
                console.log("Server is connected to client.");

                listener.on('data', data => {
                    let ws = App.getWebSocket();
                    if (ws) {
                        ws.send("Server received: " + data);
                    }
                    //TODO: decrypt data
                });
            });

            server.on('close', function () {
                server = undefined;
                socket = undefined;
                console.log("Server closed.")
            });

            server.on('error', e => {
                reject(e);
            });

            server.listen(port, host, resolve);
        } else {
            reject(new Error("Stop the server before starting a new connection."));
        }
    });
}


function send(data) {
    return new Promise((resolve, reject) => {
        if (socket) {
            //TODO: encrypt data

            socket.write(data, resolve);
        } else {
            reject(new Error("The server must be connected to a client first."));
        }
    });
}

function stop() {
    return new Promise(resolve => {
        if (server) {
            console.log("Closing server...");
            server.close(resolve);
        } else {
            resolve();
        }
    });
}

//Exports
module.exports.start = start;
module.exports.send = send;
module.exports.stop = stop;