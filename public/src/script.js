/* eslint-disable no-undef */
window.addEventListener("load", setup);
const e = React.createElement;
var logConsole;
var modeSelector;
var step;

function setup() {
    const select = document.querySelector("#select");
    modeSelector = ReactDOM.render(e(ModeSelect), select);
    const stepContainer = document.querySelector("#container-step");
    step = ReactDOM.render(e(Step), stepContainer);
    const logs = document.querySelector("#logs");
    logConsole = ReactDOM.render(e(LoggingConsole), logs);
}


class ServerForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Running: false,
            Port: "",
            Secret: ""
        };

        this.stopServer = this.stopServer.bind(this);
        this.handlePortChange = this.handlePortChange.bind(this);
        this.handleSecretChange = this.handleSecretChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    stopServer() {
        setMode('SERVER');
        this.setState({Running: false});
        modeSelector.handleModeChange(null);
    }

    handlePortChange(event) {
        this.setState({Port: event.target.value});
    }

    handleSecretChange(event) {
        this.setState({Secret: event.target.value});
    }

    handleSubmit(event) {
        console.log('port=' + this.state.Port);
        let comp = this;
        fetch('./serve', {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: 'port=' + this.state.Port + '&secret=' + this.state.Secret
        })
            .then(
                function (response) {
                    if (response.status !== 200) {
                        console.log("ERROR: " + response.status);
                        logConsole.addLog("ERROR: " + response.status);
                        return;
                    }
                    // PARSE
                    comp.setState({Running: true});
                    response.json().then(
                        function (data) {
                            console.log(data);
                        }
                    )
                }
            )
            .catch(
                function (err) {
                    console.log("Fetch Error :-S", err);
                }
            );
        event.preventDefault();
    }

    render() {
        return (
            <div>
                <h2>Server</h2>
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <label htmlFor="serverPort">Port:</label>
                        <input id="serverPort" type="text" placeholder="Server Port" value={this.state.Port}
                               onChange={this.handlePortChange}/>
                    </div>
                    <div>
                        <label htmlFor="serverSecret">Secret:</label>
                        <input id="serverSecret" type="text" placeholder="Secret" value={this.state.Secret}
                               onChange={this.handleSecretChange}/>
                    </div>
                    <div>
                        {
                            this.state.Running ? null : <button type="submit">Start server</button>
                        }
                    </div>
                </form>
                {
                    this.state.Running ? <button onClick={this.stopServer}>Stop server</button> : null
                }
            </div>
        )
    }
}

class ClientForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            IP: "",
            Port: "",
            Secret: ""
        };

        this.handleIPChange = this.handleIPChange.bind(this);
        this.handlePortChange = this.handlePortChange.bind(this);
        this.handleSecretChange = this.handleSecretChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleIPChange(event) {
        this.setState({IP: event.target.value});
    }

    handlePortChange(event) {
        this.setState({Port: event.target.value});
    }

    handleSecretChange(event) {
        this.setState({Secret: event.target.value});
    }

    handleSubmit(event) {
        console.log("host=" + this.state.IP + "&port=" + this.state.Port);
        fetch('./connect', {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: "host=" + this.state.IP + "&port=" + this.state.Port + "&secret=" + this.state.Secret
        })
            .then(
                function (response) {
                    if (response.status !== 200) {
                        console.log("ERROR: " + response.status);
                        logConsole.addLog("ERROR: " + response.status);
                        // PARSE
                        response.json()
                            .then(
                                function (data) {
                                    if (data.code === "ECONNREFUSED") {
                                        logConsole.addLog("server is not available\n");
                                        alert("The server is unavailable. Ensure that the server is running.")
                                    } else {
                                        console.log(data);
                                    }
                                }
                            )
                            .catch(err => {
                                console.log(err);
                            })
                    }
                }
            )
            .catch(
                function (err) {
                    console.log("Fetch Error :-S", err);
                }
            );
        event.preventDefault();
    }

    render() {
        return (
            <div>
                <h2>Client</h2>
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <label htmlFor="ipaddress">IP Address: </label>
                        <input id="ipaddress" type="text" placeholder="IP Address" value={this.state.IP}
                               onChange={this.handleIPChange}/>
                    </div>
                    <div>
                        <label htmlFor="port">Port: </label>
                        <input id="port" type="text" placeholder="Port" value={this.state.Port}
                               onChange={this.handlePortChange}/>
                    </div>
                    <div>
                        <label htmlFor="clientSecret">Secret:</label>
                        <input id="clientSecret" type="text" placeholder="Secret" value={this.state.Secret}
                               onChange={this.handleSecretChange}/>
                    </div>
                    <div>
                        <button type="submit">Connect To Server</button>
                    </div>
                </form>
            </div>
        )
    }
}

