var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable no-undef */
window.addEventListener("load", setup);
var e = React.createElement;
var logConsole;
var modeSelector;
var step;

function setup() {
    var select = document.querySelector("#select");
    modeSelector = ReactDOM.render(e(ModeSelect), select);
    var stepContainer = document.querySelector("#container-step");
    step = ReactDOM.render(e(Step), stepContainer);
    var logs = document.querySelector("#logs");
    logConsole = ReactDOM.render(e(LoggingConsole), logs);
}

var ServerForm = function (_React$Component) {
    _inherits(ServerForm, _React$Component);

    function ServerForm(props) {
        _classCallCheck(this, ServerForm);

        var _this = _possibleConstructorReturn(this, (ServerForm.__proto__ || Object.getPrototypeOf(ServerForm)).call(this, props));

        _this.state = {
            Running: false,
            Port: "",
            Secret: ""
        };

        _this.stopServer = _this.stopServer.bind(_this);
        _this.handlePortChange = _this.handlePortChange.bind(_this);
        _this.handleSecretChange = _this.handleSecretChange.bind(_this);
        _this.handleSubmit = _this.handleSubmit.bind(_this);
        return _this;
    }

    _createClass(ServerForm, [{
        key: "stopServer",
        value: function stopServer() {
            setMode('SERVER');
            this.setState({ Running: false });
            modeSelector.handleModeChange(null);
        }
    }, {
        key: "handlePortChange",
        value: function handlePortChange(event) {
            this.setState({ Port: event.target.value });
        }
    }, {
        key: "handleSecretChange",
        value: function handleSecretChange(event) {
            this.setState({ Secret: event.target.value });
        }
    }, {
        key: "handleSubmit",
        value: function handleSubmit(event) {
            console.log('port=' + this.state.Port);
            var comp = this;
            fetch('./serve', {
                method: 'post',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: 'port=' + this.state.Port + '&secret=' + this.state.Secret
            }).then(function (response) {
                if (response.status !== 200) {
                    console.log("ERROR: " + response.status);
                    logConsole.addLog("ERROR: " + response.status);
                    return;
                }
                // PARSE
                comp.setState({ Running: true });
                response.json().then(function (data) {
                    console.log(data);
                });
            }).catch(function (err) {
                console.log("Fetch Error :-S", err);
            });
            event.preventDefault();
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "h2",
                    null,
                    "Server"
                ),
                React.createElement(
                    "form",
                    { onSubmit: this.handleSubmit },
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "label",
                            { htmlFor: "serverPort" },
                            "Port:"
                        ),
                        React.createElement("input", { id: "serverPort", type: "text", placeholder: "Server Port", value: this.state.Port,
                            onChange: this.handlePortChange })
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "label",
                            { htmlFor: "serverSecret" },
                            "Secret:"
                        ),
                        React.createElement("input", { id: "serverSecret", type: "text", placeholder: "Secret", value: this.state.Secret,
                            onChange: this.handleSecretChange })
                    ),
                    React.createElement(
                        "div",
                        null,
                        this.state.Running ? null : React.createElement(
                            "button",
                            { type: "submit" },
                            "Start server"
                        )
                    )
                ),
                this.state.Running ? React.createElement(
                    "button",
                    { onClick: this.stopServer },
                    "Stop server"
                ) : null
            );
        }
    }]);

    return ServerForm;
}(React.Component);

