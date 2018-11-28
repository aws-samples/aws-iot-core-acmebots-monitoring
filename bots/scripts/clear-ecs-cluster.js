var fs   = require('fs');
var path = require('path');

var yaml = require('js-yaml');
var AWS  = require('aws-sdk');

const SERVERLESS_FILE_PATH = path.normalize(`${path.resolve(__dirname)}/../../backend/serverless.yml`);
var backend_config_yaml_doc = null;
var region = null;
var tasks = null;
var taskDefinitions = null;

var blankArray = new Object();
blankArray = [];

var backend_config_yaml_doc = null;

console.log('Reading backend configuration file ...');

AWS.config.region = getBackEndRegion();

var cfn = new AWS.CloudFormation();
var stackName = getBackEndStackName();

var clusterNamePromise = getClusterName(cfn, stackName);

var taskRoleArnPromise = getTaskRoleArn(cfn, stackName);

var ecs = new AWS.ECS();

clusterNamePromise.then(function(result) {

  clusterName = find(result.Stacks[0].Outputs, "ECSClusterName");
  console.log("Found cluster name: ", clusterName);

  var tasks = listTasks(ecs, clusterName);
  
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
          });
      }
  }, function(err) {
      console.log("ERROR: listTasks API call failed!");
      console.log(err);
  });
})
.catch(function(err) {
  console.log("ERROR: getClusterName API call failed!");
  console.log(err);
});

taskRoleArnPromise.then(function(result) {
    taskRoleArn = find(result.Stacks[0].Outputs, "ECSTaskRoleArn"); 
    console.log("Found task role arn: ", taskRoleArn)

    var taskDefinitions = listActiveTaskDefinitions(ecs);

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
                };
    
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
            })
            .catch(function(err) {
              console.log("ERROR: describeTaskDefinition API call failed!");
              console.log(err);
            });
    
        }
    }, function(err) {
        console.log("ERROR: listTaskDefinitions API call failed!");
        console.log(err);
    });

})
.catch(function(err) {
  console.log("ERROR: getTaskRoleArn API call failed!");
  console.log(err);
});

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

function getClusterName(cfn, stackName) {
    return new Promise(function (resolve, reject){
    console.log(`Parsing ECSClusterName from CloudFormation stack: ${stackName} ...`);
    cfn.describeStacks({StackName: stackName}, function(err, res) {
      if (err) reject(err);
      else resolve(res);
    });
  });
        //var outputs = data.Stacks[0].Outputs;
        //return find(outputs, "ECSClusterName");
}

function getTaskRoleArn(cfn, stackName) {
    return new Promise(function (resolve, reject){
    console.log(`Parsing ECSTaskRoleArn from CloudFormation stack: ${stackName} ...`);
    cfn.describeStacks({StackName: stackName}, function(err, res) {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function getBackEndStackName() {
    if (backend_config_yaml_doc === null) {
        var contents = fs.readFileSync(SERVERLESS_FILE_PATH,'utf8');
        backend_config_yaml_doc = yaml.safeLoad(contents);
    }
    var service = backend_config_yaml_doc['service'];
    var stage = backend_config_yaml_doc['provider']['stage'] || 'dev';
    return `${service}-${stage}`;
}

function getBackEndRegion() {
    if (region === null) {
        if (backend_config_yaml_doc === null) {
            var contents = fs.readFileSync(SERVERLESS_FILE_PATH,'utf8');
            backend_config_yaml_doc = yaml.safeLoad(contents);
        }
        region = backend_config_yaml_doc['provider']['region'] || 'us-east-1';
    }
    return region;
}

function find(arr, key) {
    var found = arr.find(function(element) {
        return element['OutputKey'] === key;
    });
    return found['OutputValue'];
}

