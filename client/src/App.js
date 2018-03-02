import React, {Component} from 'react';
import logo from './imgs/daisy.svg';
import './App.css';
import io from 'socket.io-client';
import JSMpeg from 'jsmpeg-player';


// const socket = io('10.0.0.244:5000');
const socket = io('localhost:5000');

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: '',
            chat: '',
            wrong: false,
            watch: 0,
            stream: false,
            chatMsg: []
        };

        this.startStream = this.startStream.bind(this);

        this.handlePassChange = this.handlePassChange.bind(this);
        this.handlePassSubmit = this.handlePassSubmit.bind(this);

        this.handleChatChange = this.handleChatChange.bind(this);
        this.handleChatSubmit = this.handleChatSubmit.bind(this);

    }

    componentDidMount() {

        socket.on('liveStream', ( streamUrl ) => {
            this.setState({
                stream: true
            });
            this.startStream( streamUrl );
        });

        socket.on('watch', (watch) => {
            this.setState({
                watch: watch
            });
        });

        socket.on('chatMsg', (chatMsg) => {
            let msgArray = this.state.chatMsg.slice();
            msgArray.push(chatMsg);

            this.setState({
                chatMsg: msgArray
            });
        });

        socket.on('wrong-password', () => {
            this.setState({
                wrong: true,
                value: ''
            })
        });
    }

    startStream( streamUrl ) {
        console.log (this.myCanvas);
        new JSMpeg.VideoElement( this.myCanvas, streamUrl, {
            loop: false,
            audio: false,
            pauseWhenHidden: false,
            aspectPercent: '65%'
        });
    }

    handlePassChange(event) {
        this.setState({
            value: event.target.value,
            wrong: false
        });
    }

    handlePassSubmit(event) {
        let password = this.state.value;
        socket.emit( 'start-stream', password );
        event.preventDefault();
    }

    handleChatChange(event) {
        this.setState({
            chat: event.target.value
        });
    }

    handleChatSubmit(event) {
        let chatText = this.state.chat;
        socket.emit( 'chatText', chatText );
        this.setState ({
            chat: ''
        });
        event.preventDefault();
    }

    handlePassword () {
        if ( this.state.stream ) {
            return (
                <div>
                    <div id='stream' ref={ canvas => { this.myCanvas = canvas; }} />
                    <ul>
                      { this.state.chatMsg.map(( msg ) => ( <li key={msg} >{ msg }</li> ))}
                    </ul>
                    <form id={'chat'} onSubmit={this.handleChatSubmit}>
                        <label>
                            Daisy chat:
                            <input type={'text'} value={this.state.chat} onChange={this.handleChatChange}/>
                        </label>
                            <input className={'btn'} type="submit" value="Send!"/>
                    </form>
                </div>
            )
        }
    }

    handleForm () {
        if ( !this.state.stream ) {
            return (
                <form id={'pass'} onSubmit={this.handlePassSubmit}>
                    <label>
                        Password:
                        <input type={'password'} value={this.state.value} className={ (this.state.wrong ? 'wrong': '') } onChange={this.handlePassChange}/>
                    </label>
                    <input className={'btn'} type="submit" value="Watch Now!"/>
                </form>
            )
        }
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <h1 className={'App-title'}>Daisy Cam</h1>
                </header>
                { this.handlePassword() }
                { this.handleForm() }
                <div className={'counter'}>{ this.state.stream ? this.state.watch : this.state.watch -1 }</div>
            </div>
        );
    }
}

export default App;
