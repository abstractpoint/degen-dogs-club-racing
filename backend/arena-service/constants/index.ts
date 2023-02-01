import { toDisplayNumber } from '../utils';
import { BigNumber } from 'ethers';

export const players = [
    {
        id: '4',
        flowRate: 0.005119444444,
        balance: 879,
    },
    {
        id: '12',
        flowRate: 0.00345876,
        balance: 898,
    },
    {
        id: '34',
        flowRate: 0.00434598687,
        balance: 943,
    },
    {
        id: '5',
        flowRate: 0.0079238457,
        balance: 742,
    },
    {
        id: '11',
        flowRate: 0.006234975,
        balance: 912,
    },
    {
        id: '9',
        flowRate: 0.00593284756,
        balance: 859,
    },
    {
        id: '21',
        flowRate: 0.00434856783,
        balance: 967,
    },
    {
        id: '17',
        flowRate: 0.005893467839,
        balance: 833,
    },
    {
        id: '50',
        flowRate: 0.006389475983,
        balance: 902,
    },
];

export const arenaResponse = (stateId: string, player: Record<string, any>, Items: Record<string, any>[]) => {
    const players = Items.filter((item) => item.sk.startsWith('PLAYER#')).map((eachPlayer) => ({
        id: eachPlayer.id,
        image: eachPlayer.image,
        flowRate: toDisplayNumber(eachPlayer.flowRate, 3),
        balance: toDisplayNumber(eachPlayer.balance, 0),
    }));
    return {
        metadata: {
            arenaStateId: stateId,
            playerId: player.id,
            playerStrength: player.strength,
        },
        players,
    };
};

export const playerOpponentBalanceMutation = (player: Record<string, any>, opponent: Record<string, any>) => {
    let playerBalanceBN;
    let opponentBalanceBN;
    if (player.strength > opponent.strength) {
        playerBalanceBN = BigNumber.from(opponent.balance).div('2').add(player.balance);
        opponentBalanceBN = BigNumber.from(opponent.balance).div('2');
    } else {
        playerBalanceBN = BigNumber.from(player.balance).div('2');
        opponentBalanceBN = BigNumber.from(player.balance).div('2').add(opponent.balance);
    }
    return { playerBalance: playerBalanceBN.toString(), opponentBalance: opponentBalanceBN.toString() };
};

export const challengeResponse = (
    stateId: string,
    player: Record<string, any>,
    newPlayerStrength: number,
    Items: Record<string, any>[],
) => ({
    challenge: {
        result: 'ARENA_CHANGED',
        message: 'Changes in the arena',
    },
    arena: arenaResponse(stateId, { id: player.id, strength: newPlayerStrength }, Items),
});

export const challengeResponseRace = (
    stateId: string,
    player: Record<string, any>,
    opponent: Record<string, any>,
    newPlayerStrength: number,
    Items: Record<string, any>[],
) => {
    const result = player.strength > opponent.strength ? 'PLAYER_WIN' : 'PLAYER_LOSS';
    // TODO: Add number of coins won/lost
    const message =
        player.strength > opponent.strength
            ? 'You have won & opponent lost coins.'
            : 'Opponent has won, you lost coins.';
    return {
        challenge: {
            result,
            message,
            payload: {
                player: player.strength,
                opponent: opponent.strength,
            },
        },
        arena: arenaResponse(stateId, { id: player.id, strength: newPlayerStrength }, Items),
    };
};
