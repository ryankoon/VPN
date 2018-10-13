const net = require('net');
let client;

//TODO: custom IP:Port
function start(host, port) {
    if (client === undefined) {
        client = new net.Socket();

        client.connect(port, host, () => {
            console.log("Client is connected to " + host + ":" + port);

            // TODO: Authentication on connection
            // send('Welcome Server!');
        });

        client.on('data', function (data) {
            //TODO: decrypt data
        });

        client.on('close', function () {
            console.log('Connection closed');
        });
    }
}

function send(data) {
    if (client) {
        //TODO: encrypt data

        client.write(data);
        console.log(data);
    }
}


function stop() {
    if (client) {
        client.destroy();
        client = undefined;
    }
}

//Exports
module.exports.start = start;
module.exports.send = send;
module.exports.stop = stop;