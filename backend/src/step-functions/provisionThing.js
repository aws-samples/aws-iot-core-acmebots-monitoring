'use strict'

var AWS           = require('aws-sdk/global');
var AWSXRay       = require('aws-xray-sdk');
var StepFunctions = require('aws-sdk/clients/stepfunctions');

AWS.config.region = process.env.AWS_REGION;
var stepfunctions = AWSXRay.captureAWSClient(new StepFunctions());

module.exports =  {
    provisionThing: function (event, context, cb) {
        var params = {
            stateMachineArn: process.env.STATE_MACHINE_ARN,
            input: JSON.stringify({thingName: event.thingName})
        };
        stepfunctions.startExecution(params, function (err, data) {
            if (err) {
                cb(err, null);
            } else {
                cb(null, data);
            }
        });
    }
}