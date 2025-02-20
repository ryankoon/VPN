const restify = require('restify');
const VPNServer = require('./server.js');
const VPNClient = require('./client.js');
const WSServer = require("ws").Server;
const {app} = require('electron');
const {UIPORT} = require("./public/src/properties");

const UIServer = restify.createServer();
const WebSocketServer = new WSServer({server: UIServer.server});
let WebSocket;
WebSocketServer.on('connection', socket => {
    WebSocket = socket;
});

const MODES = {SERVER: "SERVER", CLIENT: "CLIENT"};
const APPROOT = app.getAppPath();

let currentMode;

function webSocketSend(message) {
    console.log(message);
    if (WebSocket) {
        WebSocket.send(message);
    }
}

/**
 * Stepping
 * @param req
 * @param res
 * @param next
 */
function proceed(req, res, next) {
    if (currentMode === MODES.SERVER) {
        promiseHandler(res, VPNServer.executeNextStep());
    } else if (currentMode === MODES.CLIENT) {
        promiseHandler(res, VPNClient.executeNextStep());
    } else {
        res.send(400, new Error("Please select a mode: [server, client]"));
    }
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
    if (req.body && req.body.host && req.body.port && req.body.secret) {
        let host = req.body.host;
        let port = req.body.port;
        let secret = req.body.secret;

        VPNClient.start(host, port, secret)
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
    if (req.body && req.body.port && req.body.secret) {
        let port = req.body.port;
        let secret = req.body.secret;

        VPNServer.start("0.0.0.0", port, secret)
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
            promiseHandler(res, VPNServer.send_encry(message));
        } else if (currentMode === MODES.CLIENT) {
            promiseHandler(res, VPNClient.send_encry(message));
        } else {
            console.error("Invalid mode: " + currentMode);
            res.send(500, "Invalid mode. Please restart the application.");
        }
    } else {
        res.send(400);
    }
    next();
}

function promiseHandler(response, promise) {
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


function broadcastContinueHint() {
    webSocketSend('>>>>>>PRESS CONTINUE BUTTON>>>>>>');
}

function broadcastReadyToSendMessages() {
    webSocketSend('+++++++Ready to send/receive messages+++++++');
}

/**
 * Starts serving the UI to set up a connection.
 */
function serveUI() {
    console.log("SERVEUI");
    UIServer.use(restify.plugins.queryParser());
    UIServer.use(restify.plugins.bodyParser());

    //Endpoints
    UIServer.post('/continue', proceed);
    UIServer.post('/mode', switchMode);
    UIServer.post('/connect', connectToServer);
    UIServer.post('/serve', listenForClient);
    UIServer.post('/sendMessage', sendMessage);
    UIServer.get('/*', restify.plugins.serveStatic({
        directory: APPROOT + '/public',
        default: 'index.html'
    }));

    UIServer.listen(UIPORT, "127.0.0.1", function () {
        console.log("UI is accessible at http://127.0.0.1:" + UIPORT);
    });
}

serveUI();

//Exports
module.exports.webSocketSend = webSocketSend;
module.exports.broadcastContinueHint = broadcastContinueHint;
module.exports.broadcastReadyToSendMessages = broadcastReadyToSendMessages;