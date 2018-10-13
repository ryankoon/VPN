const net = require('net');

//Single instance of server
let server, socket;

//TODO: custom IP:Port
function start(host, port) {
    if (server === undefined) {
        server = net.createServer(listener => {
            socket = listener;

            // TODO: Authentication on connection
            console.log("Server is connected to client.");

            listener.on('data', data => {
                //TODO: decrypt data
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
        console.error("Stop the server before starting a new instance.");
    }
}


function send(data) {
    if (socket) {
        //TODO: encrypt data

        socket.write(data);
        console.log(data);
    } else {
        console.error("The server must be started first.");
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

//Exports
module.exports.start = start;
module.exports.send = send;
module.exports.stop = stop;