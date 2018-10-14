const restify = require('restify');
const VPNServer = require('./server.js');
const VPNClient = require('./client.js');

const UIServer = restify.createServer();
const MODES = {SERVER: "SERVER", CLIENT: "CLIENT"};

let currentMode;

function proceed(req, res, next) {
    //TODO: Allow stepping
    console.log("No-op: Continue request received.");
    next();
}

/**
 * Switches the application to the given mode provided that it is a valid {@link MODES mode}.
 * This will stop existing connections.
 * @param req
 * @param res
 * @param next
 */
function switchMode(req, res, next) {
    let body;
    console.log(req.body);
    try {
        body = JSON.parse(req.body);
    } catch (e) {
        console.log(e);
    }
    if (body && MODES[body.mode] !== undefined) {
        stopConnections()
            .then(() => {
                currentMode = MODES[body.mode];
                res.send(200, currentMode);
            })
            .catch(err => {
                res.send(500, err);
            });
    } else {
        res.send(400, "Valid modes are: [" + Object.values(MODES).join(", ") + "]");
    }
    next();
}

/**
 * Used in client mode to connect to a server given the host and port.
 * @param req - payload should contain {host: <host>, port: <port>}
 * @param res
 * @param next
 */
function connectToServer(req, res, next) {
    if (req.body && req.body.host && req.body.port) {
        let host = req.body.host;
        let port = req.body.port;

        VPNClient.start(host, port)
            .then(() => {
                res.send(200);
            })
            .catch(err => {
                res.send(500, err);
            });
    } else {
        res.send(400, "Invalid request. Payload should be {host: <host>, port: <port>}");
    }
    next();
}

/**
 * Used in server mode to listen for a client connection given the port.
 * @param req - payload should contain {port: <port>}
 * @param res
 * @param next
 */
function listenForClient(req, res, next) {
    if (req.body && req.body.port) {
        let port = req.body.port;

        VPNServer.start("0.0.0.0", port)
            .then(() => {
                res.send(200);
            })
            .catch(err => {
                res.send(500, err);
            });
    } else {
        res.send(400, "Invalid request. Payload should be {port: <port>}");
    }
    next();
}


/**
 * Sends an encrypted message to the connected client/server provided that the authentication has been completed.
 * @param req
 * @param res
 * @param next
 */
function sendMessage(req, res, next) {
    if (req.body && req.body.message) {
        let message = req.body.message;

        if (currentMode === MODES.SERVER) {
            sendMessageHandler(res, VPNServer.send(message));
        } else if (currentMode === MODES.SERVER) {
            sendMessageHandler(res, VPNClient.send(message));
        } else {
            console.error("Invalid mode: " + currentMode);
            res.send(500, "Invalid mode. Please restart the application.");
        }
    } else {
        res.send(400);
    }
    next();
}

function sendMessageHandler(response, promise) {
    promise
        .then(() => {
            response.send(200);
        })
        .catch(err => {
            response.send(500, err);
        });
}

/**
 * Stops the active connection.
 */
function stopConnections() {
    if (currentMode === MODES.SERVER) {
        return VPNServer.stop();
    } else if (currentMode === MODES.CLIENT) {
        return VPNClient.stop();
    } else if (currentMode === undefined) {
        return Promise.resolve();
    }

    return Promise.reject(new Error("Invalid Mode"));
}

/**
 * Starts serving the UI to set up a connection.
 */
function serveUI() {
    UIServer.use(restify.plugins.queryParser());
    UIServer.use(restify.plugins.bodyParser());

    //Endpoints
    UIServer.post('/continue', proceed);
    UIServer.post('/mode', switchMode);
    UIServer.post('/connect', connectToServer);
    UIServer.post('/serve', listenForClient);
    UIServer.post('/sendMessage', sendMessage);
    UIServer.get('/*', restify.plugins.serveStatic({
        directory: './public',
        default: 'index.html'
    }));

    UIServer.listen(8080, "127.0.0.1", function () {
        console.log("UI is accessible at http://127.0.0.1:8080");
    });
}

serveUI();

//Exports
module.exports.MODES = MODES;