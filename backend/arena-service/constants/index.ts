import { toDisplayNumber } from '../utils';
import { BigNumber } from 'ethers';

export const arenaResponse = (stateId: string, player: Record<string, any>, Items: Record<string, any>[]) => {
    const players = Items.filter((item) => item.sk.startsWith('#PLAYER#')).map((eachPlayer) => ({
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
    const coinsDifferenceBN = BigNumber.from(player.balance).sub(playerBalanceBN).abs();
    return {
        playerBalance: playerBalanceBN.toString(),
        opponentBalance: opponentBalanceBN.toString(),
        coinsDifference: coinsDifferenceBN.toString(),
    };
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
    coinsDifference: string,
    newPlayerStrength: number,
    Items: Record<string, any>[],
) => {
    const result = player.strength > opponent.strength ? 'PLAYER_WIN' : 'PLAYER_LOSS';
    const coins = toDisplayNumber(coinsDifference, 0);
    const message =
        player.strength > opponent.strength
            ? `You have won & opponent lost ${coins} coins.`
            : `Opponent has won, you lost ${coins} coins.`;
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
