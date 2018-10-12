const restify = require('restify');
const server = restify.createServer();


function connect(req, res, next) {
    console.log("Connecting to " + req.body.ip + ":" + req.body.port);
    res.send("Connected");
    next()
}

function proceed(req, res, next) {
    console.log("Continue");
}

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.post('/connect', connect);
server.post('/continue', proceed);

server.get('/\*', restify.plugins.serveStatic({
    directory: './public',
    default: 'index.html'
}));

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});