var ClientForm = function (_React$Component2) {
    _inherits(ClientForm, _React$Component2);

    function ClientForm(props) {
        _classCallCheck(this, ClientForm);

        var _this2 = _possibleConstructorReturn(this, (ClientForm.__proto__ || Object.getPrototypeOf(ClientForm)).call(this, props));

        _this2.state = {
            IP: "",
            Port: "",
            Secret: ""
        };

        _this2.handleIPChange = _this2.handleIPChange.bind(_this2);
        _this2.handlePortChange = _this2.handlePortChange.bind(_this2);
        _this2.handleSecretChange = _this2.handleSecretChange.bind(_this2);
        _this2.handleSubmit = _this2.handleSubmit.bind(_this2);
        return _this2;
    }

    _createClass(ClientForm, [{
        key: "handleIPChange",
        value: function handleIPChange(event) {
            this.setState({ IP: event.target.value });
        }
    }, {
        key: "handlePortChange",
        value: function handlePortChange(event) {
            this.setState({ Port: event.target.value });
        }
    }, {
        key: "handleSecretChange",
        value: function handleSecretChange(event) {
            this.setState({ Secret: event.target.value });
        }
    }, {
        key: "handleSubmit",
        value: function handleSubmit(event) {
            console.log("host=" + this.state.IP + "&port=" + this.state.Port);
            fetch('./connect', {
                method: 'post',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: "host=" + this.state.IP + "&port=" + this.state.Port + "&secret=" + this.state.Secret
            }).then(function (response) {
                if (response.status !== 200) {
                    console.log("ERROR: " + response.status);
                    logConsole.addLog("ERROR: " + response.status);
                    // PARSE
                    response.json().then(function (data) {
                        if (data.code === "ECONNREFUSED") {
                            logConsole.addLog("server is not available\n");
                            alert("The server is unavailable. Ensure that the server is running.");
                        } else {
                            console.log(data);
                        }
                    }).catch(function (err) {
                        console.log(err);
                    });
                }
            }).catch(function (err) {
                console.log("Fetch Error :-S", err);
            });
            event.preventDefault();
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "h2",
                    null,
                    "Client"
                ),
                React.createElement(
                    "form",
                    { onSubmit: this.handleSubmit },
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "label",
                            { htmlFor: "ipaddress" },
                            "IP Address: "
                        ),
                        React.createElement("input", { id: "ipaddress", type: "text", placeholder: "IP Address", value: this.state.IP,
                            onChange: this.handleIPChange })
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "label",
                            { htmlFor: "port" },
                            "Port: "
                        ),
                        React.createElement("input", { id: "port", type: "text", placeholder: "Port", value: this.state.Port,
                            onChange: this.handlePortChange })
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "label",
                            { htmlFor: "clientSecret" },
                            "Secret:"
                        ),
                        React.createElement("input", { id: "clientSecret", type: "text", placeholder: "Secret", value: this.state.Secret,
                            onChange: this.handleSecretChange })
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "button",
                            { type: "submit" },
                            "Connect To Server"
                        )
                    )
                )
            );
        }
    }]);

    return ClientForm;
}(React.Component);

var ModeSelect = function (_React$Component3) {
    _inherits(ModeSelect, _React$Component3);

    function ModeSelect(props) {
        _classCallCheck(this, ModeSelect);

        var _this3 = _possibleConstructorReturn(this, (ModeSelect.__proto__ || Object.getPrototypeOf(ModeSelect)).call(this, props));

        _this3.state = {
            mode: ''
        };
        _this3.handleModeChange = _this3.handleModeChange.bind(_this3);
        return _this3;
    }

    _createClass(ModeSelect, [{
        key: "handleModeChange",
        value: function handleModeChange(event) {
            if (event) {
                var mode = event.currentTarget.value;
                this.setState({ mode: event.currentTarget.value });
                if (mode === 'CLIENT MODE') {
                    setMode("CLIENT").then(function () {
                        var cont = document.querySelector("#content");
                        ReactDOM.render(e(ClientForm), cont);
                        var send = document.querySelector("#send");
                        ReactDOM.render(e(MessageSend), send);
                    }).catch(function (err) {
                        logConsole.addLog("Error changing to client mode\n");
                        console.log(err);
                    });
                } else if (mode === 'SERVER MODE') {
                    setMode("SERVER").then(function () {
                        var cont = document.querySelector("#content");
                        ReactDOM.render(e(ServerForm), cont);
                        var send = document.querySelector("#send");
                        ReactDOM.render(e(MessageSend), send);
                    }).catch(function (err) {
                        logConsole.addLog("Error changing to server mode\n");
                        console.log(err);
                    });
                } else {
                    console.log("ERROR");
                    alert("ERROR");
                }
            } else {
                this.setState({ mode: '' });
                var cont = document.querySelector("#content");
                ReactDOM.render(null, cont);
                var send = document.querySelector("#send");
                ReactDOM.render(null, send);
                var cons = document.querySelector("#console");
                ReactDOM.render(null, cons);
            }
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { onChange: this.handleIPChange },
                    React.createElement("input", {
                        id: "client",
                        type: "radio",
                        value: "CLIENT MODE",
                        checked: this.state.mode === 'CLIENT MODE',
                        onChange: this.handleModeChange
                    }),
                    React.createElement(
                        "label",
                        { htmlFor: "client" },
                        "Client"
                    ),
                    React.createElement("input", {
                        id: "server",
                        type: "radio",
                        value: "SERVER MODE",
                        checked: this.state.mode === 'SERVER MODE',
                        onChange: this.handleModeChange
                    }),
                    React.createElement(
                        "label",
                        { htmlFor: "server" },
                        "Server"
                    )
                ),
                React.createElement(
                    "h3",
                    null,
                    this.state.mode
                )
            );
        }
    }]);

    return ModeSelect;
}(React.Component);

