'use strict';

var AWS  = require('aws-sdk');
var ecr = new AWS.ECR();

module.exports =  {
  clearEcrRepo: function (event, context, cb) {
    console.log("Event=", event);
    console.log("Context=", context);
    if (event.RequestType === 'Delete')  {
      var images = null;
      var repoName = event.ResourceProperties.RepoName;

      console.log("Looking for images in", repoName);

      var params = {
        repositoryName: repoName
      };
      ecr.listImages(params, function(err, data) {
         if (err) {
            console.log("ERROR: listImages API Call failed!");
            console.log(err); // an error occurred
            sendResponse(event, context, "FAILED");
         } else {
           console.log("Images listed: ", data);           // successful response
           if (JSON.stringify(data.imageIds) === '[]') {
             console.log("No images found");
             sendResponse(event, context, "SUCCESS");
           } else {
             images = {
               repositoryName: repoName,
               imageIds: data.imageIds
             };
             console.log("Deleting Images...");
             // Delete images
             ecr.batchDeleteImage(images, function(err, data) {
               if (err) {
                 console.log("ERROR: batchDeleteImage API Call failed!");
                 console.log(err, err.stack); // an error occurred
                 sendResponse(event, context, "FAILED");
               } else {  
                 console.log("bacthDeleteImage API returned ", data);           // successful response
                 sendResponse(event, context, "SUCCESS");
               }
             });
           }
         }
      });

    } else {
      console.log("Delete not requested.");
      sendResponse(event, context, "SUCCESS");
    }

  }
};

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

      
      
      
