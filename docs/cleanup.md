## Cleanup

CloudFormation custom resources are used for cleaning up components before deleting, including Fargate tasks, Fargate Task Defintions, ECR Image Repository, IoT principals, and S3 buckets.  To clean up, you should only need to delete stacks one at a time.  Note that bots are not cleaned up, so do that in the web UI as a first step.  

* In the AcmeBots Web UI, select each thing you provisioned and delete it
* In the AWS Console, got to *CloudFormation*
* Select the top stack (named acme-bots-dev in this example), and click *Actions* -> *Delete Stack*
 * Wait for this to complete
* Select the first stack (acmebots in the example above), and click *Actions* -> *Delete Stack*

### Manual Cleanup

If for some reason the stack delete does not run as planned, there are a number of places to look at components deployed:

* ECS - Clusters
  * Acme-bots-dev ECS Cluster - Go to Tasks - Stop any running Tasks 
  * Delete the ECS Cluster
* ECS - Task Definitions - Deregister each task definition
* ECS - Amazon ECR Repositories - Delete the acme-bots-dev repository
* IOT Core - Policies - Delete any policies for your bots.  Delete AcmeBotsGui policy
* IOT Core - Manage Things - Delete any bots you’ve provisioned.  
* IOT Core - Secure - Certificates - Delete any certs related to these 
* Lambda Functions - Search for ‘acme’ and delete any functions.  Do NOT delete functions that have ‘Clean’ in their name as they are used in CloudFormation cleanup.  They should be removed by the CloudFormation template 
* Step Functions - Delete the iotCreateThing and iotDeleteThing step functions
* VPC - Delete all VPC components that were created 
* S3 - Delete any ‘acme’ buckets 

