import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

export const ddb = new DynamoDB({
    ...(process.env.MOCK_DYNAMODB_ENDPOINT && {
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
        sslEnabled: false,
        region: 'local',
    }),
});

export const putItem = async (item: any) =>
    ddb.putItem({
        TableName: process.env.TABLE_NAME,
        Item: marshall(item),
    });

export const updateItem = async (update: any) =>
    ddb.updateItem({
        TableName: process.env.TABLE_NAME,
        ...update,
    });

export const getItem = async (item: any) =>
    ddb.getItem({
        TableName: process.env.TABLE_NAME,
        ...item,
    });

export const updateArenaStateId = async (existingStateId: string, newStateId: string, timestamp: string) =>
    ddb.updateItem({
        TableName: process.env.TABLE_NAME,
        Key: {
            pk: { S: 'ARENA#CURRENT' },
            sk: { S: '#METADATA' },
        },
        ConditionExpression: '#stateId = :existingStateId',
        ExpressionAttributeNames: {
            '#stateId': 'stateId',
            '#timestamp': 'timestamp',
        },
        ExpressionAttributeValues: {
            ':existingStateId': { S: existingStateId },
            ':stateId': { S: newStateId },
            ':timestamp': { S: timestamp },
        },
        UpdateExpression: 'SET #stateId = :stateId, #timestamp = :timestamp',
    });
