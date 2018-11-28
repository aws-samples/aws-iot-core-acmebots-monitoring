import React from 'react';
import { Button, Form, Header, Icon, Image, Input, Message, Table} from 'semantic-ui-react';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import Lambda from 'aws-sdk/clients/lambda';
import { Auth } from 'aws-amplify';
import Config from '../config';

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

function provisionThing(thingName, cb) {
    Auth.currentCredentials()
    .then(credentials => {
        const lambda = new Lambda({
            apiVersion: '2015-03-31',
            credentials: Auth.essentialCredentials(credentials),
            region: Config.region,
        });
        var params = {
            ClientContext: "MyApp",
            FunctionName: Config.IotProvisionThingLambdaFunctionQualifiedArn,
            InvocationType: "Event",
            Payload: JSON.stringify({thingName: thingName})
        };
        lambda.invoke(params, function(err, data) {
            if (err) console.log(err, err.stack);
            else {
                if(cb) cb(null, data)
            }
        });
    })
}

function removeThing(thingName, cb){
    Auth.currentCredentials()
    .then(credentials => {
        const lambda = new Lambda({
            apiVersion: '2015-03-31',
            credentials: Auth.essentialCredentials(credentials),
            region: Config.region,
        });
        var params = {
            ClientContext: "MyApp",
            FunctionName: Config.IotRemoveThingLambdaFunctionQualifiedArn,
            InvocationType: "Event",
            Payload: JSON.stringify({thingName: thingName})
        };
        lambda.invoke(params, function(err, data) {
            if (err) console.log(err, err.stack);
            else {
                if(cb) cb(null, data)
            }
        });
    })
}

class ThingsForm extends React.Component {

    constructor(props) {
        super(props);
        this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
        this.handleCreateRequest = this.handleCreateRequest.bind(this);
        this.handleSearchRequested = this.handleSearchRequested.bind(this);
    }

    handleFilterTextChange(e) {
        this.props.onFilterTextChange(e.target.value);
    }

    handleSearchRequested() {
        this.props.onSearchRequested();
    }

    handleCreateRequest() {
        this.props.onCreateRequested();
    }

    render() {

        const positiveMessage = this.props.positiveMessage;
        const negativeMessage = this.props.negativeMessage;

        let positiveMessageComponent;
        let negativeMessageComponent;

        if (positiveMessage) {
            positiveMessageComponent = 
            <Message positive attached='bottom'
                icon='check'
                header='Success'
                content={positiveMessage}>
            </Message>
        }

        if (negativeMessage) {
            negativeMessageComponent =
            <Message negative attached='bottom'
                icon='exclamation'
                header='Something went wrong'
                content={negativeMessage}>
            </Message>
        }

        return(
            <div>
                {positiveMessageComponent}
                {negativeMessageComponent}
                <Form>
                    <Form.Group inline>
                        <Form.Field inline>
                            <label>Thing name</label>
                            <Input placeholder='' value={this.props.filterText} onChange={this.handleFilterTextChange} />
                        </Form.Field>
                        <Form.Field inline>
                            <Button primary onClick={this.handleSearchRequested} disabled={this.props.searching}>
                                {this.props.searching ? 'Searching' : 'Search'}
                            </Button>
                        </Form.Field>
                        <Form.Field inline>
                            <Button positive onClick={this.handleCreateRequest} disabled={!this.props.filterText}>Create Thing</Button>
                        </Form.Field>
                    </Form.Group>
                </Form>
            </div>
        )
    }
}

class TableFooter extends React.Component {
    render() {
        return (
            <Table.Footer>
                <Table.Row>
                    <Table.HeaderCell>Returned Items: {this.props.returnedItems}</Table.HeaderCell>
                    <Table.HeaderCell>Scanned Items: {this.props.scannedCount}</Table.HeaderCell>                    
                </Table.Row>
            </Table.Footer>
        )
    }
}

