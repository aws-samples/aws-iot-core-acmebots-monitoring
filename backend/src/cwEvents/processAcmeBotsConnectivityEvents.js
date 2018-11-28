'use strict'

var AWS        = require('aws-sdk/global');
var AWSXRay    = require('aws-xray-sdk');
var CloudWatch = require('aws-sdk/clients/cloudwatch');
var DynamoDB   = require('aws-sdk/clients/dynamodb');
var Constants = require(`${__dirname}/constants`);

AWS.config.region = process.env.AWS_REGION;
var cw = AWSXRay.captureAWSClient(new CloudWatch());
var ddb = AWSXRay.captureAWSClient(new DynamoDB());

module.exports =  {
    handler: function(event, context, cb) {
        var now = new Date();
        var delay = now - event.detail.timestamp;

        // Update the dynamoDB item
        var ddbParams = {
            TableName: process.env.THINGS_TABLE,
            Key: {
                "thingName": {
                    S: event.detail.clientId
                }
            },
            UpdateExpression: "SET #C = :c, #L = :l",
            ExpressionAttributeNames: {
                "#C": "connected", 
                "#L": "lastSeenAt"
            }, 
            ExpressionAttributeValues: {
                ":c": {
                    BOOL: event.detail.eventType === 'connected'
                },
                ":l": {
                    N: `${now.getTime()}`
                },
                ":tn": {
                    S: event.detail.clientId
                }
            },
            ConditionExpression: "thingName = :tn",
        };
        ddb.updateItem(ddbParams, function(err, data) {
            if (err) {
                if( err.code == 'ConditionalCheckFailedException') {
                    data = {thingName: event.clientId, exists: false}
                    cb(null, data)
                } else {
                    cb(err, null);
                }
            } else {
                cb(err, data);
            }
        });

        // Send cw custom metric
        var params = {
            MetricData: [
                {
                    MetricName: Constants.EVENTS_DELAY_METRIC,
                    StorageResolution: 1,
                    Timestamp: now,
                    Unit: 'Milliseconds',
                    Value: delay
                }
            ],
            Namespace: Constants.METRICS_NAMESPACE
        };
        cw.putMetricData(params, function(err, data) {
            if (err) console.log(err, err.stack);
        });

    }
}