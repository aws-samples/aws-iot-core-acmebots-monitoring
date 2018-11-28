var fs   = require('fs');
var path = require('path');

var yaml           = require('js-yaml');
var AWS            = require('aws-sdk/global');
var Cloudformation = require('aws-sdk/clients/cloudformation');
var Iot            = require('aws-sdk/clients/iot');

const KEYS = [
    'IdentityPoolId',
    'UserPoolId',
    'ReactAppClientId',
    'iotThingsTable',
    'IotProvisionThingLambdaFunctionQualifiedArn',
    'IotRemoveThingLambdaFunctionQualifiedArn',
    'AcmeBotsGuiIotPolicy',
];

const SERVERLESS_FILE_PATH = path.normalize(`${path.resolve(__dirname)}/../../backend/serverless.yml`);
const BACKEND_CONFIG_FILE_PATH = path.normalize(`${path.resolve(__dirname)}/../src/config/config.json`);

var backend_config_yaml_doc = null;
var region = null;

function getBackEndStackName() {
    if (backend_config_yaml_doc === null) {
        var contents = fs.readFileSync(SERVERLESS_FILE_PATH,'utf8');    
        backend_config_yaml_doc = yaml.safeLoad(contents);
    }
    var service = backend_config_yaml_doc['service'];
    var stage = backend_config_yaml_doc['provider']['stage'] || 'dev';
    return `${service}-${stage}`;
}

function getBackEndRegion() {
    if (region === null) {
        if (backend_config_yaml_doc === null) {
            var contents = fs.readFileSync(SERVERLESS_FILE_PATH,'utf8');    
            backend_config_yaml_doc = yaml.safeLoad(contents);
        }
        region = backend_config_yaml_doc['provider']['region'] || 'us-east-1';    
    }
    return region;
}

function find(arr, key) {
    var found = arr.find(function(element) {
        return element['OutputKey'] === key;
    });
    return found['OutputValue'];
}

function fetchConfig(keys, outputs) {
    console.log('Reading backend configuration file ...');
    AWS.config.region = getBackEndRegion();
    const cfn = new Cloudformation();
    var stackName = getBackEndStackName()
    var params = {
        StackName: stackName
    };

    console.log(`Parsing configuration params from CloudFormation stack ${stackName} ...`);
    cfn.describeStacks(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else {
            var config = {region: region};
            var outputs = data.Stacks[0].Outputs;
            KEYS.forEach(function(key) {
                config[key] = find(outputs, key);
            });
            var iot = new Iot();
            iot.describeEndpoint({endpointType: 'iot:Data-ATS'}, function(err, data){
                if (err) console.log(err, err.stack);
                else {
                    config['iotEndpointAddress'] = data.endpointAddress
                    var content = JSON.stringify(config, null, 4);
                    fs.writeFileSync(BACKEND_CONFIG_FILE_PATH, content);
                    console.log(`Backend configuration saved to ${BACKEND_CONFIG_FILE_PATH}`);
                }
            });
        }     
    });
}

fetchConfig();