class ModeSelect extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mode: ''
        };
        this.handleModeChange = this.handleModeChange.bind(this);
    }

    handleModeChange(event) {
        if (event) {
            let mode = event.currentTarget.value;
            this.setState({mode: event.currentTarget.value});
            if (mode === 'CLIENT MODE') {
                setMode("CLIENT")
                    .then(() => {
                        const cont = document.querySelector("#content");
                        ReactDOM.render(e(ClientForm), cont);
                        const send = document.querySelector("#send");
                        ReactDOM.render(e(MessageSend), send);
                    })
                    .catch(err => {
                        logConsole.addLog("Error changing to client mode\n");
                        console.log(err);
                    })
            } else if (mode === 'SERVER MODE') {
                setMode("SERVER")
                    .then(() => {
                        const cont = document.querySelector("#content");
                        ReactDOM.render(e(ServerForm), cont);
                        const send = document.querySelector("#send");
                        ReactDOM.render(e(MessageSend), send);
                    })
                    .catch(err => {
                        logConsole.addLog("Error changing to server mode\n");
                        console.log(err);
                    })
            } else {
                console.log("ERROR");
                alert("ERROR");
            }
        } else {
            this.setState({mode: ''});
            const cont = document.querySelector("#content");
            ReactDOM.render(null, cont);
            const send = document.querySelector("#send");
            ReactDOM.render(null, send);
            const cons = document.querySelector("#console");
            ReactDOM.render(null, cons);
        }
    }

    render() {
        return (
            <div>
                <div onChange={this.handleIPChange}>
                    <input
                        id="client"
                        type="radio"
                        value="CLIENT MODE"
                        checked={this.state.mode === 'CLIENT MODE'}
                        onChange={this.handleModeChange}
                    />
                    <label htmlFor="client">Client</label>
                    <input
                        id="server"
                        type="radio"
                        value="SERVER MODE"
                        checked={this.state.mode === 'SERVER MODE'}
                        onChange={this.handleModeChange}
                    />
                    <label htmlFor="server">Server</label>
                </div>
                <h3>{this.state.mode}</h3>
            </div>
        )
    }
}

class MessageSend extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Message: ''
        };
        this.handleMessageChange = this.handleMessageChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleMessageChange(event) {
        this.setState({Message: event.target.value});
    }

    handleSubmit(event) {
        if (this.state.Message && this.state.Message.length > 0) {
            console.log("message=" + this.state.Message);
            fetch('./sendMessage', {
                method: 'post',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: "message=" + this.state.Message
            })
                .then(
                    function (response) {
                        if (response.status !== 200) {
                            console.log("ERROR: " + response.status);
                            logConsole.addLog("ERROR: " + response.status);
                            // PARSE
                            response.json()
                                .then(
                                    function (data) {
                                        console.log(data);
                                    })
                                .catch(err => {
                                    console.log(err);
                                });
                        }
                    }
                )
                .catch(
                    function (err) {
                        console.log("Fetch Error :-S", err);
                    }
                );
            this.setState({Message: ''});
        }
        event.preventDefault();
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <textarea rows="4" cols="50" name="message" value={this.state.Message}
                              onChange={this.handleMessageChange}>
                        
                    </textarea>
                    <button type="submit">Send Message</button>
                </form>
            </div>
        )
    }
}

class LoggingConsole extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Log: ''
        };

        this.clearLog = this.clearLog.bind(this);
        this.addLog = this.addLog.bind(this);

        let wsAddr = "ws://localhost:" + UIPORT;
        let socket = new WebSocket(wsAddr);

        socket.addEventListener('message', event => {
            console.log('Websocket message: ', event.data);
            this.addLog(event.data);
        });
        socket.addEventListener('close', event => {
            let msg = "Websocket closed. Application may need to be restarted to work properly.";
            console.log(msg, event);
            this.addLog(msg);
            this.addLog(event.reason);
        });
        socket.addEventListener('error', event => {
            console.log('Websocket error: ', event);
            this.addLog("Websocket error. Application may need to be restarted to work properly.");
            this.addLog(event);
        });
    }

    clearLog() {
        this.setState({Log: ''});
    }

    addLog(data) {
        let log = this.state.Log + '\n' + data;
        this.setState({Log: log});
    }

    render() {
        return (
            <div>
                <button onClick={this.clearLog}>Clear Log</button>
                <h3>Log:</h3>
                <div>{this.state.Log}</div>
            </div>
        )
    }

}

class Step extends React.Component {
    constructor(props) {
        super(props);

        this.handleContinue = this.handleContinue.bind(this);
    }

    handleContinue() {
        fetch('./continue', {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: ""
        })
            .then(
                function (response) {
                    if (response.status !== 200) {
                        console.log("ERROR: " + response.status);
                        logConsole.addLog("ERROR: " + response.status);
                        // PARSE
                        response.json()
                            .then(
                                function (data) {
                                    console.log(data);
                                })
                            .catch(err => {
                                console.log(err);
                            });
                    }
                }
            )
            .catch(
                function (err) {
                    console.log("Fetch Error :-S", err);
                }
            );
    }

    render() {
        return (
            <div>
                <button id="continue-btn" onClick={this.handleContinue}>Continue</button>
            </div>
        )
    }
}

function setMode(mode) {
    return fetch('./mode', {
        method: 'post',
        body: JSON.stringify({"mode": mode})
    });
}


/*
function proceed() {
    const httpReq = new XMLHttpRequest();
    httpReq.open("POST", "/continue", true);
    httpReq.send();
}
*/