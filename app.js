const restify = require('restify');
const VPNServer = require('./server.js');
const VPNClient = require('./client.js');

const UIServer = restify.createServer();
const MODES = {SERVER: "server", CLIENT: "client"};

let currentMode = "server";

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
    if (req.body && MODES[req.body] !== undefined) {
        stopConnections();
        currentMode = MODES[req.body];
    } else {
        res.send(new Error("Valid modes are: [" + Object.values(MODES).join(", ") + "]"));
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

        VPNClient.start(host, port);
    }
    next();
}

/**
 * Used in server mode to listen for a client connection given the port.
 * @param req - payload should contain {port: <port>>}
 * @param res
 * @param next
 */
function listenForClient(req, res, next) {
    if (req.body && req.body.port) {
        let port = req.body.port;

        VPNServer.start("0.0.0.0", port);
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
            VPNServer.send(message);
        } else if (currentMode === MODES.SERVER) {
            VPNClient.send(message);
        } else {
            console.error("Invalid mode: " + currentMode);
        }
    }
    next();
}

/**
 * Stops the active connection.
 */
function stopConnections() {
    if (currentMode === MODES.SERVER) {
        VPNServer.stop();
    } else if (currentMode === MODES.SERVER) {
        VPNClient.stop();
    }
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
    UIServer.get('/\*', restify.plugins.serveStatic({
        directory: './public',
        default: 'index.html'
    }));

    UIServer.listen(8080, "127.0.0.1", function () {
        console.log("UI is accessible at http://127.0.0.1:8080");
    });
}

serveUI();