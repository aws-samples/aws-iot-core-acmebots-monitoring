import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { withAuthenticator } from 'aws-amplify-react';

import './App.css';
import IotTutorialMenu from './components/Menu';
import HomePage from './components/Home';
import Things from './components/Things';
import Telemetry from './components/Telemetry';

import Amplify from 'aws-amplify';

import Config from './config';

Amplify.configure({
    Auth: {    
        identityPoolId: Config.IdentityPoolId,
        region: Config.region,
        userPoolId: Config.UserPoolId,
        userPoolWebClientId: Config.ReactAppClientId,
        mandatorySignIn: true,
    }
});

class App extends Component {
    render() {
        return (

            <div className="ui container">
                <Router>
                    <div>
                        <IotTutorialMenu />
                        <Route exact={true} path="/" component={HomePage} />
                        <Route exact={true} path="/things" component={Things} />
                        <Route exact={true} path="/operations" component={Telemetry} />
                        <Route path='/aws-cli' component={() => window.location = 'https://aws.amazon.com/cli/'}/>
                    </div>
                </Router>
            </div>
            
        );
    }
}

// export default App;
export default withAuthenticator(App, { 
    includeGreetings: true,
});