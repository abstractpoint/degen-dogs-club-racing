import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { random } from '../utils';
import { BigNumber } from 'ethers';

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
            '#inArena': 'inArena',
        },
        FilterExpression: 'NOT #inArena = :inArena',
        ExpressionAttributeValues: {
            ':pk': { S: 'ARENA#CURRENT' },
            ':inArena': { BOOL: false },
        },
        KeyConditionExpression: '#pk = :pk',
        ScanIndexForward: false,
    });

export const queryArenaUnfiltered = async () =>
    ddb.query({
        TableName: process.env.TABLE_NAME,
        ExpressionAttributeNames: {
            '#pk': 'pk',
        },
        ExpressionAttributeValues: {
            ':pk': { S: 'ARENA#CURRENT' },
        },
        KeyConditionExpression: '#pk = :pk',
        ScanIndexForward: false,
    });

export const queryLtp = async (ltp: string, ttl: number) =>
    ddb.query({
        TableName: process.env.TABLE_NAME,
        ExpressionAttributeNames: {
            '#pk': 'pk',
            '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
            ':pk': { S: `LTP#${ltp}` },
            ':ttl': { N: `${ttl}` },
        },
        KeyConditionExpression: '#pk = :pk',
        FilterExpression: '#ttl >= :ttl',
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
    playerAdjustment: string;
    opponentSk: string;
    opponentStrength: number;
    opponentAdjustment: string;
}

export const updatePlayersAndArena = async ({
    existingStateId,
    newStateId,
    timestamp,
    playerSk,
    playerStrength,
    playerAdjustment,
    opponentSk,
    opponentStrength,
    opponentAdjustment,
}: UpdatePlayersAndArenaParams) => {
    const group = new Date();
    group.setMilliseconds(0);
    group.setSeconds(0);
    group.setMinutes(0);
    group.setHours(0);
    return ddb.transactWriteItems({
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
                    ConditionExpression: '#inArena = :inArena',
                    ExpressionAttributeNames: {
                        '#strength': 'strength',
                        '#adjustment': 'adjustment',
                        '#inArena': 'inArena',
                    },
                    ExpressionAttributeValues: {
                        ':strength': { N: String(playerStrength) },
                        ':adjustment': { S: playerAdjustment },
                        ':inArena': { BOOL: true },
                    },
                    UpdateExpression: 'SET #strength = :strength, #adjustment = :adjustment',
                },
            },
            {
                Update: {
                    TableName: process.env.TABLE_NAME,
                    Key: {
                        pk: { S: `ARENA#CURRENT` },
                        sk: { S: opponentSk },
                    },
                    ConditionExpression: '#inArena = :inArena',
                    ExpressionAttributeNames: {
                        '#strength': 'strength',
                        '#adjustment': 'adjustment',
                        '#inArena': 'inArena',
                    },
                    ExpressionAttributeValues: {
                        ':strength': { N: String(opponentStrength) },
                        ':adjustment': { S: opponentAdjustment },
                        ':inArena': { BOOL: true },
                    },
                    UpdateExpression: 'SET #strength = :strength, #adjustment = :adjustment',
                },
            },
            {
                Put: {
                    TableName: process.env.TABLE_NAME,
                    Item: marshall({
                        pk: `RACES#${group.toISOString()}`,
                        sk: `#${timestamp}${playerSk}-${opponentSk}`,
                        gs1pk: `RACES${playerSk}-${opponentSk}`,
                        gs1sk: `#${timestamp}`,
                        existingStateId,
                        newStateId,
                        playerStrength,
                        opponentStrength,
                        playerAdjustment,
                        opponentAdjustment,
                        timestamp: timestamp,
                    }),
                },
            },
        ],
    });
};

interface scheduleUpdatePlayersAndArenaParams {
    newStateId?: string;
    timestamp: string;
    newPlayers: any[];
    updatedPlayers: any[];
    allShares: BigNumber;
    balanceUntilUpdatedAt: string;
    totalNetFlowRate: string;
    updatedAtTimestamp: string;
}

