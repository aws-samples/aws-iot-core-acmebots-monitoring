import React, { Component } from 'react';
import { Button, Divider, Dropdown, Form, Icon, Label, Message, Popup, Statistic } from 'semantic-ui-react';
import { Area, AreaChart, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import moment from 'moment';
import { Auth } from 'aws-amplify';
import Amplify, { PubSub } from 'aws-amplify';
// import { AWSIoTProvider } from 'aws-amplify/lib/PubSub/Providers';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import Config from '../config';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import IoT from 'aws-sdk/clients/iot';
import uuidv4 from 'uuid/v4';

var mqttSubscription = null;

Amplify.addPluggable(new AWSIoTProvider({
    aws_pubsub_region: Config.region,
    aws_pubsub_endpoint: `wss://${Config.iotEndpointAddress}/mqtt`,
}));

function fetchThings(thingName, cb) {
    Auth.currentCredentials()
        .then(credentials => {
            const ddb = new DynamoDB({
                apiVersion: '2012-08-10',
                credentials: Auth.essentialCredentials(credentials),
                region: Config.region,
            });
            var params = {
                TableName: Config.iotThingsTable,
            }
            if(thingName !== '') {
                params['FilterExpression'] = "begins_with(thingName, :tn)"
                params['ExpressionAttributeValues'] = {":tn": {"S":thingName}}
            }
            ddb.scan(params, function(err, data) {
                if (err) cb(err, null);
                else {
                    if(cb) cb(null, data);
                }
            });
    });
}

function attachIotPolicy() {
    Auth.currentCredentials().
    then((credentials) => {
        const iot = new IoT({
            apiVersion: '2015-05-28',
            credentials: Auth.essentialCredentials(credentials),
            region: Config.region,
        });
        var params = { 
            policyName: Config.IotPolicyName,
            principal: credentials._identityId
        };
        iot.attachPrincipalPolicy(params, function(err, data) {
            if (err) console.log(err, err.stack);
        });
    });
}

class CmdCtrlPopup extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            connected: false,
            subscription: null,
            cmd: '',
            resp: '',
            sentAt: '',
            receivedAt: ''
        };
    }

    componentWillUnmount() {
        var sub = this.state.subscription;
        if (sub !== null) {
            sub.unsubscribe();
        }
    }

    handleChange = (e, { value }) => {
        this.setState({cmd: value});
    }

    handleNewCmdResp(data) {
        var now = new Date();
        this.setState({
            resp: JSON.stringify(data.value),
            receivedAt: now
        });
    }

    handleCmdsPopupOpen = () => {
        var topic = `myThings/${this.props.thing}/cmds/ack`;
        const cliendId = uuidv4();
        var opts = {clientId: cliendId};
        this.setState({
            subscription: PubSub.subscribe(topic, opts).subscribe({
                next: data => this.handleNewCmdResp(data),
                error: err => console.err(err),
                close: () => console.log('Done'),
            })
        });
        
        this.props.onCmdsPopupOpen();
        this.setState({
            connected: true,
            positiveMessage: `MQTT topic: myThings/${this.state.selected}/telemetry`
        });

    }

    handleCmdsPopupClose = () => {
        const sub = this.state.subscription;
        if (sub !== null) {
            sub.unsubscribe();
        }

        this.props.onCmdsPopupClose();
        this.setState({
            connected: false,
            cmd: '',
            resp: '',
            sentAt: '',
            receivedAt: ''
        });
    }

    handleSendCmd = () => {
        var now = new Date();
        PubSub.publish(`myThings/${this.props.thing}/cmds`, JSON.parse(this.state.cmd))
        .then(() => {
            this.setState({
                sentAt: now,
            });
        });
    }

    render() {
        
        const options = [
            {
                text: 'otaUpdate 1.0',
                value: JSON.stringify({cmd: "otaUpdate", version: "1.0"}),
            },
            {
                text: 'otaUpdate 2.0',
                value: JSON.stringify({cmd: "otaUpdate", version: "2.0"}),
            },
            {
                text: 'startWork',
                value: JSON.stringify({cmd: "startWork"}),
            },
            {
                text: 'standBy',
                value: JSON.stringify({cmd: "standby"}),
            },
            {
                text: 'enableAutoCharging',
                value: JSON.stringify({cmd: "enableAutoCharging"}),
            },
            {
                text: 'disableAutoCharging',
                value: JSON.stringify({cmd: "disableAutoCharging"}),
            },
        ];
        let cmdContent;
        var cmd = this.state.cmd;
        if (this.state.sentAt) {
            cmdContent =
            <div>
                {cmd}
                <Divider />
                Last sent at: <Label>{moment(this.state.sentAt).format('HH:mm:ss.SSS')}</Label>
            </div>;
        } else {
            cmdContent =
            <p>
                {cmd}
            </p>;            
        }
        let respContent;
        var resp = this.state.resp;
        if (this.state.receivedAt) {
            respContent =
            <div>
                {resp}
                <Divider />
                Last received at: 
                <Label>{moment(this.state.receivedAt).format('HH:mm:ss.SSS')}</Label>   Latency: <Label>{this.state.receivedAt-this.state.sentAt}</Label> ms.
            </div>;
        } else {
            respContent =
            <p>
                {resp}
            </p>;            
        }
        return (
            <Popup
                flowing
                trigger={<Button icon='comments' content='Send Command' disabled={!this.props.thing} />}
                content={
                    <div>
                        <Dropdown 
                            placeholder='Select Cmd' 
                            fluid 
                            selection 
                            options={options}
                            onChange={this.handleChange}
                        />

                        <Message>
                            <Message.Header><Icon name='arrow right' />myThings/{this.props.thing}/cmds</Message.Header>
                            <Divider />
                            {cmdContent}
                        </Message>
                        <Message>
                            <Message.Header><Icon name='arrow left' />myThings/{this.props.thing}/cmds/ack</Message.Header>
                            <Divider />
                            {respContent}
                        </Message>                        
                        <Button 
                            onClick={this.handleSendCmd}
                            primary 
                            content='Send'
                            disabled={!this.state.cmd}
                        />
                        <Button onClick={this.handleCmdsPopupClose} content='Close'  />
                    </div>
                }
                on='click'
                open={this.props.open}
                onOpen={this.handleCmdsPopupOpen}
                position='top right'
            />
        )
    }
}
class ThingsForm extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            cmdsPopupOpen: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubscribeRequested = this.handleSubscribeRequested.bind(this);
        this.handleDisconnectRequested = this.handleDisconnectRequested.bind(this);
    }

    handleChange(e, { value })  {
        this.props.onChange(value);
    }
    
    handleSubscribeRequested() {
        this.props.onSubscribeRequested();
    }

    handleDisconnectRequested() {
        this.props.onDisconnectRequested();
    }

    handleCmdsPopupOpen = () => {
        this.setState({ cmdsPopupOpen: true });
    }

    handleCmdsPopupClose = () => {
        this.setState({ cmdsPopupOpen: false });
    }

    render() {
        const options = []
        this.props.things.map(thing => {
            var thingName = thing.thingName.S
            options.push( { key: thingName, text: thingName, value: thingName } );
        });

        const positiveMessage = this.props.positiveMessage;
        var headerMessage = `Successfully Subscribed to ${this.props.selected} Telemetry`

        let positiveMessageComponent;
 
        if (positiveMessage) {
            positiveMessageComponent = 
            <div>
                <Message positive icon>
                    <Icon name='rss'  />
                    <Message.Content>
                        <Message.Header>{headerMessage}</Message.Header>
                        {positiveMessage}
                    </Message.Content>
                </Message>
                <Divider hidden/>
            </div>
        }


        return(
            <div>
                <div>
                    <Form>
                        <Form.Group inline>
                            <Form.Field inline>
                                <label>Thing name</label>
                                    <Dropdown 
                                        loading={this.props.searching}
                                        disabled={this.props.searching}
                                        placeholder='Select'
                                        search
                                        selection
                                        options={options}
                                        onChange={this.handleChange}
                                    />
                            </Form.Field>
                            <Form.Field inline>
                                <Button
                                    primary
                                    onClick={this.handleSubscribeRequested}
                                    disabled={!this.props.selected || this.props.connected}
                                >
                                    {this.props.subscribing ? 'Subscribing' : 'Subscribe'}
                                </Button>
                                <Button
                                    onClick={this.handleDisconnectRequested}
                                    disabled={!this.props.connected}
                                    color='red'
                                >
                                    {this.props.unsibscribing ? 'Unsubscribing' : 'Unsubscribe'}
                                </Button>
                            </Form.Field>
                            <Form.Field>
                                <CmdCtrlPopup
                                    thing={this.props.selected}
                                    onCmdsPopupOpen={this.handleCmdsPopupOpen}
                                    onCmdsPopupClose={this.handleCmdsPopupClose}
                                    open={this.state.cmdsPopupOpen}
                                />
                            </Form.Field>
                        </Form.Group>
                    </Form>
                </div>
                <div>
                    {positiveMessageComponent}
                </div>
            </div>
        )
    }
}

