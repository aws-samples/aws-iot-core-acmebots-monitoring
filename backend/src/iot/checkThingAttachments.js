'use strict'

var AWS      = require('aws-sdk/global');
var Iot      = require('aws-sdk/clients/iot');

AWS.config.region = process.env.AWS_REGION;
var iot = new Iot();

module.exports =  {
    checkThingAttachments: function (event, context, cb) {
        cb(null, event[0]);
    }
}