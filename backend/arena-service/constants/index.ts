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

export const arenaResponse = (stateId: string) => ({
    metadata: {
        arenaStateId: stateId,
        playerId: '4',
        playerStrength: 0.7,
    },
    players,
});

export const challengeResponse = (stateId: string) => ({
    challenge: {
        result: 'ARENA_CHANGED',
        message: 'Changes in the arena',
    },
    arena: {
        metadata: {
            arenaStateId: stateId,
            playerId: '4',
            playerStrength: 0.3,
        },
        // update arena with one less player (useful for manual testing)
        players: players.slice(0, players.length - 1),
    },
});

export const challengeResponseRace = (stateId: string) => ({
    challenge: {
        result: 'PLAYER_WIN',
        message: 'Player wins & Opponent losses 100 Coins.',
        payload: {
            player: 0.3,
            opponent: 0.2,
        },
    },
    arena: {
        metadata: {
            arenaStateId: stateId,
            playerId: '4',
            playerStrength: 0.5,
        },
        // update arena with one less player (useful for manual testing)
        players: players.slice(0, players.length - 2),
    },
});