export const scheduleUpdatePlayersAndArena = async ({
    newStateId,
    timestamp,
    newPlayers,
    updatedPlayers,
    allShares,
    balanceUntilUpdatedAt,
    totalNetFlowRate,
    updatedAtTimestamp,
}: scheduleUpdatePlayersAndArenaParams) => {
    const multiplier = BigNumber.from(1e9);
    const unixTimestampDiffBN = BigNumber.from(Math.floor(new Date().valueOf() / 1000)).sub(
        BigNumber.from(updatedAtTimestamp),
    );
    const balanceUntilUpdatedAtBN = BigNumber.from(balanceUntilUpdatedAt);
    const currentContractBalanceBN = unixTimestampDiffBN
        .mul(BigNumber.from(totalNetFlowRate))
        .add(balanceUntilUpdatedAtBN);
    const transactItems = [];

    console.log('currentContractBalanceBN', currentContractBalanceBN.toString());
    console.log(newStateId, newPlayers.length, updatedPlayers.length);

    if (newStateId) {
        transactItems.push({
            Update: {
                TableName: process.env.TABLE_NAME,
                Key: {
                    pk: { S: 'ARENA#CURRENT' },
                    sk: { S: '#METADATA' },
                },
                ExpressionAttributeNames: {
                    '#stateId': 'stateId',
                    '#timestamp': 'timestamp',
                },
                ExpressionAttributeValues: {
                    ':stateId': { S: newStateId },
                    ':timestamp': { S: timestamp },
                },
                UpdateExpression: 'SET #stateId = :stateId, #timestamp = :timestamp',
            },
        });
    }
    newPlayers.forEach((inflow) => {
        transactItems.push({
            Put: {
                TableName: process.env.TABLE_NAME,
                Item: marshall({
                    pk: 'ARENA#CURRENT',
                    sk: `#PLAYER#${timestamp}#${inflow.sender}`,
                    gs1pk: `PLAYER#${inflow.sender}`,
                    gs1sk: `#SELF`,
                    id: inflow.sender,
                    image: inflow.nftId,
                    flowRate: inflow.currentFlowRate,
                    balance: currentContractBalanceBN
                        .div(allShares.mul(multiplier).div(BigNumber.from(inflow.balanceShares)))
                        .mul(multiplier)
                        .toString(),
                    adjustment: '0',
                    strength: random(),
                    timestamp: timestamp,
                    inArena: inflow.inArena,
                    attributes: inflow.attributes,
                }),
            },
        });
    });
    updatedPlayers.forEach((inflow) => {
        console.log(inflow);
        transactItems.push({
            Update: {
                TableName: process.env.TABLE_NAME,
                Key: {
                    pk: { S: `ARENA#CURRENT` },
                    sk: { S: inflow.playerSk },
                },
                ExpressionAttributeNames: {
                    '#flowRate': 'flowRate',
                    '#balance': 'balance',
                    '#inArena': 'inArena',
                },
                ExpressionAttributeValues: {
                    ':flowRate': { S: inflow.currentFlowRate },
                    ':balance': {
                        S: currentContractBalanceBN
                            .div(allShares.mul(multiplier).div(BigNumber.from(inflow.balanceShares)))
                            .mul(multiplier)
                            .toString(),
                    },
                    ':inArena': { BOOL: inflow.inArena },
                },
                UpdateExpression: 'SET #flowRate = :flowRate, #balance = :balance, #inArena = :inArena',
            },
        });
    });
    console.log('transactItems', transactItems.length);
    console.log(JSON.stringify(transactItems, undefined, 2));

    if (transactItems.length > 0) {
        return ddb.transactWriteItems({
            TransactItems: transactItems,
        });
    } else {
        return Promise.resolve();
    }
};
