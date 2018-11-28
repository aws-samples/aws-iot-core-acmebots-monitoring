'use strict';

var AWS = require('aws-sdk/global');
var Iot = require('aws-sdk/clients/iot');
var iot = new Iot();

module.exports =  {
  clearPrincipals: function (event, context, cb) {
    console.log("Event=", event);
    console.log("Context=", context);
    if (event.RequestType === 'Delete')  {
      var policyName = event.ResourceProperties.PolicyName;
      var failure = 0;

      var params = {
          policyName: policyName
      };
      iot.listPolicyPrincipals(params, function(err, data) {
          if (err) { 
              console.log("ERROR: listPolicyPrincipals API Call failed!");
              console.log(err, err.stack);
              sendResponse(event, context, "FAILED");
              failure = 1;
          } else {
              data.principals.forEach(function(principal){
                  var detachParams = {
                      policyName: policyName,
                      principal: principal
                  };
                  iot.detachPrincipalPolicy(detachParams, function(err2, data2){
                      if (err2) {
                         console.log("ERROR: detachPrincipalPolicy API Call failed!");
                         console.log(err2, err2.stack);
                         sendResponse(event, context, "FAILED");
                         failure = 1;
                      } else {
                          console.log(`Successfully detached ${principal} from ${policyName}`);
                      }
                  });
              });
          }
      });
      
      if ( failure === 0 ) {
         sendResponse(event, context, "SUCCESS");
      }
    } else {
      console.log("Detach not requested.");
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

