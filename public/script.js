var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

window.addEventListener("load", setup);
var e = React.createElement;

function setup() {
    var select = document.querySelector("#select");
    ReactDOM.render(e(ModeSelect), select);
    var stepContainer = document.querySelector("#container-step");
    ReactDOM.render(e(Step), stepContainer);
}

var ServerForm = function (_React$Component) {
    _inherits(ServerForm, _React$Component);

    function ServerForm(props) {
        _classCallCheck(this, ServerForm);

        var _this = _possibleConstructorReturn(this, (ServerForm.__proto__ || Object.getPrototypeOf(ServerForm)).call(this, props));

        _this.state = {
            Port: "",
            Secret: ""
        };

        _this.handlePortChange = _this.handlePortChange.bind(_this);
        _this.handleSecretChange = _this.handleSecretChange.bind(_this);
        _this.handleSubmit = _this.handleSubmit.bind(_this);
        return _this;
    }

    _createClass(ServerForm, [{
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
            fetch('./serve', {
                method: 'post',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: 'port=' + this.state.Port
            });
            /* NO RESPONSE EXPECTED
            .then(
                function(response) {
                    if (response.status !== 200) {
                        console.log("ERROR");
                        return;
                    }
                    // PARSE
                    response.json().then(
                        function(data) {
                            console.log(data);
                        }
                    )
                }
            )
            .catch(
                function(err) {
                    console.log("Fetch Error :-S", err);
                }
            )*/
            setMode("SERVER");
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
                        React.createElement("input", { id: "serverPort", type: "text", placeholder: "Server Port", value: this.state.Port, onChange: this.handlePortChange })
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "label",
                            { htmlFor: "serverSecret" },
                            "Secret:"
                        ),
                        React.createElement("input", { id: "serverSecret", type: "text", placeholder: "Secret", value: this.state.Secret, onChange: this.handleSecretChange })
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "button",
                            { type: "submit" },
                            "Start server"
                        )
                    )
                )
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
                body: "host=" + this.state.IP + "&port=" + this.state.Port
            });
            /* NO RESPONSE EXPECTED
            .then(
                function(response) {
                    if (response.status !== 200) {
                        console.log("ERROR");
                        return;
                    }
                    // PARSE
                    response.json().then(
                        function(data) {
                            console.log(data);
                        }
                    )
                }
            )
            .catch(
                function(err) {
                    console.log("Fetch Error :-S", err);
                }
            )*/
            setMode("CLIENT");
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
                        React.createElement("input", { id: "ipaddress", type: "text", placeholder: "IP Address", value: this.state.IP, onChange: this.handleIPChange })
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "label",
                            { htmlFor: "port" },
                            "Port: "
                        ),
                        React.createElement("input", { id: "port", type: "text", placeholder: "Port", value: this.state.Port, onChange: this.handlePortChange })
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "label",
                            { htmlFor: "clientSecret" },
                            "Secret:"
                        ),
                        React.createElement("input", { id: "clientSecret", type: "text", placeholder: "Secret", value: this.state.Secret, onChange: this.handleSecretChange })
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
            this.setState({ mode: event.currentTarget.value });
            if (event.currentTarget.value === 'CLIENT MODE') {
                var cont = document.querySelector("#content");
                ReactDOM.render(e(ClientForm), cont);
            }
            if (event.currentTarget.value === 'SERVER MODE') {
                var _cont = document.querySelector("#content");
                ReactDOM.render(e(ServerForm), _cont);
            }
            var send = document.querySelector("#send");
            ReactDOM.render(e(MessageSend), send);
            var cons = document.querySelector("#console");
            ReactDOM.render(e(MessageReceive), cons);
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "h3",
                    null,
                    this.state.mode
                ),
                React.createElement(
                    "div",
                    { onChange: this.handleIPChange },
                    React.createElement(
                        "label",
                        { htmlFor: "client" },
                        "Client"
                    ),
                    React.createElement("input", {
                        id: "client",
                        type: "radio",
                        value: "CLIENT MODE",
                        checked: this.state.mode === 'CLIENT MODE',
                        onChange: this.handleModeChange
                    }),
                    React.createElement(
                        "label",
                        { htmlFor: "server" },
                        "Server"
                    ),
                    React.createElement("input", {
                        id: "server",
                        type: "radio",
                        value: "SERVER MODE",
                        checked: this.state.mode === 'SERVER MODE',
                        onChange: this.handleModeChange
                    })
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
            console.log("message=" + this.state.Message);
            fetch('./sendMessage', {
                method: 'post',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: "message=" + this.state.Message
            });
            /* NO RESPONSE EXPECTED
            .then(
                function(response) {
                    if (response.status !== 200) {
                        console.log("ERROR");
                        return;
                    }
                    // PARSE
                    response.json().then(
                        function(data) {
                            console.log(data);
                        }
                    )
                }
            )
            .catch(
                function(err) {
                    console.log("Fetch Error :-S", err);
                }
            )*/
            this.setState({ Message: '' });
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
                    React.createElement("textarea", { rows: "4", cols: "50", name: "message", value: this.state.Message, onChange: this.handleMessageChange }),
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

var MessageReceive = function (_React$Component5) {
    _inherits(MessageReceive, _React$Component5);

    function MessageReceive(props) {
        _classCallCheck(this, MessageReceive);

        var _this5 = _possibleConstructorReturn(this, (MessageReceive.__proto__ || Object.getPrototypeOf(MessageReceive)).call(this, props));

        _this5.state = {
            Message: ''
        };
        _this5.handleSubmit = _this5.handleSubmit.bind(_this5);
        return _this5;
    }

    _createClass(MessageReceive, [{
        key: "handleMessageChange",
        value: function handleMessageChange(event) {
            this.setState({ Message: event.target.value });
        }
    }, {
        key: "handleSubmit",
        value: function handleSubmit(event) {
            console.log("message=" + this.state.Message);
            fetch('./sendMessage', {
                method: 'post',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: "message=" + this.state.Message
            }).then(function (response) {
                if (response.status !== 200) {
                    console.log("ERROR");
                    return;
                }
                // PARSE
                response.json().then(function (data) {
                    console.log(data);
                });
            }).catch(function (err) {
                console.log("Fetch Error :-S", err);
            });
            this.setState({ Message: '' });
            event.preventDefault();
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                this.state.Message
            );
        }
    }]);

    return MessageReceive;
}(React.Component);

var Step = function (_React$Component6) {
    _inherits(Step, _React$Component6);

    function Step() {
        _classCallCheck(this, Step);

        return _possibleConstructorReturn(this, (Step.__proto__ || Object.getPrototypeOf(Step)).apply(this, arguments));
    }

    _createClass(Step, [{
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "button",
                    { id: "continue-btn" },
                    "Continue"
                )
            );
        }
    }]);

    return Step;
}(React.Component);

function setMode(mode) {
    fetch('./mode', {
        method: 'post',
        headers: {
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: mode
    });
}
/*
function proceed() {
    const httpReq = new XMLHttpRequest();
    httpReq.open("POST", "/continue", true);
    httpReq.send();
}
*/