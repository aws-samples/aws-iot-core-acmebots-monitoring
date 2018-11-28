'use strict'

var AWS      = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var Iot      = require('aws-sdk/clients/iot');

AWS.config.region = process.env.AWS_REGION;
var iot = AWSXRay.captureAWSClient(new Iot());

module.exports =  {
    attachPolicyToCert: function(event, context, cb) {
        var params = { policyName: event.policyName, target: event.certificateArn };
        iot.attachPolicy(params, function (err, data) {
            if (err) {
                cb(err, null);
            } else {
                cb(null, event);
            }
        });
    }
}