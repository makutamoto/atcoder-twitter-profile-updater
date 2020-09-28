import * as cdk from '@aws-cdk/core';
import { Queue } from '@aws-cdk/aws-sqs';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { AuthorizationType, CfnDataSource, CfnResolver, GraphqlApi, MappingTemplate, Schema } from '@aws-cdk/aws-appsync';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { Role, PolicyStatement, ServicePrincipal, User } from '@aws-cdk/aws-iam';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { join } from 'path';

const API_KEY = process.env.API_KEY as string;
if(API_KEY === undefined) throw "API_KEY is not defined.";
const API_SECRET_KEY = process.env.API_SECRET_KEY as string;
if(API_SECRET_KEY === undefined) throw "API_SECRET_KEY is not defined.";

export class AtCoderTwitterProfileUpdaterBackendStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const deadletterqueue = new Queue(this, 'deadletterqueue');
        const queue = new Queue(this, 'queue', {
            deadLetterQueue: {
                maxReceiveCount: 5,
                queue: deadletterqueue,
            }
        });
        const sqsEventSource = new SqsEventSource(queue, {
            batchSize: 1,
        });
        const updater = new NodejsFunction(this, 'updater', {
            entry: join(__dirname, '../lambda/updater/index.ts'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            reservedConcurrentExecutions: 5,
            events: [sqsEventSource],
            nodeModules: ['chrome-aws-lambda'],
            environment: {
                API_KEY,
                API_SECRET_KEY,
            },
        });
        updater.addToRolePolicy(new PolicyStatement({
            resources: [queue.queueArn],
            actions: ['sqs:ReceiveMessage'],
        }));
        const userTable = new Table(this, 'user-table', {
            partitionKey: {
                name: 'twitterID',
                type: AttributeType.STRING,
            }
        });
        const batchUpdate = new NodejsFunction(this, 'batch-update', {
            entry: join(__dirname, '../lambda/batch-update/index.ts'),
            timeout: cdk.Duration.seconds(60),
            environment: {
                TABLE_NAME: userTable.tableName,
                QUEUE_URL: queue.queueUrl,
            },
        });
        batchUpdate.addToRolePolicy(new PolicyStatement({
            resources: [userTable.tableArn],
            actions: ['dynamodb:Scan'],
        }));
        batchUpdate.addToRolePolicy(new PolicyStatement({
            resources: [queue.queueArn],
            actions: ['sqs:SendMessage'],
        }));
        const batchUpdateTarget = new LambdaFunction(batchUpdate);
        new Rule(this, 'batch-update-cron', {
            schedule: Schedule.cron({ weekDay: '1', hour: '16', minute: '0' }),
            targets: [batchUpdateTarget],
        });

        const api = new GraphqlApi(this, 'api', {
            name: 'atcoder-twitter-profile-updater-api',
            schema: Schema.fromAsset(join(__dirname, '../graphql/schema.graphql')),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: AuthorizationType.IAM,
                },
            },
        });
        const userTableDatasource = api.addDynamoDbDataSource('userTableDatasource', userTable);
        userTableDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'registerUser',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/registerUser/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/registerUser/response.vtl')),
        });
        userTableDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'unregisterUser',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/unregisterUser/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/unregisterUser/response.vtl')),
        });
        userTableDatasource.createResolver({
            typeName: 'Query',
            fieldName: 'getUser',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/getUser/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/getUser/response.vtl')),
        });
        const QueueDataSourceRole = new Role(this, 'QueueDataSourceRole', {
            assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        });
        QueueDataSourceRole.addToPolicy(new PolicyStatement({
            resources: [queue.queueArn],
            actions: ['sqs:SendMessage'],
        }));
        const QueueDataSource = new CfnDataSource(this, 'QueueDataSource',
            {
                apiId: api.apiId,
                name: 'AtCoderTwitterProfileUpdaterQueue',
                serviceRoleArn: QueueDataSourceRole.roleArn,
                type: 'HTTP',
                httpConfig: {
                    endpoint: "https://sqs.ap-northeast-1.amazonaws.com",
                    authorizationConfig: {
                        authorizationType: 'AWS_IAM',
                        awsIamConfig: {
                            signingRegion: 'ap-northeast-1',
                            signingServiceName: 'sqs',
                        }
                    },
                },
            },
        );
        const updateUser = new CfnResolver(this, 'updateUser', {
            apiId: api.apiId,
            typeName: 'Mutation',
            dataSourceName: QueueDataSource.name,
            fieldName: 'updateUser',
            requestMappingTemplate:
                MappingTemplate.fromFile(join(__dirname, '../graphql/updateUser/request.vtl'))
                    .renderTemplate().replace(/%QUEUE_URL%/g, queue.queueUrl),
            responseMappingTemplate:
                MappingTemplate.fromFile(join(__dirname, '../graphql/updateUser/response.vtl'))
                    .renderTemplate(),
        });
        updateUser.addDependsOn(QueueDataSource);

        const vercelUser = new User(this, 'verceluser');
        vercelUser.addToPolicy(new PolicyStatement({
            resources: [api.arn + '/*'],
            actions: ['appsync:GraphQL'],
        }));
    }
}
