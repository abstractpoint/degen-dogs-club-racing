import { toDisplayNumber } from '../utils';
import { BigNumber } from 'ethers';
import { traitMap } from './trait-map';

export const directory = {
    dog: '0xA920464B46548930bEfECcA5467860B2b4C2B5b9',
    arena: '0xc131589fc8b0e79576667175f72d92a5266542b0', // mainnet polygon deployment
    superToken: '0x76220628fc2847c41b14967a75f3093f6e56998a', // BSCT supertoken
};

const flatPlayerTraits = (traits: any[] = []) => {
    return traits.map((each) => ({ name: each.trait_type, value: each.value }));
};

enum Outcome {
    EQUAL = 'equal',
    ADVANTAGE = 'advantage',
    DISADVANTAGE = 'disadvantage',
}

const flatTraitsWithOutcome = (traits: any[] = [], playerTraits: any[] = []) => {
    const traitsTransformed = traits.map((each, i) => {
        const traitLabel = `${each.trait_type}#${each.value}` as keyof typeof traitMap;
        const [ownGroup, winsAgainst] = traitMap[traitLabel];
        if (playerTraits.length === 0) {
            return { name: each.trait_type, value: each.value, outcome: Outcome.EQUAL };
        }
        const playerTraitLabel = `${playerTraits[i].name}#${playerTraits[i].value}`;
        const [playerGroup, playerWinsAgainst] = traitMap[playerTraitLabel as keyof typeof traitMap];
        let outcome;

        if (ownGroup === playerGroup) {
            outcome = Outcome.EQUAL;
        } else if (winsAgainst === playerGroup) {
            outcome = Outcome.ADVANTAGE;
        } else if (playerWinsAgainst === ownGroup) {
            outcome = Outcome.DISADVANTAGE;
        }

        return { name: each.trait_type, value: each.value, outcome };
    });
    const traitsScore = traitsTransformed.reduce(
        (counts, { outcome }) => ({
            player: outcome !== Outcome.ADVANTAGE ? counts.player + 1 : counts.player,
            opponent: outcome !== Outcome.DISADVANTAGE ? counts.opponent + 1 : counts.opponent,
        }),
        { player: 0, opponent: 0 },
    );
    return {
        traits: traitsTransformed,
        traitsScore: {
            player: traits.length > 0 ? traitsScore.player / traits.length : 0,
            opponent: traits.length > 0 ? traitsScore.opponent / traits.length : 0,
        },
    };
};

export const arenaResponse = (stateId: string, player: Record<string, any>, Items: Record<string, any>[]) => {
    const playerTraits = flatPlayerTraits(player.attributes);
    const players = Items.filter((item) => item.sk.startsWith('#PLAYER#')).map((eachPlayer) => {
        const { traits, traitsScore } = flatTraitsWithOutcome(eachPlayer.attributes, playerTraits);
        return {
            id: eachPlayer.id,
            image: eachPlayer.image,
            flowRate: toDisplayNumber(eachPlayer.flowRate, 9),
            balance: toDisplayNumber(
                BigNumber.from(eachPlayer.balance).add(BigNumber.from(eachPlayer.adjustment)).toString(),
                1,
            ),
            traits,
            traitsScore,
        };
    });
    return {
        metadata: {
            arenaStateId: stateId,
            playerId: player.id,
            playerStrength: player.strength,
            playerTraits,
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

export const challengeResponse = (stateId: string, player: Record<string, any>, Items: Record<string, any>[]) => ({
    challenge: {
        result: 'ARENA_CHANGED',
        message: 'Changes in the arena',
    },
    arena: arenaResponse(stateId, player, Items),
});

export const challengeResponseRace = (
    stateId: string,
    player: Record<string, any>,
    opponent: Record<string, any>,
    coinsDifference: string,
    newPlayerStrength: number,
    Items: Record<string, any>[],
) => {
    const factor = 1000;
    const factorBN = BigNumber.from(factor);
    const plFlBN = BigNumber.from(player.flowRate);
    const opFlBN = BigNumber.from(opponent.flowRate);
    const playerStreamPercent = plFlBN.gt(opFlBN) ? 1 : plFlBN.mul(factorBN).div(opFlBN).toNumber() / factor;
    const opponentStreamPercent = opFlBN.gt(plFlBN) ? 1 : opFlBN.mul(factorBN).div(plFlBN).toNumber() / factor;

    const streamStage = {
        player: Math.max(playerStreamPercent, 0.5),
        opponent: Math.max(opponentStreamPercent, 0.5),
    };

    const { traitsScore: traitStage } = flatTraitsWithOutcome(opponent.attributes, flatPlayerTraits(player.attributes));

    const strengthStage = {
        player: player.strength,
        opponent: opponent.strength,
    };

    const playerSum = streamStage.player + traitStage.player + strengthStage.player;
    const opponentSum = streamStage.opponent + traitStage.opponent + strengthStage.opponent;
    const playerSumNormalised = playerSum > opponentSum ? 1 : playerSum / opponentSum;
    const opponentSumNormalised = opponentSum > playerSum ? 1 : opponentSum / playerSum;

    const result = playerSumNormalised > opponentSumNormalised ? 'PLAYER_WIN' : 'PLAYER_LOSS';
    const coins = toDisplayNumber(coinsDifference, 3);
    const message =
        playerSumNormalised > opponentSumNormalised
            ? `You have won & opponent lost ${coins} coins.`
            : `Opponent has won, you lost ${coins} coins.`;

    return {
        challenge: {
            result,
            message,
            payload: {
                player: playerSumNormalised,
                opponent: opponentSumNormalised,
                streamStage,
                traitStage,
                strengthStage,
            },
        },
        arena: arenaResponse(stateId, { ...player, strength: newPlayerStrength }, Items),
    };
};

export const apiUrls = {
    polygon: {
        graph: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-matic',
    },
    mumbai: {
        graph: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai',
    },
    nft: {
        meta: 'https://api.degendogs.club/meta',
    },
};

export const logTopics = {
    interimAccountUpdate: '0x51469a4939d1752a5c89cee4ca2127dc885265a976dca32e5291f17a53a923e4',
};
