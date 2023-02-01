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

export const queryPlayer = async (playerId: string) =>
    ddb.query({
        TableName: process.env.TABLE_NAME,
        IndexName: 'gs1',
        ExpressionAttributeNames: {
            '#gs1pk': 'gs1pk',
            '#gs1sk': 'gs1sk',
        },
        ExpressionAttributeValues: {
            ':gs1pk': { S: `PLAYER#${playerId}` },
            ':gs1sk': { S: `#SELF` },
        },
        KeyConditionExpression: '#gs1pk = :gs1pk AND #gs1sk = :gs1sk',
    });

export const queryArena = async () =>
    ddb.query({
        TableName: process.env.TABLE_NAME,
        ExpressionAttributeNames: {
            '#pk': 'pk',
        },
        ExpressionAttributeValues: {
            ':pk': { S: 'ARENA#CURRENT' },
        },
        KeyConditionExpression: '#pk = :pk',
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

interface UpdatePlayersAndArenaParams {
    existingStateId: string;
    newStateId: string;
    timestamp: string;
    playerSk: string;
    playerStrength: number;
    playerBalance: string;
    opponentSk: string;
    opponentStrength: number;
    opponentBalance: string;
    ttl: number;
}

export const updatePlayersAndArena = async ({
    existingStateId,
    newStateId,
    timestamp,
    playerSk,
    playerStrength,
    playerBalance,
    opponentSk,
    opponentStrength,
    opponentBalance,
    ttl,
}: UpdatePlayersAndArenaParams) =>
    ddb.transactWriteItems({
        TransactItems: [
            {
                Update: {
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
                },
            },
            {
                Update: {
                    TableName: process.env.TABLE_NAME,
                    Key: {
                        pk: { S: `ARENA#CURRENT` },
                        sk: { S: playerSk },
                    },
                    ExpressionAttributeNames: {
                        '#strength': 'strength',
                        '#balance': 'balance',
                        '#ttl': 'ttl',
                    },
                    ExpressionAttributeValues: {
                        ':strength': { N: String(playerStrength) },
                        ':balance': { S: String(playerBalance) },
                        ':ttl': { N: String(ttl) },
                    },
                    UpdateExpression: 'SET #strength = :strength, #balance = :balance, #ttl = :ttl',
                },
            },
            {
                Update: {
                    TableName: process.env.TABLE_NAME,
                    Key: {
                        pk: { S: `ARENA#CURRENT` },
                        sk: { S: opponentSk },
                    },
                    ExpressionAttributeNames: {
                        '#strength': 'strength',
                        '#balance': 'balance',
                        '#ttl': 'ttl',
                    },
                    ExpressionAttributeValues: {
                        ':strength': { N: String(opponentStrength) },
                        ':balance': { S: String(opponentBalance) },
                        ':ttl': { N: String(ttl) },
                    },
                    UpdateExpression: 'SET #strength = :strength, #balance = :balance, #ttl = :ttl',
                },
            },
        ],
    });
