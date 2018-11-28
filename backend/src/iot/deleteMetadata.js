'use strict'

var AWS      = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var DynamoDB = require('aws-sdk/clients/dynamodb');

AWS.config.region = process.env.AWS_REGION;
var ddb = AWSXRay.captureAWSClient(new DynamoDB());

module.exports =  {
    deleteMetadata: function (event, context, cb) {
        var ddbParams = {
            Key: { "thingName": { S: event.thingName} }, 
            TableName: process.env.THINGS_TABLE
        };
        console.log(`Deleting ${event.thingName} item from DDB.`);
        ddb.deleteItem(ddbParams, function(err, data) { 
            cb(err, data);
        });
    }
}