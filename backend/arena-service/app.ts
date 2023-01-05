import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { arenaResponse, challengeResponse, challengeResponseRace } from './constants';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { putItem, getItem, updateArenaStateId } from './clients/ddb';
import { uuid } from './utils';

const corsHeaders = {
    'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET',
};

export const arenaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    try {
        const { Item } = await getItem({
            Key: marshall({
                pk: 'ARENA#CURRENT',
                sk: '#METADATA',
            }),
        });
        const { stateId } = unmarshall(Item!);
        response = {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(arenaResponse(stateId)),
        };
    } catch (err) {
        console.log(err);
        response = {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: err instanceof Error ? err.message : 'some error happened',
            }),
        };
    }

    return response;
};

export const challengeHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    try {
        const body = JSON.parse(event.body as string);
        if (!body.opponentId || !body.arenaStateId) {
            response = {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    message: 'Invalid challenge request',
                }),
            };
        } else {
            const stateId = uuid();
            const timestamp = new Date().toISOString();
            try {
                const updateResult = await updateArenaStateId(body.arenaStateId, stateId, timestamp);
                console.log(updateResult);
                response = {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(challengeResponseRace(stateId)),
                };
            } catch (err) {
                const { Item } = await getItem({
                    Key: marshall({
                        pk: 'ARENA#CURRENT',
                        sk: '#METADATA',
                    }),
                });
                const { stateId: existingStateId } = unmarshall(Item!);
                response = {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(challengeResponse(existingStateId)),
                };
            }
        }
    } catch (err) {
        console.log(err);
        response = {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: err instanceof Error ? err.message : 'some error happened',
            }),
        };
    }

    return response;
};
