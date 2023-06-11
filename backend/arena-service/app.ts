import { APIGatewayProxyEvent, APIGatewayProxyResult, ScheduledEvent } from 'aws-lambda';
import { customErrorFactory } from 'ts-custom-error';
import { BigNumber } from 'ethers';
import { defaultAbiCoder, getAddress } from 'ethers/lib/utils';
import {
    arenaResponse,
    challengeResponse,
    challengeResponseRace,
    playerOpponentBalanceMutation,
    directory,
} from './constants';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    putItem,
    queryArena,
    updatePlayersAndArena,
    queryPlayer,
    queryLtp,
    scheduleUpdatePlayersAndArena,
    queryArenaUnfiltered,
} from './clients/ddb';
import { accountTokenSnapshot } from './clients/graph';
import { getNFTId, getSubscriberBalance } from './clients/ethereum';
import { uuid, random, saltedHash, recoverAddressFromSignature, createLTP, toDisplayNumber } from './utils';
import { createToken, verifyToken } from './utils/auth';
import { nftMetadata } from './clients/meta';
import { logTopics } from './constants';

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

        const { stateId } = Items[Items.length - 1];

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
                attributes: [],
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

        const { stateId } = Items[Items.length - 1];

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
        const { playerAdjustment, opponentAdjustment, coinsDifference } = playerOpponentBalanceMutation(
            player,
            opponent,
        );
        // calculate new random strengths
        const newPlayerStrength = random();
        const newOpponentStrength = random();
        const newStateId = uuid();
        const timestamp = new Date().toISOString();
        try {
            await updatePlayersAndArena({
                existingStateId: body.arenaStateId,
                newStateId: newStateId,
                timestamp,
                playerSk: player.sk,
                opponentSk: opponent.sk,
                playerAdjustment,
                opponentAdjustment,
                playerStrength: newPlayerStrength,
                opponentStrength: newOpponentStrength,
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
            console.log(err);
            // arena changed response
            response = {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(challengeResponse(stateId, player, Items!)),
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
            const playerAddress = ltpItem.address.toLowerCase();

            const timestamp = new Date().toISOString();
            jwt = createToken({ address: playerAddress, timestamp });
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

export const scheduleHandler = async (event: ScheduledEvent): Promise<undefined> => {
    const { snapshot, inflows } = await accountTokenSnapshot(directory.arena, directory.superToken);
    console.log(snapshot, inflows);
    let Items;

    try {
        Items = await queryArenaUnfiltered().then(({ Items }) => Items?.map((item) => unmarshall(item)));

        if (!Items) {
            throw new Error('Unable to retrieve current arena');
        }
    } catch (e) {
        console.log(e);
    }

    const playersInDb = Items?.filter((item) => item.sk.startsWith('#PLAYER#'));

    const newPlayers = [];
    const updatedPlayers = [];
    let allShares = BigNumber.from('0');
    let arenaStateIdChanged = false;
    for (const [sender, inflow] of inflows) {
        const subscriberBalanceShares = await getSubscriberBalance(sender);
        allShares = allShares.add(BigNumber.from(subscriberBalanceShares));

        try {
            const nftId = await getNFTId(sender, directory.dog, '0');
            const existingPlayer = playersInDb?.find((each) => each.id === sender);

            if (!existingPlayer && nftId && inflow.currentFlowRate !== '0') {
                const { attributes } = await nftMetadata(nftId);
                // TODO: Add check for duplicate NFT ids to avoid someone moving the token between wallets
                newPlayers.push({
                    ...inflow,
                    sender,
                    balanceShares: subscriberBalanceShares,
                    inArena: true,
                    nftId,
                    attributes,
                });
                arenaStateIdChanged = true;
                continue;
            }

            if (nftId && inflow.currentFlowRate !== '0') {
                updatedPlayers.push({
                    ...inflow,
                    playerSk: existingPlayer?.sk,
                    balanceShares: subscriberBalanceShares,
                    inArena: true,
                });
                // arenaStateIdChanged remains false
                continue;
            }

            if (!nftId || inflow.currentFlowRate === '0') {
                updatedPlayers.push({
                    ...inflow,
                    playerSk: existingPlayer?.sk,
                    balanceShares: subscriberBalanceShares,
                    inArena: false,
                });
                arenaStateIdChanged = true;
                continue;
            }
        } catch (e) {}
    }

    console.log('allShares', allShares.toString());

    // take the inflows in the arrays and create a bulk update of players
    // balance calculation
    // update arena state id if players not in arena anymore

    const timestamp = new Date().toISOString();

    await scheduleUpdatePlayersAndArena({
        newStateId: arenaStateIdChanged ? uuid() : undefined,
        timestamp,
        newPlayers,
        updatedPlayers,
        allShares,
        balanceUntilUpdatedAt: snapshot.balanceUntilUpdatedAt,
        totalNetFlowRate: snapshot.totalNetFlowRate,
        updatedAtTimestamp: snapshot.updatedAtTimestamp,
    });

    // TODO: items below for distribute

    //// if end of round (or distribute time)

    //// snapshot current players and balances

    //// set adjustments for all players

    //// execute distribute

    //// remove any players that stopped streaming

    return;
};

export const webhookHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let response: APIGatewayProxyResult;
    let Items;
    const body = JSON.parse(event.body as string);
    const logs = body.event?.data?.block?.logs;

    if (!logs || logs.length === 0) {
        response = {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ response: 'ok' }),
        };
        return response;
    }

    try {
        Items = await queryArenaUnfiltered().then(({ Items }) => Items?.map((item) => unmarshall(item)));

        if (!Items) {
            throw new Error('Unable to retrieve current arena');
        }
    } catch (e) {
        console.log(e);
    }

    const playersInDb = Items?.filter((item) => item.sk.startsWith('#PLAYER#'));

    const interimAccountUpdateLogs = logs.filter(
        (each: any) => each.topics.includes(logTopics.interimAccountUpdate) && each.account.address === directory.arena,
    );

    // verify that the event is for correct deployed contract before acting on it
    // verify webhook key
    // extract address of subscriber, timestamp, flowrate, flow-average
    // update just a single player for each event

    interimAccountUpdateLogs.forEach((each: any) => console.log('each', each));

    const topic = '0x0000000000000000000000004444ad20879051b696a1c14ccf6e3b0459466666';
    const address = defaultAbiCoder.decode(['address'], topic);
    const data =
        '0x00000000000000000000000000000000000000000000000000000000644830b50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a923a39';
    const decoded = defaultAbiCoder.decode(['uint256', 'uint128', 'uint128'], data);

    console.log(address, decoded[0].toString(), decoded[1].toString(), decoded[2].toString());

    const timestamp = new Date().toISOString();
    const eventItem = {
        pk: `EVENT#latest`,
        sk: `#SELF`,
        // gs1pk: `EVENT#${address}`,
        // gs1sk: `#SELF`,
        body: event.body,
        timestamp: timestamp,
    };
    await putItem(eventItem);

    response = {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ response: 'ok' }),
    };

    return response;
};
