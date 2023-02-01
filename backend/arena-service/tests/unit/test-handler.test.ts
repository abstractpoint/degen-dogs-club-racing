import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { arenaHandler, challengeHandler } from '../../app';
import { ddb, queryArena } from '../../clients/ddb';

const challengeInput = {
    opponentId: 'b613679a0814d9ec772f95d778c35fc5',
    arenaStateId: '123',
};

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
            const event = {
                httpMethod: 'get',
                body: '',
                headers: {},
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
                    playerId: 'f90287c238319335abe062d35a680bb5',
                    playerStrength: expect.any(Number),
                },
                players: [
                    {
                        id: 'f90287c238319335abe062d35a680bb5',
                        image: expect.any(String),
                        flowRate: 0.005,
                        balance: 1000,
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
                            await ddb.updateItem(each.Update);
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
                    sk: `PLAYER#${timestamp}#f90287c238319335abe062d35a680bb5`,
                    gs1pk: `PLAYER#f90287c238319335abe062d35a680bb5`,
                    gs1sk: `#SELF`,
                    id: 'f90287c238319335abe062d35a680bb5',
                    image: '1',
                    flowRate: '0000005400000000000000',
                    balance: '1000000000000000000000',
                    strength: 0.5,
                    timestamp: timestamp,
                }),
            });
            // create opponent in db
            await ddb.putItem({
                TableName: 'table',
                Item: marshall({
                    pk: 'ARENA#CURRENT',
                    sk: `PLAYER#${timestamp}#b613679a0814d9ec772f95d778c35fc5`,
                    gs1pk: `PLAYER#b613679a0814d9ec772f95d778c35fc5`,
                    gs1sk: `#SELF`,
                    id: 'b613679a0814d9ec772f95d778c35fc5',
                    image: '2',
                    flowRate: '0000005400000000000000',
                    balance: '1000000000000000000000',
                    strength: 0.6,
                    timestamp: timestamp,
                }),
            });
            const event = {
                httpMethod: 'put',
                body: JSON.stringify(challengeInput),
                headers: {},
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
                    message: 'Opponent has won, you lost coins.',
                    payload: {
                        player: 0.5,
                        opponent: 0.6,
                    },
                },
                arena: {
                    metadata: {
                        arenaStateId: expect.any(String),
                        playerId: 'f90287c238319335abe062d35a680bb5',
                        playerStrength: expect.any(Number),
                    },
                    players: [
                        {
                            id: 'b613679a0814d9ec772f95d778c35fc5',
                            image: expect.any(String),
                            flowRate: 0.005,
                            balance: 1500,
                        },
                        {
                            id: 'f90287c238319335abe062d35a680bb5',
                            image: expect.any(String),
                            flowRate: 0.005,
                            balance: 500,
                        },
                    ],
                },
            });
        });
    });
});
