import { Handler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const AWS_REGION = process.env.AWS_REGION as string;
if(AWS_REGION === undefined) throw "AWS_REGION is not defined.";
const TABLE_NAME = process.env.TABLE_NAME as string;
if(TABLE_NAME === undefined) throw "TABLE_NAME is not defined.";
const QUEUE_URL = process.env.QUEUE_URL as string;
if(QUEUE_URL === undefined) throw "QUEUE_URL is not defined.";

AWS.config.update({ region: AWS_REGION });

const db = new AWS.DynamoDB();
const sqs = new AWS.SQS();

export const handler: Handler = () => {
    return new Promise((resolve, reject) => {
        db.scan({
            TableName: TABLE_NAME,
        }, (err, data) => {
            if(err) reject(err);
            if(data.Items) {
                data.Items.forEach((item) => {
                    const body = {
                        twitterID: item.twitterID.S,
                        atcoderID: item.atcoderID.S,
                        banner: item.banner.BOOL,
                        bio: item.bio.BOOL,
                        token: item.token.S,
                        secret: item.secret.S,
                    };
                    sqs.sendMessage({
                        QueueUrl: QUEUE_URL,
                        MessageBody: JSON.stringify(body),
                    }, (err) => {
                        if(err) reject(err);
                        resolve();
                    })
                });
            } else {
                resolve();
            }
        });
    });
};