class ThingStatus extends Component {
    render() {
        var versionLabel = (this.props.version === '') ? '?' : this.props.version

        var statusLabel = '?';
        if (this.props.status === 'standby') {
            statusLabel =
            <div>
                {this.props.status}
            </div>;
        } else if (this.props.status === 'charging') {
            statusLabel =
            <div>
                {this.props.status}
            </div>;
            
        } else if (this.props.status === 'working') {
            statusLabel =
            <div>
                {this.props.status}
            </div>;
        }

        var lastReceivedAtLabel = '?';
        if (this.props.lastTelemetryReceivedAt) {
            var d = new Date(this.props.lastTelemetryReceivedAt);
            lastReceivedAtLabel =
            <div>
                {moment(d).format('HH:mm:ss')}
            </div>;
        }

        return (
            <div>
                <Statistic.Group widths='three'>
                    <Statistic color='blue'>
                        <Statistic.Value>{versionLabel}</Statistic.Value>
                        <Statistic.Label>Version</Statistic.Label>
                    </Statistic>
                    <Statistic color='blue'>
                        <Statistic.Value>
                            {statusLabel}
                        </Statistic.Value>
                        <Statistic.Label>Status</Statistic.Label>
                    </Statistic>
                    <Statistic color='blue'>
                        <Statistic.Value>{lastReceivedAtLabel}</Statistic.Value>
                        <Statistic.Label>Last data received at</Statistic.Label>
                    </Statistic>
                </Statistic.Group>
            </div>
        )
    }
}

