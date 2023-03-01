import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { customErrorFactory } from 'ts-custom-error';
import { arenaResponse, challengeResponse, challengeResponseRace, playerOpponentBalanceMutation } from './constants';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { putItem, queryArena, updatePlayersAndArena, queryPlayer, queryLtp } from './clients/ddb';
import { uuid, random, saltedHash, recoverAddressFromSignature, createLTP } from './utils';
import { createToken, verifyToken } from './utils/auth';

const HttpError = customErrorFactory(function HttpError(code: number, message = '') {
    this.error_code = code;
    this.message = message;
}, Error);

const corsHeaders = {
    'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET',
};

export const arenaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    let Items;
    let player;
    const authHeader = event['headers']['Authorization'];

    try {
        Items = await queryArena().then(({ Items }) => Items?.map((item) => unmarshall(item)));

        if (!Items) {
            throw new Error('Unable to retrieve current arena');
        }

        const { stateId } = Items[0];

        if (authHeader) {
            const [_, jwt] = authHeader?.split(' ');
            if (jwt) {
                const { address } = verifyToken(jwt);
                player = Items.find((item) => {
                    const [_, __, ___, id] = item.sk.split('#');
                    return id === address.toLowerCase();
                });
            }
        }

        if (!player) {
            player = {
                id: '',
                strength: 0,
            };
        }

        response = {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(arenaResponse(stateId, player, Items!)),
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
    let Items;
    let player;
    const authHeader = event['headers']['Authorization'];
    try {
        Items = await queryArena().then(({ Items }) => Items?.map((item) => unmarshall(item)));

        if (!Items) {
            throw new Error('Unable to retrieve current arena');
        }

        const { stateId } = Items[0];

        const body = JSON.parse(event.body as string);
        if (!body.opponentId || !body.arenaStateId) {
            throw new HttpError(400, 'Invalid challenge request');
        }

        if (authHeader) {
            const [_, jwt] = authHeader?.split(' ');
            if (jwt) {
                const { address } = verifyToken(jwt);
                console.log(address);
                player = await queryPlayer(address.toLowerCase()).then(
                    ({ Items }) => Items?.map((item) => unmarshall(item))[0],
                );
            }
        }

        if (!player) {
            throw new HttpError(400, 'Authentication as player failed');
        }

        const opponent = await queryPlayer(body.opponentId).then(
            ({ Items }) => Items?.map((item) => unmarshall(item))[0],
        );

        if (!opponent) {
            throw new HttpError(400, 'Opponent does not exist');
        }
        // calculate new balances for player and opponent
        const { playerBalance, opponentBalance, coinsDifference } = playerOpponentBalanceMutation(player, opponent);
        // calculate new random strengths
        const newPlayerStrength = random();
        const newOpponentStrength = random();
        const ttl = Math.floor(new Date().valueOf() / 1000) + 604800; // 7 days in seconds
        const newStateId = uuid();
        const timestamp = new Date().toISOString();
        try {
            await updatePlayersAndArena({
                existingStateId: body.arenaStateId,
                newStateId: newStateId,
                timestamp,
                playerSk: player.sk,
                opponentSk: opponent.sk,
                playerBalance,
                opponentBalance,
                playerStrength: newPlayerStrength,
                opponentStrength: newOpponentStrength,
                ttl,
            }).catch((err) => {
                throw new HttpError(501, err);
            });
            Items = await queryArena().then(({ Items }) => Items?.map((item) => unmarshall(item)));
            response = {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(
                    challengeResponseRace(newStateId, player, opponent, coinsDifference, newPlayerStrength, Items!),
                ),
            };
        } catch (err) {
            // arena changed response
            response = {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(challengeResponse(stateId, player, newPlayerStrength, Items!)),
            };
        }
    } catch (err) {
        console.log(err);
        response = {
            statusCode: (err as any).error_code || 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: err instanceof Error ? err.message : 'some error happened',
            }),
        };
    }

    return response;
};

export const authHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    let ltp = undefined;
    let jwt = undefined;
    try {
        const body = JSON.parse(event.body as string);
        if (!body.signature && !body.ltp) {
            throw new HttpError(400, 'Invalid auth or login request');
        }
        if (body.signature) {
            let address;
            try {
                address = recoverAddressFromSignature(body.signature);
            } catch (err) {
                throw new HttpError(400, err instanceof Error ? err.message : 'Signature invalid');
            }
            ltp = createLTP();
            const timestamp = new Date().toISOString();
            const ltpItem = {
                pk: `LTP#${ltp}`,
                sk: `#SELF`,
                // gs1pk: `LTP#${address}`,
                // gs1sk: `#SELF`,
                address,
                ltp,
                timestamp: timestamp,
                ttl: Math.floor(new Date().valueOf() / 1000) + 900, // 15 minutes
            };
            await putItem(ltpItem);
        }

        if (body.ltp) {
            const ttl = Math.floor(new Date().valueOf() / 1000);
            const ltpItem = await queryLtp(body.ltp, ttl).then(
                ({ Items }) => Items?.map((item) => unmarshall(item))[0],
            );
            if (!ltpItem) {
                throw new HttpError(400, 'Invalid or expired LTP');
            }

            // TODO: verify address and image id

            const timestamp = new Date().toISOString();
            jwt = createToken({ address: ltpItem.address, timestamp });

            // check that the player is streaming, and create player

            // const timestamp = new Date().toISOString();
            // player = {
            //     pk: 'ARENA#CURRENT',
            //     sk: `#PLAYER#${timestamp}#${playerId}`,
            //     gs1pk: `PLAYER#${playerId}`,
            //     gs1sk: `#SELF`,
            //     id: playerId,
            //     image: String(Math.ceil(random() * 100)), // random image from 1 - 100
            //     flowRate: '0000005400000000000000',
            //     balance: '1000000000000000000000',
            //     strength: random(),
            //     timestamp: timestamp,
            // };
            // // TODO: change to use update item to avoid having to retrieve again
            // // TODO: Make a separate Join endpoint that accepts signature to auth and create player
            // await putItem(player);
            // Items = await queryArena().then(({ Items }) => Items?.map((item) => unmarshall(item)));
        }

        response = {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                ltp,
                jwt,
            }),
        };
    } catch (err) {
        console.log(err);
        response = {
            statusCode: (err as any).error_code || 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: err instanceof Error ? err.message : 'some error happened',
            }),
        };
    }

    return response;
};
