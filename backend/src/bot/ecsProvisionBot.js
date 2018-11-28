var AWS = require('aws-sdk');
var ecs = new AWS.ECS();
module.exports = {
  ecsProvisionBot: function (event, context, callback)  {

    console.log(event);
  
    var awsLogsGroup = "/ecs/" + process.env.SERVICE;
    var params = {
      containerDefinitions: [
      {
        name: event.thingName,
        essential: true,
        image: process.env.DOCKER_IMAGE,
        environment: [
          {name: 'REGION', value: process.env.AWS_REGION},
          {name: 'SERVICE', value: process.env.SERVICE},
          {name: 'STAGE', value: process.env.STAGE},
          {name: 'THING_NAME', value: event.thingName}
        ],
        logConfiguration: {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": awsLogsGroup,
            "awslogs-region": process.env.AWS_REGION,
             "awslogs-stream-prefix": event.thingName,
            "awslogs-create-group": "true"
          }
        }
      }],
      family: event.thingName,
      executionRoleArn: process.env.TASK_EXEC_ROLE_ARN,
      taskRoleArn: process.env.TASK_ROLE_ARN,
      networkMode: "awsvpc",
      requiresCompatibilities: [ "FARGATE" ],
      cpu: "256",
      memory: "512"
    };

    // Params to run latest task definition
    var runtask_params = {
      taskDefinition: event.thingName,
      cluster: process.env.CLUSTER,
      count: 1,
      group: process.env.SERVICE,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: process.env.SUBNETS.split(','),
          assignPublicIp: 'DISABLED',
          securityGroups: process.env.TASK_SECGROUP.split(',')
        }
      },
    };

    var taskDef = registerTaskDefinition(ecs, params);
    taskDef.then(function(result) {
      console.log("Success - Registered Task Definition"); // successful response
      console.log(result);

      // Run Task
      var taskRun = runTask(ecs, runtask_params);
      taskRun.then(function(result) {
        console.log("Success - Initiated Task Run");           // successful response
        console.log(result);
      })
      .catch(function(err) {
        console.log("ERROR: Running Task Failed"); // an error occurred
        console.log(err);
      });

    })
    .catch(function(err) {
      console.log("ERROR: Task Definition Failed"); // an error occurred
      console.log(err);
    });

  }
};
       
function registerTaskDefinition(client, params) {
  return new Promise(function (resolve, reject){
    client.registerTaskDefinition(params, function(err, res) {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function runTask(client, params) {
  return new Promise(function (resolve, reject){
    client.runTask(params, function(err, res) {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