class ThingsTableleRow extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            deleteRequested: false
        };
        this.handleRemoveThing = this.handleRemoveThing.bind(this);
    }
    
    handleRemoveThing() {
        const thingName = this.props.thing.thingName.S;
        const component = this;
        removeThing(thingName, function(err, data){
            if(err) {
                console.log(err, err.stack);
            } else {
                component.setState({
                    deleteRequested: true
                });
            }
        });
        this.setState({deleteRequested: true});
    }

    render() {
        var thing = this.props.thing;
        var component = this;
        var deleteRequested = this.state.deleteRequested;

        return(
            <Table.Row 
                key={thing.thingName.S}
            >
                <Table.Cell>
                    <Header as='h4' image>
                        <Image src='/images/thing.svg' rounded size='mini' />
                        <Header.Content>
                            {thing.thingName.S}
                        </Header.Content>
                    </Header>
                </Table.Cell>
                <Table.Cell textAlign='center'>
                    <Button size='mini' color='red' 
                        onClick={component.handleRemoveThing}
                        disabled={deleteRequested}>
                            {deleteRequested ? 'Deleting' : 'Delete'}
                    </Button>
                </Table.Cell>
            </Table.Row>
        )
    }
}

class ThingsTable extends React.Component {g

    render() {
        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell textAlign='center'>Name</Table.HeaderCell>
                        <Table.HeaderCell textAlign='center'>Actions</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {this.props.things.map(thing => {
                        return (
                            <ThingsTableleRow key={thing.thingName.S} 
                                thing={thing}
                                certificateId={thing.certificateId.S}
                            />
                        )
                    })}            
                </Table.Body>
                <TableFooter scannedCount={this.props.scannedCount} returnedItems={this.props.things.length}/>
            </Table>
        )
    }
}
class ThingsPanel extends React.Component {

    constructor(props) {
        super(props);
        this.state = {filterText: '',
            things: [],
            scannedCount: 0,
            removeRequests: [],
            createRequests: [],
            positiveMessage: '',
            negativeMessage: '',
            searching: false,
        };

        this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
        this.handleCreateRequested = this.handleCreateRequested.bind(this);
        this.handleSearchRequested = this.handleSearchRequested.bind(this);
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
                    things: data.Items,
                    scannedCount: data.ScannedCount
                });
            }
        });
    }

    handleFilterTextChange(filterText) {
        this.setState({filterText: filterText});
    }

    handleSearchRequested() {
        var component = this;
        component.setState({searching: true});
        fetchThings(this.state.filterText, function(err, data){
            component.setState({searching: false});
            if(err) {
                this.setState({
                    negativeMessage: `${err.message}\n${err.stack}`
                });
            } else {
                component.setState({
                    things: data.Items,
                    scannedCount: data.ScannedCount,
                    positiveMessage: ''
                });
            }
        });
    }

    handleCreateRequested() {
        var component = this;
        const thingName = this.state.filterText;
        provisionThing(thingName, function(err, data){
            if(err) {
                this.setState({
                    negativeMessage: `${err.message}\n${err.stack}`
                });
            } else {
                var arr = component.state.createRequests;
                arr.push(thingName);
                component.setState({
                    createRequests: arr,
                    positiveMessage: `Successfully sent a create request for ${component.state.filterText}.`
                });
            }
        });
    }

    render() {

        let searchingMessage;
        let thingsTable;
        if(this.state.searching) {
            searchingMessage = 
            <Message icon>
                <Icon name='circle notched' loading />
                <Message.Content>
                    <Message.Header>Just one second</Message.Header>
                    We are fetching that content for you.
                </Message.Content>
            </Message>    
        } else {
            thingsTable = 
            <ThingsTable things={this.state.things}
            scannedCount={this.state.scannedCount}
            filterText={this.state.filterText}
            removeRequests={this.state.removeRequests} />
        }
        return (
            <div>
                <ThingsForm filterText={this.state.filterText}
                    onFilterTextChange={this.handleFilterTextChange}
                    onSearchRequested={this.handleSearchRequested}
                    onCreateRequested={this.handleCreateRequested}
                    positiveMessage={this.state.positiveMessage}
                    negativeMessage={this.state.negativeMessage}
                    searching={this.state.searching}
                />
                {searchingMessage}
                {thingsTable}
            </div>
        );
    }   
}

class ThingsPage extends React.Component {

    render() {
        return (
            <div>
                <ThingsPanel things={[]} />
            </div>
        );
    }   
}

export default ThingsPage