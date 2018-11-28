'use strict';

var AWS  = require('aws-sdk');
var ecs = new AWS.ECS();

module.exports =  {
  clearEcsCluster: function (event, context, cb) {
    console.log("Event=", event);
    console.log("Context=", context);
    if (event.RequestType === 'Delete')  {
      var tasks = null;
      var taskDefinitions = null;
      var failure = 0;

      var blankArray = new Object();
      blankArray = [];

      var clusterName = event.ResourceProperties.ECSClusterName;
      var taskRoleArn = event.ResourceProperties.ECSTaskRoleArn;

      console.log("Found cluster name: ", clusterName);

      tasks = listTasks(ecs, clusterName);
      tasks.then(function(result) {
        if (JSON.stringify(result.taskArns) === JSON.stringify(blankArray)) {
          console.log("No tasks exist in cluster", clusterName);
          console.log("listTasks API returned", result);
        } else {
          console.log("Task(s) found for cluster ", clusterName, ".  DELETING");
          console.log(result);

          var stop = [];
          for (var i = 0, len = result.taskArns.length; i < len; i++) {
            stop.push(stopTask(ecs, clusterName, result.taskArns[i]));
          }

          Promise.all(stop)
          .then(function(result) {
            for (var i = 0, len = result.length; i < len; i++) {
              console.log("Stopped Task", result[i].task.taskArn);
            }
          })
          .catch(function(err) {
            console.log("ERROR: stopTask API call failed!");
            console.log(err);
            sendResponse(event, context, "FAILED");
            failure = 1;
          });
        }
      }, function(err) {
        console.log("ERROR: listTasks API call failed!");
        console.log(err);
        sendResponse(event, context, "FAILED");
        failure = 1;
      });

      console.log("Found task role arn: ", taskRoleArn);

      taskDefinitions = listActiveTaskDefinitions(ecs);

      taskDefinitions.then(function(result) {
        if (JSON.stringify(result.taskDefinitionArns) === JSON.stringify(blankArray)) {
          console.log("No task definitions found with Role Arn ", taskRoleArn);
          console.log("listTaskDefinitions API returned", result);
        } else {
          console.log("Task Definition(s) found.  DELETING");
          console.log(result);

          var descTaskDef = [];
          for (var i = 0, len = result.taskDefinitionArns.length; i < len; i++) {
            descTaskDef.push(describeTaskDefinition(ecs, result.taskDefinitionArns[i]));
          }

          Promise.all(descTaskDef)
          .then(function(result) {
            var deregister = [];

            for (var i = 0, len = result.length; i < len; i++) {
              console.log(result[i].taskDefinition.taskRoleArn, " = ", taskRoleArn);

              if ( result[i].taskDefinition.taskRoleArn === taskRoleArn )  {
                 deregister.push(deregisterTaskDefinition(ecs, result[i].taskDefinition.taskDefinitionArn));
              }

              Promise.all(deregister)
              .then(function(result) {
                for (var i = 0, len = result.length; i < len; i++) {
                  console.log("Deregistered Task Definition", result[i].taskDefinition.taskDefinitionArn);
                }
              })
              .catch(function(err) {
                console.log("ERROR: deregisterTaskDefinition API call failed!");
                console.log(err);
                sendResponse(event, context, "FAILED");
                failure = 1;
              });

            }
          })
          .catch(function(err) {
            console.log("ERROR: describeTaskDefinition API call failed!");
            console.log(err);
            sendResponse(event, context, "FAILED");
            failure = 1;
          });
        }
      }, function(err) {
        console.log("ERROR: listTaskDefinitions API call failed!");
        console.log(err);
        sendResponse(event, context, "FAILED");
        failure = 1;
      });

      if ( failure === 0 ) {
        sendResponse(event, context, "SUCCESS");
      }
    } else {
      console.log("Delete not requested.");
      sendResponse(event, context, "SUCCESS");
    }
  }
};

function listTasks(client, taskCluster) {
  return new Promise(function (resolve, reject){
    client.listTasks({cluster: taskCluster}, function (err, res){
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function stopTask(client, taskCluster, taskArn) {
  return new Promise(function (resolve, reject){
    console.log("stopTask called for", taskArn);
    client.stopTask({task: taskArn, cluster: taskCluster}, function (err, res){
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function listActiveTaskDefinitions(client) {
  return new Promise(function (resolve, reject){
    client.listTaskDefinitions({status: "ACTIVE"}, function (err, res){
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function describeTaskDefinition(client, taskDefinition) {
  return new Promise(function (resolve, reject){
    client.describeTaskDefinition({taskDefinition: taskDefinition}, function (err, res){
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function deregisterTaskDefinition(client, taskDefArn) {
    return new Promise(function (resolve, reject){
    console.log("deregisterTaskDefinition called for", taskDefArn);
    client.deregisterTaskDefinition({taskDefinition: taskDefArn}, function (err, res){
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
