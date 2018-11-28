var AWS = require('aws-sdk');
var ecs = new AWS.ECS();
module.exports = {
  ecsDeleteBot: function (event, context, callback)  {

    console.log(event);

    var blankArray = new Object();
    blankArray = [];
    var tasks = listTasks(ecs, process.env.CLUSTER, event.thingName);

    tasks.then(function(result) {
        if (JSON.stringify(result.taskArns) === JSON.stringify(blankArray)) {
          console.log("No tasks exist for", event.thingName);
          console.log("listTasks API returned", result);
        } else {
          console.log("Task(s) found for ", event.thingName, ".  DELETING");
          console.log(result);
          
          var stop = [];
          for (var i = 0, len = result.taskArns.length; i < len; i++) {
            stop.push(stopTask(ecs, process.env.CLUSTER, result.taskArns[i]));
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
            });
        }
    }, function(err) {
        console.log("ERROR: listTasks API call failed!");
        console.log(err);
    });


    var taskDefinitions = listActiveTaskDefinitions(ecs, event.thingName);

    taskDefinitions.then(function(result) {
        if (JSON.stringify(result.taskDefinitionArns) === JSON.stringify(blankArray)) {
          console.log("No task definitions exist for", event.thingName);
          console.log("listTaskDefinitions API returned", result);
        } else {
          console.log("Task Definition(s) found for ", event.thingName, ".  DELETING");
          console.log(result);

          var deregister = [];
          for (var i = 0, len = result.taskDefinitionArns.length; i < len; i++) {
            deregister.push(deregisterTaskDefinition(ecs, result.taskDefinitionArns[i]));
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
            });
            
        }
    }, function(err) {
        console.log("ERROR: listTaskDefinitions API call failed!");
        console.log(err);
    });
    
  }
};

function listTasks(client, taskCluster, taskFamily) {
  return new Promise(function (resolve, reject){
    client.listTasks({cluster: taskCluster, family: taskFamily}, function (err, res){
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

function listActiveTaskDefinitions(client, taskFamily) {
  return new Promise(function (resolve, reject){
    client.listTaskDefinitions({status: "ACTIVE", familyPrefix: taskFamily}, function (err, res){
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
