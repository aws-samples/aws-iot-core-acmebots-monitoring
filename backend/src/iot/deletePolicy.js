'use strict'

var AWS      = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var Iot      = require('aws-sdk/clients/iot');

AWS.config.region = process.env.AWS_REGION;
var iot = AWSXRay.captureAWSClient(new Iot());

module.exports =  {
    deletePolicy: function (event, context, cb) {
        var params = { policyName: event.policyName };
        iot.deletePolicy(params, function (err, data) {
            cb(err, data);
        });
    }
}