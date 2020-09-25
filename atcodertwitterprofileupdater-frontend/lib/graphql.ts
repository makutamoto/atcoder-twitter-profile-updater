import AWSAppSyncClient from "aws-appsync";
import { DocumentNode } from "graphql";

const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID as string;
if (ACCESS_KEY_ID === undefined) throw "ACCESS_KEY_ID is not defined.";
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
if (SECRET_ACCESS_KEY === undefined) throw "SECRET_ACCESS_KEY is not defined.";
const REGION = process.env.REGION as string;
if (REGION === undefined) throw "REGION is not defined.";
const API_ENDPOINT = process.env.API_ENDPOINT as string;
if (API_ENDPOINT === undefined) throw "API_ENDPOINT is not defined.";

const client = new AWSAppSyncClient({
    url: API_ENDPOINT,
    region: REGION,
    auth: {
        type: "AWS_IAM",
        credentials: {
            accessKeyId: ACCESS_KEY_ID,
            secretAccessKey: SECRET_ACCESS_KEY,
        },
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
        fetchPolicy: "network-only",
        query: document,
        variables: variables,
    });
    return response.data;
}
