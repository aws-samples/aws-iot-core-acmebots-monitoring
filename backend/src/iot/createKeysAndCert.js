'use strict'

var AWS = require('aws-sdk/global');
var AWSXRay  = require('aws-xray-sdk');
var Iot = require('aws-sdk/clients/iot');
var S3  = require('aws-sdk/clients/s3');

AWS.config.region = process.env.AWS_REGION;
var iot = AWSXRay.captureAWSClient(new Iot());
var s3  = AWSXRay.captureAWSClient(new S3());

module.exports =  {
    createKeysAndCert: function (event, context, cb) {
        var params = { setAsActive: true };
        iot.createKeysAndCertificate(params, function (err, data) {
            if (err) {
                cb(err, null);
            } else {
                var respdata = {
                    certificateId: data.certificateId,
                    certificateArn: data.certificateArn
                }

                // write to S3
                var bucketName = process.env.S3_BUCKET;
                var s3_params = {
                    Body:JSON.stringify(data, null, 4),
                    Bucket: bucketName,
                    Key: data.certificateId
                };
                s3.putObject(s3_params, function(err, data2) {
                    cb(err, respdata);
                });
            }
        });
    }
}