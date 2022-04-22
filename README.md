# Installing Ngrinder in ECS

This is about installing Ngrinder in AWS ECS using CDK. 

Please note that the installation details are explained based on AWS Cloud9.

- Prerequisite: Set the IAM Role in Cloud9 to include the Administrator Access Policy

# Installation
* git clone https://github.com/paulseo0827/ecs-ngrinder.git   
* cd ecs-ngrinder
* npm install
* cdk bootstrap
* cdk diff
* cdk deploy

Currently, the number of agents is set to 3, and if you want to increase the number of agents, you can change the desiredCount setting to the bottom agentService in the ecs-ngrinder-stack.ts file in the lib directory.

The delete operation will delete the resources created by issuing the command "cdk destroy" in the ecs-ngrinder directory.