class BatteryLifeChart extends Component {

    render() {
        return (
            <div>
                <ResponsiveContainer height={250} width='95%'>
                    <AreaChart data={this.props.data}>
                        <XAxis 
                            dataKey="recorded_at"
                            tickFormatter={(unixTime) => moment(unixTime).format('HH:mm::ss')}
                        />
                        <YAxis />
                        <Tooltip
                            labelFormatter={(unixTime) => moment(unixTime).format('HH:mm::ss')}
                            formatter={(value) => `${value} %`}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                        <Area type="monotone" dataKey="batteryLife" stroke="#5E33FF" fill="#ABEEFF" />
                        <ReferenceLine y={15} label="Charging Threshold (15%)" stroke="red" fill="red" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )
    }
}
export default class Telemetry extends Component {

    constructor(props) {
        super(props);

        this.state = {
            things: [],
            botData: [],
            botStatus: '',
            botVersion: '',
            lastTelemetryReceivedAt: '',
            selected: '',
            negativeMessage: '',
            searching: false,
            subscribing: false,
            unsibscribing: false,
            connected: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubscribeRequested = this.handleSubscribeRequested.bind(this);
        this.handleDisconnectRequested = this.handleDisconnectRequested.bind(this);
    }

    componentDidMount() {
        var component = this;
        component.setState({searching: true});
        fetchThings('', function(err, data){
            component.setState({searching: false});
            if(err) {
                component.setState({
                    negativeMessage: `${err.message}\n${err.stack}`
                });
            } else {
                component.setState({
                    things: data.Items
                });
            }
        });
        attachIotPolicy();
    }



    componentWillUnmount() {
        if (mqttSubscription !== null) {
            mqttSubscription.unsubscribe();
        }
    }

    handleChange(value)  {
        this.setState({selected: value});
    }

    handleNewTelemetryData(data) {
        var new_arr = this.state.botData.concat(data.value.telemetry);
        var index = data.value.telemetry.length-1;
        var last_item = data.value.telemetry[index];

        this.setState({
            botData: new_arr,
            botStatus: last_item.status,
            botVersion: last_item.version,
            lastTelemetryReceivedAt: Date.now()
        });
    }
    
    handleSubscribeRequested() {
        var topic = `myThings/${this.state.selected}/telemetry`;
        const cliendId = uuidv4();
        var opts = {clientId: cliendId};
        mqttSubscription = PubSub.subscribe(topic, opts).subscribe({
            next: data => this.handleNewTelemetryData(data),
            error: err => console.err(err),
            close: () => console.log('Done'),
        });
        
        this.setState({
            connected: true,
            positiveMessage: `MQTT topic: myThings/${this.state.selected}/telemetry`
        });
    }

    handleDisconnectRequested() {
        if (mqttSubscription !== null) {
            mqttSubscription.unsubscribe();
        }
        this.setState({
            connected: false,
            positiveMessage: '',
            botData: [],
            botStatus: '',
            botVersion: '',
            lastTelemetryReceivedAt: ''
        });
    }

    render() {
        let chartComponent;
        let thingStatusComponent;
 
        if (this.state.connected) {
            chartComponent = 
                <BatteryLifeChart data={this.state.botData} status={this.state.botStatus}/>;
            thingStatusComponent =
                <div>
                    <ThingStatus status={this.state.botStatus}
                        version={this.state.botVersion}
                        lastTelemetryReceivedAt={this.state.lastTelemetryReceivedAt} />
                    <Divider/>
                </div>;
        }
        return (
            <div>
                <ThingsForm 
                    things={this.state.things}
                    selected={this.state.selected}
                    connected={this.state.connected}
                    searching={this.state.searching}
                    negativeMessage={this.state.negativeMessage}
                    positiveMessage={this.state.positiveMessage}
                    onChange={this.handleChange}
                    onSubscribeRequested={this.handleSubscribeRequested}
                    onDisconnectRequested={this.handleDisconnectRequested}
                />
                {thingStatusComponent}
                {chartComponent}
            </div>
        )
    }
}