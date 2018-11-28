'use strict'

var AWS      = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var Iot      = require('aws-sdk/clients/iot');
var DynamoDB = require('aws-sdk/clients/dynamodb');

AWS.config.region = process.env.AWS_REGION;
var iot = AWSXRay.captureAWSClient(new Iot());
var ddb = AWSXRay.captureAWSClient(new DynamoDB());

const INACTIVE_STATUS = 'INACTIVE';

module.exports =  {
    disableCert: function (event, context, cb) {
        var ddbParams = {
            Key: {
                "thingName": { S: event.thingName }
            },
            TableName: process.env.THINGS_TABLE
        };
        ddb.getItem(ddbParams, function(err, ddbData){
            if(err) {
                cb(err, null)
            } else {
                var outputParams = {
                    thingName: ddbData.Item.thingName.S,
                    certificateArn: ddbData.Item.certificateArn.S,
                    certificateId: ddbData.Item.certificateId.S,
                    policyName: ddbData.Item.policyName.S
                };

                var params = {
                    certificateId: outputParams.certificateId,
                    newStatus: INACTIVE_STATUS
                };
                iot.updateCertificate(params, function (err, data) {
                    cb(err, outputParams);
                });
            }
        });
    }
}