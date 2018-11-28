'use strict'

var AWS      = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var Iot      = require('aws-sdk/clients/iot');
var S3       = require('aws-sdk/clients/s3');

AWS.config.region = process.env.AWS_REGION;
var iot = AWSXRay.captureAWSClient(new Iot());
var s3 = AWSXRay.captureAWSClient(new S3());

module.exports =  {
    deleteCert: function (event, context, cb) {
        var params = { certificateId: event.certificateId, forceDelete: true };
        iot.deleteCertificate(params, function (err, data) {
            if(err) {
                cb(err, null)
            } else {
                var s3_params = {
                    Key: event.certificateId,
                    Bucket: process.env.S3_BUCKET
                };
                s3.deleteObject(s3_params, function(err, s3Data) {
                    console.log(`Deleting ${event.certificateId} from S3`);
                    cb(err, s3Data);
                });
            }
        });
    }
}