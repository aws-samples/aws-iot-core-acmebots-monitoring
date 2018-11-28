'use strict'

var AWS      = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var Iot      = require('aws-sdk/clients/iot');
var myUtils  = require('./utils');

var region = process.env.AWS_REGION;
AWS.config.region = region;
var iot = AWSXRay.captureAWSClient(new Iot());

const POLICY_DOCUMENT = myUtils.readFile(`${__dirname}/policy.doc`);

module.exports =  {
    createPolicy: function (event, context, cb) {
        var awsAccountId = context.invokedFunctionArn.match(/\d{3,}/)[0];
        var policyDoc = POLICY_DOCUMENT
            .replace(/<AwsRegion>/g, region)
            .replace(/<AwsAccountId>/g, awsAccountId)
            .replace(/<botId>/g, event.thingName);
        var params = { policyName: event.thingName, policyDocument: policyDoc };
        iot.createPolicy(params, function (err, data) {
            if (err) {
                cb(err, null);
            } else {
                cb(null, {policyName: data.policyName});
            }
        });
    }
}