import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { arenaHandler, challengeHandler } from '../../app';
import { ddb, queryArena } from '../../clients/ddb';

const challengeInput = {
    opponentId: '1013679a0814d9ec772f95d778c35fc5',
    arenaStateId: '123',
};

const TOKEN =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMTIzIiwidGltZXN0YW1wIjoiMjAyMy0wMi0xNVQxNzo0MTo1Ni4zNTZaIiwiaWF0IjoxNjc2NDgyOTE2fQ.__tq096LpB8kaBZoDTJla6VUcgiqVUf9wVVB-RtIb4M';

jest.setTimeout(15e3);

describe('Service', function () {
    it('db connection works', async () => {
        //create an item in DB
        await ddb.putItem({
            TableName: 'table',
            Item: marshall({
                pk: 'ARENA#CURRENT',
                sk: '#METADATA',
                stateId: '123',
            }),
        });
        const Items = await queryArena().then(({ Items }) => Items?.map((item) => unmarshall(item)));
        expect(Items).toEqual([{ pk: 'ARENA#CURRENT', sk: '#METADATA', stateId: '123' }]);
    });
    describe('Arena handler', function () {
        it('verifies successful response', async () => {
            //create an item in DB
            await ddb.putItem({
                TableName: 'table',
                Item: marshall({
                    pk: 'ARENA#CURRENT',
                    sk: '#METADATA',
                    stateId: '123',
                }),
            });
            const timestamp = new Date().toISOString();
            // create player in db
            await ddb.putItem({
                TableName: 'table',
                Item: marshall({
                    pk: 'ARENA#CURRENT',
                    sk: `#PLAYER#${timestamp}#123`,
                    gs1pk: `PLAYER#123`,
                    gs1sk: `#SELF`,
                    id: '123',
                    image: '1',
                    flowRate: '0000005400000000000000',
                    balance: '1000000000000000000000',
                    adjustment: '0000000000000000000000',
                    strength: 0.5,
                    inArena: true,
                    timestamp: timestamp,
                    attributes: [
                        { trait_type: 'Background', value: 'Halo' },
                        { trait_type: 'Body', value: 'SugarSkull' },
                        { trait_type: 'Neck', value: 'RedCollar' },
                        { trait_type: 'Mouth', value: 'None' },
                        { trait_type: 'Ears', value: 'None' },
                        { trait_type: 'Head', value: 'StripedBeanie' },
                        { trait_type: 'Eyes', value: 'BlueLaserEyes' },
                    ],
                }),
            });
            const event = {
                httpMethod: 'get',
                body: '',
                headers: {
                    Authorization: TOKEN,
                },
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: {},
                path: '/arena',
                pathParameters: {},
                queryStringParameters: {},
                requestContext: {
                    accountId: '123456789012',
                    apiId: '1234',
                    authorizer: {},
                    httpMethod: 'get',
                    identity: {
                        accessKey: '',
                        accountId: '',
                        apiKey: '',
                        apiKeyId: '',
                        caller: '',
                        clientCert: {
                            clientCertPem: '',
                            issuerDN: '',
                            serialNumber: '',
                            subjectDN: '',
                            validity: { notAfter: '', notBefore: '' },
                        },
                        cognitoAuthenticationProvider: '',
                        cognitoAuthenticationType: '',
                        cognitoIdentityId: '',
                        cognitoIdentityPoolId: '',
                        principalOrgId: '',
                        sourceIp: '',
                        user: '',
                        userAgent: '',
                        userArn: '',
                    },
                    path: '/arena',
                    protocol: 'HTTP/1.1',
                    requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
                    requestTimeEpoch: 1428582896000,
                    resourceId: '123456',
                    resourcePath: '/arena',
                    stage: 'dev',
                },
                resource: '',
                stageVariables: {},
            };
            const result = await arenaHandler(event);

            expect(result.statusCode).toEqual(200);

            expect(JSON.parse(result.body)).toEqual({
                metadata: {
                    arenaStateId: '123',
                    playerId: '123',
                    playerStrength: expect.any(Number),
                    playerTraits: [
                        {
                            name: 'Background',
                            value: 'Halo',
                        },
                        {
                            name: 'Body',
                            value: 'SugarSkull',
                        },
                        {
                            name: 'Neck',
                            value: 'RedCollar',
                        },
                        {
                            name: 'Mouth',
                            value: 'None',
                        },
                        {
                            name: 'Ears',
                            value: 'None',
                        },
                        {
                            name: 'Head',
                            value: 'StripedBeanie',
                        },
                        {
                            name: 'Eyes',
                            value: 'BlueLaserEyes',
                        },
                    ],
                },
                players: [
                    {
                        id: '123',
                        image: expect.any(String),
                        flowRate: 0.0054,
                        balance: 1000,
                        traits: [
                            {
                                name: 'Background',
                                outcome: 'equal',
                                value: 'Halo',
                            },
                            {
                                name: 'Body',
                                outcome: 'equal',
                                value: 'SugarSkull',
                            },
                            {
                                name: 'Neck',
                                outcome: 'equal',
                                value: 'RedCollar',
                            },
                            {
                                name: 'Mouth',
                                outcome: 'equal',
                                value: 'None',
                            },
                            {
                                name: 'Ears',
                                outcome: 'equal',
                                value: 'None',
                            },
                            {
                                name: 'Head',
                                outcome: 'equal',
                                value: 'StripedBeanie',
                            },
                            {
                                name: 'Eyes',
                                outcome: 'equal',
                                value: 'BlueLaserEyes',
                            },
                        ],
                        traitsScore: { player: 1, opponent: 1 },
                    },
                ],
            });
        });
    });
    describe('Challenge handler', function () {
        it('verifies successful response', async () => {
            jest.spyOn(ddb, 'transactWriteItems').mockImplementation(
                async (payload) =>
                    await Promise.all(
                        payload.TransactItems!.map(async (each: any) => {
                            if (each.Update) await ddb.updateItem(each.Update);
                            if (each.Put) await ddb.putItem(each.Put);
                        }),
                    ),
            );
            //create an item in DB
            await ddb.putItem({
                TableName: 'table',
                Item: marshall({
                    pk: 'ARENA#CURRENT',
                    sk: '#METADATA',
                    stateId: '123',
                }),
            });
            const timestamp = new Date().toISOString();
            // create player in db
            await ddb.putItem({
                TableName: 'table',
                Item: marshall({
                    pk: 'ARENA#CURRENT',
                    sk: `#PLAYER#${timestamp}#123`,
                    gs1pk: `PLAYER#123`,
                    gs1sk: `#SELF`,
                    id: '123',
                    image: '1',
                    flowRate: '0000005400000000000000',
                    balance: '1000000000000000000000',
                    adjustment: '0000000000000000000000',
                    strength: 0.1,
                    inArena: true,
                    timestamp: timestamp,
                    attributes: [
                        { trait_type: 'Background', value: 'Halo' },
                        { trait_type: 'Body', value: 'SugarSkull' },
                        { trait_type: 'Neck', value: 'RedCollar' },
                        { trait_type: 'Mouth', value: 'None' },
                        { trait_type: 'Ears', value: 'None' },
                        { trait_type: 'Head', value: 'StripedBeanie' },
                        { trait_type: 'Eyes', value: 'BlueLaserEyes' },
                    ],
                }),
            });
            // create opponent in db
            await ddb.putItem({
                TableName: 'table',
                Item: marshall({
                    pk: 'ARENA#CURRENT',
                    sk: `#PLAYER#${timestamp}#1013679a0814d9ec772f95d778c35fc5`,
                    gs1pk: `PLAYER#1013679a0814d9ec772f95d778c35fc5`,
                    gs1sk: `#SELF`,
                    id: '1013679a0814d9ec772f95d778c35fc5',
                    image: '2',
                    flowRate: '0000005400000000000000',
                    balance: '1000000000000000000000',
                    adjustment: '0000000000000000000000',
                    strength: 0.6,
                    inArena: true,
                    timestamp: timestamp,
                    attributes: [
                        { trait_type: 'Background', value: 'None' },
                        { trait_type: 'Body', value: 'Alien' },
                        { trait_type: 'Neck', value: 'RedCollar' },
                        { trait_type: 'Mouth', value: 'Pizza' },
                        { trait_type: 'Ears', value: 'None' },
                        { trait_type: 'Head', value: 'StripedBeanie' },
                        { trait_type: 'Eyes', value: 'BlueLaserEyes' },
                    ],
                }),
            });
            const event = {
                httpMethod: 'put',
                body: JSON.stringify(challengeInput),
                headers: {
                    Authorization: TOKEN,
                },
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: {},
                path: '/challenge',
                pathParameters: {},
                queryStringParameters: {},
                requestContext: {
                    accountId: '123456789012',
                    apiId: '1234',
                    authorizer: {},
                    httpMethod: 'put',
                    identity: {
                        accessKey: '',
                        accountId: '',
                        apiKey: '',
                        apiKeyId: '',
                        caller: '',
                        clientCert: {
                            clientCertPem: '',
                            issuerDN: '',
                            serialNumber: '',
                            subjectDN: '',
                            validity: { notAfter: '', notBefore: '' },
                        },
                        cognitoAuthenticationProvider: '',
                        cognitoAuthenticationType: '',
                        cognitoIdentityId: '',
                        cognitoIdentityPoolId: '',
                        principalOrgId: '',
                        sourceIp: '',
                        user: '',
                        userAgent: '',
                        userArn: '',
                    },
                    path: '/challenge',
                    protocol: 'HTTP/1.1',
                    requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
                    requestTimeEpoch: 1428582896000,
                    resourceId: '123456',
                    resourcePath: '/challenge',
                    stage: 'dev',
                },
                resource: '',
                stageVariables: {},
            };
            const result = await challengeHandler(event);

            expect(result.statusCode).toEqual(200);
            expect(JSON.parse(result.body)).toEqual({
                challenge: {
                    result: 'PLAYER_LOSS',
                    message: 'Opponent has won, you lost 500 coins.',
                    payload: {
                        opponent: 1,
                        player: 0.845679012345679,
                        streamStage: {
                            opponent: 1,
                            player: 1,
                        },
                        strengthStage: {
                            opponent: 0.6,
                            player: 0.1,
                        },
                        traitStage: {
                            opponent: 0.7142857142857143,
                            player: 0.8571428571428571,
                        },
                    },
                },
                arena: {
                    metadata: {
                        arenaStateId: expect.any(String),
                        playerId: '123',
                        playerStrength: expect.any(Number),
                        playerTraits: [
                            {
                                name: 'Background',
                                value: 'Halo',
                            },
                            {
                                name: 'Body',
                                value: 'SugarSkull',
                            },
                            {
                                name: 'Neck',
                                value: 'RedCollar',
                            },
                            {
                                name: 'Mouth',
                                value: 'None',
                            },
                            {
                                name: 'Ears',
                                value: 'None',
                            },
                            {
                                name: 'Head',
                                value: 'StripedBeanie',
                            },
                            {
                                name: 'Eyes',
                                value: 'BlueLaserEyes',
                            },
                        ],
                    },
                    players: [
                        {
                            id: '123',
                            image: expect.any(String),
                            flowRate: 0.0054,
                            balance: 500,
                            traits: [
                                {
                                    name: 'Background',
                                    outcome: 'equal',
                                    value: 'Halo',
                                },
                                {
                                    name: 'Body',
                                    outcome: 'equal',
                                    value: 'SugarSkull',
                                },
                                {
                                    name: 'Neck',
                                    outcome: 'equal',
                                    value: 'RedCollar',
                                },
                                {
                                    name: 'Mouth',
                                    outcome: 'equal',
                                    value: 'None',
                                },
                                {
                                    name: 'Ears',
                                    outcome: 'equal',
                                    value: 'None',
                                },
                                {
                                    name: 'Head',
                                    outcome: 'equal',
                                    value: 'StripedBeanie',
                                },
                                {
                                    name: 'Eyes',
                                    outcome: 'equal',
                                    value: 'BlueLaserEyes',
                                },
                            ],
                            traitsScore: { player: 1, opponent: 1 },
                        },
                        {
                            id: '1013679a0814d9ec772f95d778c35fc5',
                            image: expect.any(String),
                            flowRate: 0.0054,
                            balance: 1500,
                            traits: [
                                {
                                    name: 'Background',
                                    outcome: 'disadvantage',
                                    value: 'None',
                                },
                                {
                                    name: 'Body',
                                    outcome: 'disadvantage',
                                    value: 'Alien',
                                },
                                {
                                    name: 'Neck',
                                    outcome: 'equal',
                                    value: 'RedCollar',
                                },
                                {
                                    name: 'Mouth',
                                    outcome: 'advantage',
                                    value: 'Pizza',
                                },
                                {
                                    name: 'Ears',
                                    outcome: 'equal',
                                    value: 'None',
                                },
                                {
                                    name: 'Head',
                                    outcome: 'equal',
                                    value: 'StripedBeanie',
                                },
                                {
                                    name: 'Eyes',
                                    outcome: 'equal',
                                    value: 'BlueLaserEyes',
                                },
                            ],
                            traitsScore: { player: 0.8571428571428571, opponent: 0.7142857142857143 },
                        },
                    ],
                },
            });
        });
    });
});
