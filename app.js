const restify = require('restify');
const VPNServer = require('./server.js');
const VPNClient = require('./client.js');

const UIServer = restify.createServer();
const MODES = {MODE_SERVER: "server", MODE_CLIENT: "client"};

let currentMode = "server";

function proceed(req, res, next) {
    //TODO: Allow stepping
    console.log("No-op: Continue request received.");
    next();
}

function switchMode(req, res, next) {
    if (req.body && MODES[req.body] !== undefined) {
        currentMode = MODES[req.body];
    } else {
        res.send(new Error("Valid modes are: [" + Object.values(MODES).join(", ") + "]"));
    }
    next();
}

function serveUI() {
    UIServer.use(restify.plugins.queryParser());
    UIServer.use(restify.plugins.bodyParser());

    //Endpoints
    UIServer.post('/continue', proceed);
    UIServer.post('/mode', switchMode);
    UIServer.get('/\*', restify.plugins.serveStatic({
        directory: './public',
        default: 'index.html'
    }));

    UIServer.listen(8080, "127.0.0.1", function () {
        console.log("UI is accessible at http://127.0.0.1:8080");
        VPNServer.start("127.0.0.1", 8123);
        VPNClient.start("127.0.0.1", 8123);
    });
}

serveUI();