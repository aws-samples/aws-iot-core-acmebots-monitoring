'use strict'

var AWS        = require('aws-sdk/global');
var AWSXRay    = require('aws-xray-sdk');
var CloudWatchEvents = require('aws-sdk/clients/cloudwatchevents');
var Constants = require(`${__dirname}/constants`);

AWS.config.region = process.env.AWS_REGION;
var cwe = AWSXRay.captureAWSClient(new CloudWatchEvents());

module.exports =  {
    trackConnectivity: function(event, context, cb) {

        var params = {
            Entries: [
                {
                    Detail: JSON.stringify(event),
                    DetailType: 'AcmeBot Bot Connectivity Status',
                    Resources: [],
                    Source: Constants.CONNECTIVITY_EVENT_SOURCE,
                    Time: new Date(event.timestamp)
                }
            ]
        };
        cwe.putEvents(params, function(err, data) {
            if (err) console.log(err, err.stack);
        });
    }
}