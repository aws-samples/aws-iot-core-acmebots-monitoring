'use strict'

var AWS      = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var DynamoDB = require('aws-sdk/clients/dynamodb');

AWS.config.region = process.env.AWS_REGION;
var ddb = AWSXRay.captureAWSClient(new DynamoDB());

module.exports =  {
    checkProvisioning: function(event, context, cb) {
        var data = {
            thingName: event[0].thingName,
            certificateId: event[1].certificateId,
            certificateArn: event[1].certificateArn,
            policyName: event[2].policyName
        };

        // Write to dynamoDB table
        var ddbParams = {
            TableName: process.env.THINGS_TABLE,
            Item: {
                'thingName': {S: data.thingName},
                'certificateId': {S: data.certificateId},
                'certificateArn': {S: data.certificateArn},
                'policyName': {S: data.policyName}
            }
        };
        ddb.putItem(ddbParams, function(err, resp1) {
            cb(err, data)
        });
    }
}