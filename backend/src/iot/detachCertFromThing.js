'use strict'

var AWS      = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var Iot      = require('aws-sdk/clients/iot');

AWS.config.region = process.env.AWS_REGION;
var iot = AWSXRay.captureAWSClient(new Iot());

module.exports =  {
    detachCertFromThing: function (event, context, cb) {
        var params = { principal: event.certificateArn, thingName: event.thingName };
        iot.detachThingPrincipal(params, function (err, data) {
            cb(err, event);
        });
    }
}