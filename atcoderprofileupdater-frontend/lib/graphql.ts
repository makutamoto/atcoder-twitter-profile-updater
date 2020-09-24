import aws from 'aws-sdk';
import AWSAppSyncClient from 'aws-appsync';
import { DocumentNode } from 'graphql';

const AWS_REGION = process.env.AWS_REGION as string;
if(AWS_REGION === undefined) throw "AWS_REGION is not defined.";
const API_ENDPOINT = process.env.API_ENDPOINT as string;
if(API_ENDPOINT === undefined) throw "API_ENDPOINT is not defined.";

const client = new AWSAppSyncClient({
    url: API_ENDPOINT,
    region: AWS_REGION,
    auth: {
        type: "AWS_IAM",
        credentials: () => aws.config.credentials,
    },
    disableOffline: true,
});

export async function mutate<V>(document: DocumentNode, variables: V) {
    await client.mutate({
        mutation: document,
        variables: variables,
    });
}

export async function query<R, V>(document: DocumentNode, variables: V) {
    const response = await client.query<R>({
        query: document,
        variables: variables,
    });
    return response.data;
}
