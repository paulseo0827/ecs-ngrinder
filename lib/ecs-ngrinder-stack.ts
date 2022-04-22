import autoscaling = require('aws-cdk-lib/aws-autoscaling');
import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import iam = require('aws-cdk-lib/aws-iam');
import cdk = require('aws-cdk-lib');
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import servicediscovery = require('aws-cdk-lib/aws-servicediscovery');


export class EcsNgrinderStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'ngrinder-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      maxAzs: 2
    });

    const cluster = new ecs.Cluster(this, "ngrinder-cluster", {
      vpc: vpc,
      clusterName: "ECSNgrinder",
    });

    const ngrinderSG = new ec2.SecurityGroup(this, "ngrinderSecurityGroup", {
            vpc,
            allowAllOutbound: true,
	    securityGroupName: "ngrinderSecurityGroup",
            description: "security group for ngrinder controller and agents",
    });

    ngrinderSG.connections.allowFrom(
	    ngrinderSG,
	    ec2.Port.allTraffic(),
	    'allow all traffics from itself',
    )

    const controllerFargateTaskDefinition = new ecs.FargateTaskDefinition(this, "taskDefinition01", {
	    memoryLimitMiB: 4096,
	    cpu: 2048,
    });

    controllerFargateTaskDefinition.addContainer("controller", {
	    image: ecs.ContainerImage.fromRegistry("ngrinder/controller"),
	    portMappings: [{ containerPort: 80, hostPort: 80}, { containerPort: 12000, hostPort: 12000}, { containerPort: 12001, hostPort: 12001}, { containerPort: 12002, hostPort: 12002}, { containerPort: 12003, hostPort: 12003}, { containerPort: 12004, hostPort: 12004},{ containerPort: 12005, hostPort: 12005},{ containerPort: 12006, hostPort: 12006}, { containerPort: 12007, hostPort: 12007}, { containerPort: 12008, hostPort: 12008}, { containerPort: 12009, hostPort: 12009}, { containerPort: 16001, hostPort: 16001},],
	    logging: ecs.LogDriver.awsLogs({ streamPrefix: 'ecs-ngrinder-controller' }),
    });

    const cloudMapNamespace = new servicediscovery.PrivateDnsNamespace(this, "ngrinderCloudMap", {
            name: "ngrinderCloudMap",
            vpc: vpc
    });
   
    const controllerService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "controller", {
	    cluster,
	    taskDefinition: controllerFargateTaskDefinition,
	    desiredCount: 1,
	    serviceName: "controller",
	    securityGroups: [ ngrinderSG ],
	    cloudMapOptions: {
		    dnsRecordType: servicediscovery.DnsRecordType.A,
		    cloudMapNamespace: cloudMapNamespace,
		    name: "controller",
	    },
    });

    controllerService.targetGroup.configureHealthCheck({
	    healthyHttpCodes: "200,302",
    });

    const agentFargateTaskDefinition = new ecs.FargateTaskDefinition(this, "taskDefinition02", {
	    memoryLimitMiB: 4096,
	    cpu: 2048,
    });

    agentFargateTaskDefinition.addContainer("agent", {
	    image: ecs.ContainerImage.fromRegistry("ngrinder/agent"),
	    command: [ "controller.ngrinderCloudMap:80" ],
	    logging: ecs.LogDriver.awsLogs({ streamPrefix: 'ecs-ngrinder-agent' }),
    });

    const agentService = new ecs.FargateService(this, 'agent', {
	    cluster,
	    taskDefinition: agentFargateTaskDefinition,
	    desiredCount: 3,
	    serviceName: "agent",
	    securityGroups: [ ngrinderSG ],
            cloudMapOptions: {
                    dnsRecordType: servicediscovery.DnsRecordType.A,
                    cloudMapNamespace: cloudMapNamespace,
		    name: "agent",
            },
    });

  }
}
