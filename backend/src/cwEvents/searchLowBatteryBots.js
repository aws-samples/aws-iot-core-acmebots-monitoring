'use strict'

var AWS        = require('aws-sdk/global');
var AWSXRay    = require('aws-xray-sdk');
var CloudWatch = require('aws-sdk/clients/cloudwatch');
var DynamoDB   = require('aws-sdk/clients/dynamodb');
var Iot        = require('aws-sdk/clients/iot');
var IotData    = require('aws-sdk/clients/iotdata');

const Util     = require('util');

AWS.config.region = process.env.AWS_REGION;
var cw      = AWSXRay.captureAWSClient(new CloudWatch());
var ddb     = AWSXRay.captureAWSClient(new DynamoDB());
var iot     = AWSXRay.captureAWSClient(new Iot());
var iotData = null;

// Idempotent function to fetch the aws iot endpoint ONCE.
function getIotEndpoint(cb) {
    if (iotData === null) {
        console.log('Fetching iot endpoint ...')
        iot.describeEndpoint({}, function(err, data) {
            var iotEndpoint = data.endpointAddress;
            iotData = AWSXRay.captureAWSClient(new IotData({endpoint: iotEndpoint}));
            console.log(`iot endpoint set to ${iotEndpoint}`);
            cb(err, data);
        });
    } else {
        cb(null, {});
    }
}

function queryLowBateryBots(cb) {
    var params = {
        "TableName": process.env.TABLE_NAME,
        "IndexName": process.env.INDEX_NAME,
        "KeyConditionExpression": "lowBatteryDetected = :v",
        "ExpressionAttributeValues": {
            ":v": {"S": "true"}
        },
        "ProjectionExpression": "thingName, batteryLife",
        "ScanIndexForward": false
    };

    ddb.query(params, function(err, data) {
        cb(err, data);
    });
}

function putMetricData(value) {
    var params = {
        MetricData: [
            {
                MetricName: process.env.METRIC_NAME,
                StorageResolution: 60,
                Timestamp: new Date(),
                Unit: process.env.METRIC_UNIT,
                Value: value
            }
        ],
        Namespace: process.env.METRIC_NAMESPACE
    };
    cw.putMetricData(params, function(err, data) {
        if (err) console.log(err, err.stack);
    });
}

function handleLowBatteryBots(bots) {
    
    // Self-healing action
    if(bots.length > 0) {
        getIotEndpoint(function(e, d) {
            var botsArr = [];
            bots.forEach(function(bot) {
                var thingName = bot.thingName.S;
                var batteryLife = bot.batteryLife.N;
                var topic = `myThings/${thingName}/cmds`;
                var params = {
                    topic: topic,
                    payload: JSON.stringify({cmd: "startCharging"})
                }
                iotData.publish(params, function(err, data) {
                });
                botsArr.push({ thingName: thingName, batteryLife: batteryLife});
            });
    
            // Log to CloudWatch logs
            console.log(`Low battery devices: ${Util.inspect(botsArr, false, null)}`);
        });
    }

    // put metric data
    putMetricData(bots.length);
}

module.exports =  {
    handler: function(event, context, cb) {
        queryLowBateryBots( function(err, data) {
            if(err) console.log(err, err.stack);
            if(data) {
                handleLowBatteryBots(data.Items);
            }
        });
    }
}