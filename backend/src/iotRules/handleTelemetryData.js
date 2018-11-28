'use strict'

var AWS        = require('aws-sdk/global');
var AWSXRay    = require('aws-xray-sdk');
var CloudWatch = require('aws-sdk/clients/cloudwatch');
var CloudWatchEvents = require('aws-sdk/clients/cloudwatchevents');
var DynamoDB   = require('aws-sdk/clients/dynamodb');
var jsonSize   = require('json-size');
var Constants = require(`${__dirname}/constants`);

AWS.config.region = process.env.AWS_REGION;
var cw = AWSXRay.captureAWSClient(new CloudWatch());
var cwe = AWSXRay.captureAWSClient(new CloudWatchEvents());
var ddb = AWSXRay.captureAWSClient(new DynamoDB());

module.exports =  {
    handleTelemetryData: function(event, context, cb) {
        var now = new Date();
        var last_recorded_at = null;
        var last_status = null;
        var version = null;
        var last_datapoint = null;
        var telemetry = event.telemetry || [];
        var params = {
            MetricData: [],
            Namespace: Constants.METRICS_NAMESPACE
        };
        telemetry.forEach(function(datapoint){
            last_recorded_at = new Date(datapoint.recorded_at);
            last_status = datapoint.status;
            version = datapoint.version;
            last_datapoint = datapoint;
            var metricData = {
                MetricName: Constants.BATTERY_LIFE_METRIC,
                Dimensions: [
                    {
                        Name: 'bot',
                        Value: event.dimension
                    }
                ],
                StorageResolution: 1,
                Timestamp: last_recorded_at,
                Unit: 'Percent',
                Value: datapoint.batteryLife
            }
            params.MetricData.push(metricData);
        });

        params.MetricData.push({
            MetricName: Constants.TELEMETRY_DELAY_METRIC,
            Dimensions: [
                {
                    Name: 'bot',
                    Value: event.dimension
                }
            ],
            StorageResolution: 1,
            Timestamp: now,
            Unit: 'Milliseconds',
            Value: now - last_recorded_at
        });

        params.MetricData.push({
            MetricName: Constants.TELEMETRY_PACKAGE_SIZE_METRIC,
            Dimensions: [
                {
                    Name: 'bot',
                    Value: event.dimension
                }
            ],
            StorageResolution: 1,
            Timestamp: now,
            Unit: 'Bytes',
            Value: jsonSize(event.telemetry)
        });

        cw.putMetricData(params, function(err, data) {
            if (err) console.log(err, err.stack);
        });

        // Update the dynamoDB item
        var expressionAttributeValues = {
            ":s": {
                S: last_status
            },
            ":l": {
                N: `${last_recorded_at.getTime()}`
            },
            ":b": {
                N: `${last_datapoint.batteryLife}`
            },
            ":v": {
                S: version
            },
            ":tn": {
                S: event.dimension
            }
        }
        var updateExpression = "SET #S = :s, #L = :l, #B = :b, #V = :v";
        var expressionAttributeNames= {
            "#S": "status",
            "#L": "lastSeenAt",
            "#B": "batteryLife",
            "#V": "version"
        }
        if(last_datapoint.batteryLife < 10.0) {
            expressionAttributeValues[":lbd"] = { S: "true" };
            updateExpression = updateExpression.concat(", #LBD = :lbd");
            expressionAttributeNames["#LBD"] = "lowBatteryDetected";
        } else {
            updateExpression = updateExpression.concat(" REMOVE lowBatteryDetected");
        }
        var ddbParams = {
            TableName: process.env.THINGS_TABLE,
            Key: {
                "thingName": {
                    S: event.dimension
                }
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames, 
            ExpressionAttributeValues: expressionAttributeValues,
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

        // raise cw status event
        last_datapoint.botId = event.dimension;
        var cweParams = {
            Entries: [
                {
                    Detail: JSON.stringify(last_datapoint),
                    DetailType: 'AcmeBot Bot Status',
                    Resources: [],
                    Source: Constants.STATUS_EVENT_SOURCE,
                    Time: last_recorded_at
                }
            ]
        };
        cwe.putEvents(cweParams, function(err, data) {
            if (err) console.log(err, err.stack);
        });

    }
}