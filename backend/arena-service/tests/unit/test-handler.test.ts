import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { arenaHandler, challengeHandler } from '../../app';
import { arenaResponse, challengeResponse } from '../../constants';

const challengeInput = {
    opponentId: '2',
    arenaStateId: '6DC419FB-311F-4F57-9FAA-A7A743519B10',
};

describe('Service', function () {
    describe('Unit test arena handler', function () {
        it('verifies successful response', async () => {
            const event: APIGatewayProxyEvent = {
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
            const result: APIGatewayProxyResult = await arenaHandler(event);

            expect(result.statusCode).toEqual(200);
            expect(result.body).toEqual(JSON.stringify(arenaResponse));
        });
    });
    describe('Unit test challenge handler', function () {
        it('verifies successful response', async () => {
            const event: APIGatewayProxyEvent = {
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
            const result: APIGatewayProxyResult = await challengeHandler(event);

            expect(result.statusCode).toEqual(200);
            expect(result.body).toEqual(JSON.stringify(challengeResponse));
        });
    });
});
