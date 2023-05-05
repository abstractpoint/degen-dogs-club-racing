import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { webhookHandler } from '../../app';
import { ddb, queryArena } from '../../clients/ddb';

const webhookBody =
    '{"webhookId":"wh_7ilaiyyncvttn0ev","id":"whevt_8pzmux1jbu601gig","createdAt":"2023-04-25T19:51:08.327Z","type":"GRAPHQL","event":{"data":{"block":{"hash":"0xb72073cffe018c272197d5d658eee44796637ce616a24aa5ac63b0dd6e77dbd3","number":41952370,"timestamp":1682452267,"logs":[{"data":"0x0000000000000000000000000000000000000000000000000000000064482f2b00000000000000000000000000000000000000000000000000000058989c533d0000000000000000000000000000000000000000000000000000000000000000","topics":["0x51469a4939d1752a5c89cee4ca2127dc885265a976dca32e5291f17a53a923e4","0x0000000000000000000000004444ad20879051b696a1c14ccf6e3b0459466666"],"index":91,"account":{"address":"0xc131589fc8b0e79576667175f72d92a5266542b0"}}]}},"sequenceNumber":"10000000020550667000"}}';

describe('Webhook Handler Service', function () {
    it('verifies successful mutation based on event webhook', async () => {
        const event = {
            httpMethod: 'post',
            body: webhookBody,
            headers: {},
            isBase64Encoded: false,
            multiValueHeaders: {},
            multiValueQueryStringParameters: {},
            path: '/webhook',
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
                path: '/webhook',
                protocol: 'HTTP/1.1',
                requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
                requestTimeEpoch: 1428582896000,
                resourceId: '123456',
                resourcePath: '/webhook',
                stage: 'dev',
            },
            resource: '',
            stageVariables: {},
        };
        const result = await webhookHandler(event);

        expect(result.statusCode).toEqual(200);

        expect(JSON.parse(result.body)).toEqual({
            response: expect.any(String),
        });
    });
});
