import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { authHandler } from '../../app';
import { ddb, queryArena } from '../../clients/ddb';

const authInput = {
    signature:
        '0xb89d0cd07605bf69eab07b662714aa8889942fa585e7ae3daef9e34597f622326ea14c4f1b3952eb018f8db43118cc80324fb5b4e41fbee543bc1561357013351b',
};

describe('Auth Handler Service', function () {
    it('verifies successful response to signature', async () => {
        const event = {
            httpMethod: 'post',
            body: JSON.stringify(authInput),
            headers: {},
            isBase64Encoded: false,
            multiValueHeaders: {},
            multiValueQueryStringParameters: {},
            path: '/auth',
            pathParameters: {},
            queryStringParameters: {},
            requestContext: {
                accountId: '123456789012',
                apiId: '1234',
                authorizer: {},
                httpMethod: 'post',
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
                path: '/auth',
                protocol: 'HTTP/1.1',
                requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
                requestTimeEpoch: 1428582896000,
                resourceId: '123456',
                resourcePath: '/auth',
                stage: 'dev',
            },
            resource: '',
            stageVariables: {},
        };
        const result = await authHandler(event);

        expect(result.statusCode).toEqual(200);

        expect(JSON.parse(result.body)).toEqual({
            ltp: expect.any(String),
        });
    });
    it('verifies successful response to LTP', async () => {
        //create an item in DB
        const timestamp = new Date().toISOString();
        const ttl = Math.floor(new Date().valueOf() / 1000) + 900; // 15 minutes
        await ddb.putItem({
            TableName: 'table',
            Item: marshall({
                pk: 'LTP#test-test-test',
                sk: '#SELF',
                address: '0x104D64F611aaA3F06F417F8D44F85A76FB44FbE9',
                ltp: 'test-test-test',
                timestamp,
                ttl: ttl,
            }),
        });
        const ltpAuthInput = {
            ltp: 'test-test-test',
        };
        const event = {
            httpMethod: 'post',
            body: JSON.stringify(ltpAuthInput),
            headers: {},
            isBase64Encoded: false,
            multiValueHeaders: {},
            multiValueQueryStringParameters: {},
            path: '/auth',
            pathParameters: {},
            queryStringParameters: {},
            requestContext: {
                accountId: '123456789012',
                apiId: '1234',
                authorizer: {},
                httpMethod: 'post',
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
                path: '/auth',
                protocol: 'HTTP/1.1',
                requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
                requestTimeEpoch: 1428582896000,
                resourceId: '123456',
                resourcePath: '/auth',
                stage: 'dev',
            },
            resource: '',
            stageVariables: {},
        };
        const result = await authHandler(event);

        expect(result.statusCode).toEqual(200);

        expect(JSON.parse(result.body)).toEqual({
            jwt: expect.any(String),
        });
    });
});
