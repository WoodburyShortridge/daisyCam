import React, {Component} from 'react';
import logo from './imgs/daisy.svg';
import './App.css';
import env from './env.json';
import io from 'socket.io-client';
import JSMpeg from 'jsmpeg-player';
import ImageZoom from 'react-medium-image-zoom'
import Pagination from "react-js-pagination";
import ReactTooltip from 'react-tooltip'
import {Linear, Sine, TweenLite, TweenMax} from "gsap";

const socket = io(env.socketioAddress);

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: '',
            chat: '',
            wrong: false,
            watch: 0,
            stream: false,
            chatMsg: [],
            id: '',
            images: null,
            activePage: 1,
            submit: false
        };

        this.startStream = this.startStream.bind(this);

        this.handlePassChange = this.handlePassChange.bind(this);
        this.handlePassSubmit = this.handlePassSubmit.bind(this);

        this.handleChatChange = this.handleChatChange.bind(this);
        this.handleChatSubmit = this.handleChatSubmit.bind(this);

        this.handleSubmit = this.handleSubmit.bind(this);

    }

    componentDidMount() {

        this.callApi()
            .then(res => this.setState({ images: res.reverse() }))
            .catch(err => console.log(err));

        socket.on('liveStream', ( data ) => {
            this.setState({
                stream: true,
                id: data.id
            });
            this.startStream( data.camSocket );
        });

        socket.on('watch', (watch) => {
            this.setState({
                watch: watch
            });
        });

        socket.on('chatMsg', (data) => {
            let msgArray = this.state.chatMsg.slice();
            msgArray.push({
                chatMsg: data.chatText,
                id: data.id,
            });

            this.setState({
                chatMsg: msgArray
            });

            let msgBox = this.chatFrame;
            msgBox.scrollTop = msgBox.scrollHeight;

        });

        socket.on('wrong-password', () => {
            this.setState({
                wrong: true,
                value: ''
            })
        });

      window.addEventListener('DOMContentLoaded', this.animate(this.container));
    }

  callApi = async () => {
      let url = 'api/images';
      const response = await fetch(url);
      const body = await response.json();
      if (response.status !== 200) throw Error(body.message);
      return body;
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    let data = new FormData(event.target);
    let body = JSON.stringify({
      username: data.get('username'),
      email: data.get('email'),
    });

    const sendEmail = await fetch('/sign-up', {
      method: 'POST',
      body: body,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log(sendEmail);
    this.setState({ submit: true})
  };

  animate (contain) {

        TweenLite.set(".App", {perspective: 500});
        TweenLite.set(".daisy", {xPercent: "-50%", yPercent: "-50%"});

        const animm = (elm) => {
            TweenMax.to(elm, R(6, 15), {
                y: h,
                ease: Linear.easeInOut,
                repeat: -1,
                delay: -15
            });
            TweenMax.to(elm, R(4, 8), {
                x: '+=100',
                rotationZ: R(0, 180),
                repeat: -1,
                yoyo: true,
                ease: Sine.easeInOut
            });
            TweenMax.to(elm, R(2, 8), {
                rotationX: R(0, 360),
                rotationY: R(0, 360),
                repeat: -1,
                yoyo: true,
                ease: Sine.easeInOut,
                delay: -5,
            });
        };

        const R = (min, max) => {
            return min + Math.random() * (max - min)
        };

        let total = 6;
        let w = contain.scrollWidth, h = contain.scrollHeight;

        for (let i = 0; i < total; i++) {
            let Div = document.createElement('div');
            let daisyClass = 'daisy daisy_'+ i;
            TweenLite.set(Div, {attr: {class: daisyClass }, x: R(0, w), y: R(-500, -400), z: R(-200, 200)});
            contain.appendChild(Div);
            animm(Div);
        }
    }

    startStream( camSocket ) {
        new JSMpeg.VideoElement( this.myCanvas, 'ws://' + window.location.hostname + camSocket, {
        // for local dev
        // new JSMpeg.VideoElement( this.myCanvas, 'ws://' + 'home.d4isy.com:' + camSocket, {
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
            chat: '',
        });
        event.preventDefault();
    }

    handlePageChange(pageNumber) {
      console.log(`active page is ${pageNumber}`);
      this.setState({activePage: pageNumber});
    }

    takePhoto (event) {
        socket.emit( 'take-photo');
    }

    handlePassword () {
        if ( this.state.stream && this.state.images !== null) {
            let overlayZoomStyle = { overlay: { backgroundImage: 'linear-gradient(-134deg, #FF87F1 0%, #FF5959 100%)', opacity: 0.9 } };
            return (
              <div className="main">
              <div className="container">
                      <div id='stream' ref={ canvas => { this.myCanvas = canvas; }} />
                      <div id={'chatFrame'} ref={ chatFrame => { this.chatFrame = chatFrame; }}>
                          <ul>
                            { this.state.chatMsg.map(( msg ) => ( <li className={ (this.state.id === msg.id ? 'me' : '' )} key={ Math.random() } >{ msg.chatMsg }</li> ))}
                          </ul>
                      </div>
                      <form id={'chat'} onSubmit={this.handleChatSubmit}>
                              <input id={'chatBox'} aria-label={'chat'} type={'text'} value={this.state.chat} onChange={this.handleChatChange}/>
                              <input className={'btn'} type="submit" value="Chat!"/>
                      </form>
                      <h1>tensorflow d<span role="img" aria-label="dog face">🐶</span>isy detection</h1>
                      <ul className={"aiimgs"}>
                        { this.state.images.slice( (this.state.activePage - 1) * 16, (this.state.activePage - 1) * 16 + 16 ).map((item) => (
                          <li key={item}>
                            <ImageZoom
                                image={{
                                src: 'api/images/files/' + item,
                                alt: 'daisy',
                              }}
                              defaultStyles={ overlayZoomStyle }
                              key={item}
                            />
                          </li>
                        ))}
                      </ul>
                      <Pagination
                        activePage={this.state.activePage}
                        itemsCountPerPage={16}
                        totalItemsCount={this.state.images.length}
                        pageRangeDisplayed={4}
                        onChange={ this.handlePageChange.bind(this) }
                      />
              </div>
                <div className="email-wrapper">
                  { this.handleSignUp() }
                </div>
              </div>

            )
        }
    }

    handleSignUp () {
      if ( !this.state.submit ) {
        return (
          <form onSubmit={this.handleSubmit}>
            <label htmlFor="username">name
              <input id="username" name="username" type="text" />
            </label>
            <label htmlFor="email">email
              <input id="email" name="email" type="email" />
            </label>
            <input className={'btn'} type="submit" value="get alerts!"/>
          </form>
        )
      } else {
        return (
          <div className="thanks">
            <h1>😜 👻 🤖 👅 thanks 🐶 🦄 🐾 🧀</h1>
          </div>
        )
      }
    }

    handleForm () {
        if ( !this.state.stream ) {
            return (
                <form id={'pass'} onSubmit={this.handlePassSubmit}>
                    <label>
                        password:
                        <input type={'password'} value={this.state.value} className={ (this.state.wrong ? 'wrong': '') } onChange={this.handlePassChange}/>
                    </label>
                    <input className={'btn'} type="submit" value="watch now!"/>
                </form>
            )
        }
    }

    render() {
        return (
            <div className="Main-wrapper">
                <div className="App" ref={ container => { this.container = container; }}>
                    <header className="App-header">
                        <img src={logo} className="App-logo" alt="logo"/>
                        <h1 className={'App-title'}>d<span role="img" aria-label="dog face">🐶</span>isy cam</h1>
                    </header>
                    { this.handlePassword() }
                    { this.handleForm() }
                </div>
                <div className="counter" data-tip={ this.state.stream ? this.state.watch + " friends watching daisy 😍": this.state.watch -1 + " friends watching daisy 😍"}>{ this.state.stream ? this.state.watch : this.state.watch -1 }</div>
                <ReactTooltip place="left" type="dark" effect="float"/>
            </div>
        );
    }
}

export default App;