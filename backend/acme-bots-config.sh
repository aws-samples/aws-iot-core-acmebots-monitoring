#!/bin/sh
# Simple script to update the config yaml with variables
sed -i "s/username: .*/username: $USERNAME/" config/config.yml
sed -i "s/email: .*/email: $EMAIL/" config/config.yml
sed -i "s/region: .*/region: $AWS_DEFAULT_REGION/" serverless.yml
sed -i "s/stage: .*/stage: $STAGE/" serverless.yml
sed -i "s/deploymentBucket: .*/deploymentBucket: $ServerlessS3Bucket/" serverless.yml
sed -i "s/GitHubOAuthToken: .*/GitHubOAuthToken: $GitHubOAuthToken/" config/config.yml
sed -i "s/GitHubUser: .*/GitHubUser: $GitHubUser/" config/config.yml
sed -i "s/GitHubRepository: .*/GitHubRepository: $GitHubRepository/" config/config.yml
sed -i "s/GitHubBranch: .*/GitHubBranch: $GitHubBranch/" config/config.yml
sed -i "s/LambdaS3Bucket: .*/LambdaS3Bucket: $ArtifactS3Bucket/" config/config.yml
