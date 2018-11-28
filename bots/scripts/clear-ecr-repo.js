var fs   = require('fs');
var path = require('path');

var yaml = require('js-yaml');
var AWS  = require('aws-sdk');

const SERVERLESS_FILE_PATH = path.normalize(`${path.resolve(__dirname)}/../../backend/serverless.yml`);
var backend_config_yaml_doc = null;
var region = null;
var images = null;

AWS.config.region = getBackEndRegion();
const repoName = getRepoName();

console.log("Looking for images in", repoName);

var ecr = new AWS.ECR();

var params = {
  repositoryName: repoName
};
ecr.listImages(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else {
     console.log("Images listed: ", data);           // successful response
     if (JSON.stringify(data.imageIds) === '[]') {
       console.log("No images found");
     } else {
       images = {
         repositoryName: repoName,
         imageIds: data.imageIds
       };
       console.log("Deleting Images...");
       // Delete images
       ecr.batchDeleteImage(images, function(err, data) {
       if (err) console.log(err, err.stack); // an error occurred
       else     console.log(data);           // successful response
       });
     }
   }
});


function getRepoName() {
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

