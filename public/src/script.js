window.addEventListener("load", setup);
const e = React.createElement;

function setup() { 
    const select = document.querySelector("#select");
    ReactDOM.render(e(ModeSelect), select);
    const stepContainer = document.querySelector("#container-step");
    ReactDOM.render(e(Step), stepContainer);
}


class ServerForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Port: "",
            Secret: ""
        }

        this.handlePortChange = this.handlePortChange.bind(this);
        this.handleSecretChange = this.handleSecretChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handlePortChange(event) {this.setState({Port: event.target.value});}
    handleSecretChange(event) {this.setState({Secret: event.target.value});}
    handleSubmit(event) {
        console.log('port=' + this.state.Port);
        fetch('./serve', {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: 'port=' + this.state.Port
        })
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
    render() {
        return (
            <div>
                <h2>Server</h2>
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <label htmlFor="serverPort">Port:</label>
                        <input id="serverPort" type="text" placeholder="Server Port" value={this.state.Port} onChange={this.handlePortChange}/>
                    </div>
                    <div>
                        <label htmlFor="serverSecret">Secret:</label>
                        <input id="serverSecret" type="text" placeholder="Secret" value={this.state.Secret} onChange={this.handleSecretChange}/>
                    </div>
                    <div>
                        <button type="submit">Start server</button>
                    </div>
                </form>
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
        }

        this.handleIPChange = this.handleIPChange.bind(this);
        this.handlePortChange = this.handlePortChange.bind(this);
        this.handleSecretChange = this.handleSecretChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleIPChange(event) {this.setState({IP: event.target.value});}
    handlePortChange(event) {this.setState({Port: event.target.value});}
    handleSecretChange(event) {this.setState({Secret: event.target.value});}
    handleSubmit(event) {
        console.log("host=" + this.state.IP + "&port=" + this.state.Port);
        fetch('./connect', {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: "host=" + this.state.IP + "&port=" + this.state.Port
        })
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

    render() {
        return (
            <div>
                <h2>Client</h2>
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <label htmlFor="ipaddress">IP Address: </label>
                        <input id="ipaddress" type="text" placeholder="IP Address" value={this.state.IP} onChange={this.handleIPChange}/>
                    </div>
                    <div>
                        <label htmlFor="port">Port: </label>
                        <input id="port" type="text" placeholder="Port" value={this.state.Port} onChange={this.handlePortChange}/>
                    </div>
                    <div>
                        <label htmlFor="clientSecret">Secret:</label>
                        <input id="clientSecret" type="text" placeholder="Secret" value={this.state.Secret} onChange={this.handleSecretChange}/>
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
        }
        this.handleModeChange = this.handleModeChange.bind(this);
    }
    
    handleModeChange(event) {
        this.setState({mode: event.currentTarget.value})
        if (event.currentTarget.value === 'CLIENT MODE') {
            const cont = document.querySelector("#content");
            ReactDOM.render(e(ClientForm), cont);
        }
        if (event.currentTarget.value === 'SERVER MODE') {
            const cont = document.querySelector("#content");
            ReactDOM.render(e(ServerForm), cont);
        }
        const send = document.querySelector("#send");
        ReactDOM.render(e(MessageSend), send);
        const cons = document.querySelector("#console");
        ReactDOM.render(e(MessageReceive), cons);
    }

    render() {
        return (
            <div>
                <h3>{this.state.mode}</h3>
                <div onChange={this.handleIPChange}>
                    <label htmlFor="client">Client</label>
                    <input 
                        id="client"
                        type="radio"
                        value="CLIENT MODE"
                        checked={this.state.mode === 'CLIENT MODE'}
                        onChange={this.handleModeChange}
                    />
                    <label htmlFor="server">Server</label>
                    <input 
                        id="server"
                        type="radio"
                        value="SERVER MODE" 
                        checked={this.state.mode === 'SERVER MODE'}
                        onChange={this.handleModeChange}
                    />
                </div>
            </div>
        )
    }
}

class MessageSend extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Message: ''
        }
        this.handleMessageChange = this.handleMessageChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleMessageChange(event) {this.setState({Message: event.target.value});}
    handleSubmit(event) {
        console.log("message=" + this.state.Message);
        fetch('./sendMessage', {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: "message=" + this.state.Message
        })
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
        this.setState({Message: ''});
        event.preventDefault();
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <textarea rows="4" cols="50" name="message" value={this.state.Message} onChange={this.handleMessageChange}>
                        
                    </textarea>
                    <button type="submit">Send Message</button>
                </form>
            </div>
        )
    }
}

class MessageReceive extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            Message: ''
        }
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleMessageChange(event) {this.setState({Message: event.target.value});}
    handleSubmit(event) {
        console.log("message=" + this.state.Message);
        fetch('./sendMessage', {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: "message=" + this.state.Message
        })
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
        )
        this.setState({Message: ''});
        event.preventDefault();
    }

    render() {
        return (
            <div>{this.state.Message}</div>
        )
    }
}

class Step extends React.Component {
    render() {
        return (
            <div>
                <button id="continue-btn">Continue</button>
            </div>
        )
    }
}

function setMode(mode) {
    fetch('./mode', {
        method: 'post',
        headers: {
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: mode
    })
}
/*
function proceed() {
    const httpReq = new XMLHttpRequest();
    httpReq.open("POST", "/continue", true);
    httpReq.send();
}
*/