var MessageSend = function (_React$Component4) {
    _inherits(MessageSend, _React$Component4);

    function MessageSend(props) {
        _classCallCheck(this, MessageSend);

        var _this4 = _possibleConstructorReturn(this, (MessageSend.__proto__ || Object.getPrototypeOf(MessageSend)).call(this, props));

        _this4.state = {
            Message: ''
        };
        _this4.handleMessageChange = _this4.handleMessageChange.bind(_this4);
        _this4.handleSubmit = _this4.handleSubmit.bind(_this4);
        return _this4;
    }

    _createClass(MessageSend, [{
        key: "handleMessageChange",
        value: function handleMessageChange(event) {
            this.setState({ Message: event.target.value });
        }
    }, {
        key: "handleSubmit",
        value: function handleSubmit(event) {
            if (this.state.Message && this.state.Message.length > 0) {
                console.log("message=" + this.state.Message);
                fetch('./sendMessage', {
                    method: 'post',
                    headers: {
                        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    body: "message=" + this.state.Message
                }).then(function (response) {
                    if (response.status !== 200) {
                        console.log("ERROR: " + response.status);
                        logConsole.addLog("ERROR: " + response.status);
                        // PARSE
                        response.json().then(function (data) {
                            console.log(data);
                        }).catch(function (err) {
                            console.log(err);
                        });
                    }
                }).catch(function (err) {
                    console.log("Fetch Error :-S", err);
                });
                this.setState({ Message: '' });
            }
            event.preventDefault();
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "form",
                    { onSubmit: this.handleSubmit },
                    React.createElement("textarea", { rows: "4", cols: "50", name: "message", value: this.state.Message,
                        onChange: this.handleMessageChange }),
                    React.createElement(
                        "button",
                        { type: "submit" },
                        "Send Message"
                    )
                )
            );
        }
    }]);

    return MessageSend;
}(React.Component);

var LoggingConsole = function (_React$Component5) {
    _inherits(LoggingConsole, _React$Component5);

    function LoggingConsole(props) {
        _classCallCheck(this, LoggingConsole);

        var _this5 = _possibleConstructorReturn(this, (LoggingConsole.__proto__ || Object.getPrototypeOf(LoggingConsole)).call(this, props));

        _this5.state = {
            Log: ''
        };

        _this5.clearLog = _this5.clearLog.bind(_this5);
        _this5.addLog = _this5.addLog.bind(_this5);

        var wsAddr = "ws://localhost:" + UIPORT;
        var socket = new WebSocket(wsAddr);

        socket.addEventListener('message', function (event) {
            console.log('Websocket message: ', event.data);
            _this5.addLog(event.data);
        });
        socket.addEventListener('close', function (event) {
            var msg = "Websocket closed. Application may need to be restarted to work properly.";
            console.log(msg, event);
            _this5.addLog(msg);
            _this5.addLog(event.reason);
        });
        socket.addEventListener('error', function (event) {
            console.log('Websocket error: ', event);
            _this5.addLog("Websocket error. Application may need to be restarted to work properly.");
            _this5.addLog(event);
        });
        return _this5;
    }

    _createClass(LoggingConsole, [{
        key: "clearLog",
        value: function clearLog() {
            this.setState({ Log: '' });
        }
    }, {
        key: "addLog",
        value: function addLog(data) {
            var log = this.state.Log + '\n' + data;
            this.setState({ Log: log });
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "button",
                    { onClick: this.clearLog },
                    "Clear Log"
                ),
                React.createElement(
                    "h3",
                    null,
                    "Log:"
                ),
                React.createElement(
                    "div",
                    { id: "log-view" },
                    this.state.Log
                )
            );
        }
    }]);

    return LoggingConsole;
}(React.Component);

var Step = function (_React$Component6) {
    _inherits(Step, _React$Component6);

    function Step(props) {
        _classCallCheck(this, Step);

        var _this6 = _possibleConstructorReturn(this, (Step.__proto__ || Object.getPrototypeOf(Step)).call(this, props));

        _this6.handleContinue = _this6.handleContinue.bind(_this6);
        return _this6;
    }

    _createClass(Step, [{
        key: "handleContinue",
        value: function handleContinue() {
            fetch('./continue', {
                method: 'post',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: ""
            }).then(function (response) {
                if (response.status !== 200) {
                    console.log("ERROR: " + response.status);
                    logConsole.addLog("ERROR: " + response.status);
                    // PARSE
                    response.json().then(function (data) {
                        console.log(data);
                    }).catch(function (err) {
                        console.log(err);
                    });
                }
            }).catch(function (err) {
                console.log("Fetch Error :-S", err);
            });
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "button",
                    { id: "continue-btn", onClick: this.handleContinue },
                    "Continue"
                )
            );
        }
    }]);

    return Step;
}(React.Component);

function setMode(mode) {
    return fetch('./mode', {
        method: 'post',
        body: JSON.stringify({ "mode": mode })
    });
}

/*
function proceed() {
    const httpReq = new XMLHttpRequest();
    httpReq.open("POST", "/continue", true);
    httpReq.send();
}
*/