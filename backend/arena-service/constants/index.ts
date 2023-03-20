import { toDisplayNumber } from '../utils';
import { BigNumber } from 'ethers';

export const directory = {
    dog: '0xA920464B46548930bEfECcA5467860B2b4C2B5b9',
    arena: '0x346e44e9207715de96fdd6c00e6e002c956cb08f',
    superToken: '0x5d8b4c2554aeb7e86f387b4d6c00ac33499ed01f',
};

export const arenaResponse = (stateId: string, player: Record<string, any>, Items: Record<string, any>[]) => {
    const players = Items.filter((item) => item.sk.startsWith('#PLAYER#')).map((eachPlayer) => ({
        id: eachPlayer.id,
        image: eachPlayer.image,
        flowRate: toDisplayNumber(eachPlayer.flowRate, 9),
        balance: toDisplayNumber(
            BigNumber.from(eachPlayer.balance).add(BigNumber.from(eachPlayer.adjustment)).toString(),
            1,
        ),
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
    const playerTotalBN = BigNumber.from(player.balance).add(BigNumber.from(player.adjustment));
    const opponentTotalBN = BigNumber.from(opponent.balance).add(BigNumber.from(opponent.adjustment));
    if (player.strength > opponent.strength) {
        playerBalanceBN = playerTotalBN.add(opponentTotalBN.div('2'));
        opponentBalanceBN = playerTotalBN.div('2');
    } else {
        playerBalanceBN = playerTotalBN.div('2');
        opponentBalanceBN = opponentTotalBN.add(playerTotalBN.div('2'));
    }
    const coinsDifferenceBN = playerTotalBN.sub(playerBalanceBN).abs();
    return {
        playerAdjustment: playerBalanceBN.sub(BigNumber.from(player.balance)).toString(),
        opponentAdjustment: opponentBalanceBN.sub(BigNumber.from(opponent.balance)).toString(),
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
    const coins = toDisplayNumber(coinsDifference, 3);
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

export const apiUrls = {
    mumbai: {
        graph: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai',
    },
};
