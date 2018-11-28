'use strict'

var AWS      = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var Iot      = require('aws-sdk/clients/iot');

AWS.config.region = process.env.AWS_REGION;
var iot = AWSXRay.captureAWSClient(new Iot());

module.exports =  {
    deleteThing: function (event, context, cb) {
        var params = { thingName: event.thingName };
        iot.deleteThing(params, function (err, data) {
            if (err) {
                cb(err, null)
            } else {
                cb(null, {"thingName": event.thingName});
            }
        });
    }
}