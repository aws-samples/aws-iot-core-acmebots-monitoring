'use strict';

var AWS      = require('aws-sdk');
var s3       = new AWS.S3();

module.exports =  {
  clearS3Bucket: function (event, context, cb) {
    console.log("Event=", event);
    console.log("Context=", context);
    if (event.RequestType === 'Delete')  {
        var bucketName = event.ResourceProperties.BucketName;
 
        console.log("Delete bucket requested for", bucketName);

        var objects = listObjects(s3, bucketName);
      
        objects.then(function(result) {
           var keysToDeleteArray = [];
           console.log("Found "+ result.Contents.length + " objects to delete.");
           if (result.Contents.length === 0) {
               sendResponse(event, context, "SUCCESS");
           } else {
               for (var i = 0, len = result.Contents.length; i < len; i++) {
                   var item =  new Object();
                   item = {};
                   item = { Key: result.Contents[i].Key };
                   keysToDeleteArray.push(item);
               }
        
               var delete_params = {
                   Bucket: bucketName, 
                   Delete: {
                     Objects: keysToDeleteArray,
                     Quiet: false
                   }
               };
      
               var deletedObjects = deleteObjects(s3, delete_params);
   
               deletedObjects.then(function(result) {
                   console.log("deleteObjects API returned ", result);    
                   sendResponse(event, context, "SUCCESS");
               }, function(err) {
                   console.log("ERROR: deleteObjects API Call failed!");
                   console.log(err);
                   sendResponse(event, context, "FAILED");
               });
           }
        }, function(err) {
           console.log("ERROR: listObjects API Call failed!");
           console.log(err);
           sendResponse(event, context, "FAILED");
        });
      
    } else {
      console.log("Delete not requested.");
      sendResponse(event, context, "SUCCESS");
    }
      
  }
};

function listObjects(client, bucketName) {
  return new Promise(function (resolve, reject){
    client.listObjectsV2({Bucket: bucketName}, function (err, res){
      if (err) reject(err);
      else resolve(res);
    });
  });
}
  
function deleteObjects(client, params) {
  return new Promise(function (resolve, reject){
    client.deleteObjects(params, function (err, res){
      if (err) reject(err);
      else resolve(res);
    });
  });
}
  
function sendResponse(event, context, responseStatus, responseData, physicalResourceId, noEcho) {
  var responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: physicalResourceId || context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: noEcho || false,
    Data: responseData
  });
  
  console.log("Response body:\n", responseBody);
        
  var https = require("https");
  var url = require("url");
        
  var parsedUrl = url.parse(event.ResponseURL);
  var options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": responseBody.length
    }
  };
  
  var request = https.request(options, function(response) {
    console.log("Status code: " + response.statusCode);
    console.log("Status message: " + response.statusMessage);
    context.done();
  });
  
  request.on("error", function(error) {
    console.log("send(..) failed executing https.request(..): " + error);
    context.done();
  });

  request.write(responseBody);
  request.end();
}
