export const arenaABI = [
    {
        inputs: [
            {
                internalType: 'contract ISuperfluid',
                name: 'host',
                type: 'address',
            },
            {
                internalType: 'contract IConstantFlowAgreementV1',
                name: 'cfa',
                type: 'address',
            },
            {
                internalType: 'contract IInstantDistributionAgreementV1',
                name: 'ida',
                type: 'address',
            },
            {
                internalType: 'contract ISuperToken',
                name: 'superToken',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_owner',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'InvalidToken',
        type: 'error',
    },
    {
        inputs: [],
        name: 'NotHost',
        type: 'error',
    },
    {
        inputs: [],
        name: 'OutOfSequence',
        type: 'error',
    },
    {
        inputs: [],
        name: 'TemporarilyUnavailable',
        type: 'error',
    },
    {
        inputs: [],
        name: 'Unauthorized',
        type: 'error',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'distributionAmount',
                type: 'uint256',
            },
        ],
        name: 'ActionExecuted',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'i',
                type: 'uint256',
            },
        ],
        name: 'Log',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'bool',
                name: 'i',
                type: 'bool',
            },
        ],
        name: 'Log2',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint128',
                name: 'distributionUnits',
                type: 'uint128',
            },
        ],
        name: 'UnitsSet',
        type: 'event',
    },
    {
        inputs: [],
        name: '_distributeDone',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: '_interimAccounts',
        outputs: [
            {
                internalType: 'uint128',
                name: 'flowAverage',
                type: 'uint128',
            },
            {
                internalType: 'uint256',
                name: 'timestampDelta',
                type: 'uint256',
            },
            {
                internalType: 'uint128',
                name: 'newUnits',
                type: 'uint128',
            },
            {
                internalType: 'bool',
                name: 'newUnitsPending',
                type: 'bool',
            },
            {
                internalType: 'uint128',
                name: 'adjustmentUnits',
                type: 'uint128',
            },
            {
                internalType: 'bool',
                name: 'adjustmentPositive',
                type: 'bool',
            },
            {
                internalType: 'bool',
                name: 'adjustmentPending',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: '_pausedFlowCreation',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: '_postDistributeDone',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: '_preDistributeDone',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'accountList',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract ISuperToken',
                name: '_token',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_agreementClass',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: '_agreementId',
                type: 'bytes32',
            },
            {
                internalType: 'bytes',
                name: '_agreementData',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: '_ctx',
                type: 'bytes',
            },
        ],
        name: 'afterAgreementCreated',
        outputs: [
            {
                internalType: 'bytes',
                name: 'newCtx',
                type: 'bytes',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract ISuperToken',
                name: '_token',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_agreementClass',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: '_agreementId',
                type: 'bytes32',
            },
            {
                internalType: 'bytes',
                name: '_agreementData',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: '_ctx',
                type: 'bytes',
            },
        ],
        name: 'afterAgreementTerminated',
        outputs: [
            {
                internalType: 'bytes',
                name: 'newCtx',
                type: 'bytes',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract ISuperToken',
                name: '_token',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_agreementClass',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: '_agreementId',
                type: 'bytes32',
            },
            {
                internalType: 'bytes',
                name: '_agreementData',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: '_ctx',
                type: 'bytes',
            },
        ],
        name: 'afterAgreementUpdated',
        outputs: [
            {
                internalType: 'bytes',
                name: 'newCtx',
                type: 'bytes',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_account',
                type: 'address',
            },
        ],
        name: 'allowAccount',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract ISuperToken',
                name: '',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        name: 'beforeAgreementCreated',
        outputs: [
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract ISuperToken',
                name: '',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        name: 'beforeAgreementTerminated',
        outputs: [
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract ISuperToken',
                name: '',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        name: 'beforeAgreementUpdated',
        outputs: [
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_newOwner',
                type: 'address',
            },
        ],
        name: 'changeOwner',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract ISuperToken',
                name: 'token',
                type: 'address',
            },
        ],
        name: 'deleteFlowIntoContract',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'distributeAll',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'distributeCombined',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'distributionAmount',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'timestamp',
                type: 'uint256',
            },
        ],
        name: 'distributeCombined',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'distributionAmount',
                type: 'uint256',
            },
        ],
        name: 'distributeExact',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bool',
                name: 'paused',
                type: 'bool',
            },
        ],
        name: 'pauseFlowCreation',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'postDistribute',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'timestamp',
                type: 'uint256',
            },
        ],
        name: 'preDistribute',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'preDistribute',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'publicDistribute',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_account',
                type: 'address',
            },
        ],
        name: 'removeAccount',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'subscriber',
                type: 'address',
            },
        ],
        name: 'stats1ForSubscriber',
        outputs: [
            {
                internalType: 'uint128',
                name: '',
                type: 'uint128',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                internalType: 'uint128',
                name: '',
                type: 'uint128',
            },
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
            {
                internalType: 'uint128',
                name: '',
                type: 'uint128',
            },
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'subscriber',
                type: 'address',
            },
        ],
        name: 'stats2ForSubscriber',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
            {
                internalType: 'uint128',
                name: '',
                type: 'uint128',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'subscriber',
                type: 'address',
            },
        ],
        name: 'subscriberBalance',
        outputs: [
            {
                internalType: 'uint128',
                name: '',
                type: 'uint128',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'subscriber',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'timestamp',
                type: 'uint256',
            },
        ],
        name: 'subscriberBalanceForTimestamp',
        outputs: [
            {
                internalType: 'uint128',
                name: '',
                type: 'uint128',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: 'address',
                        name: 'subscriber',
                        type: 'address',
                    },
                    {
                        internalType: 'uint128',
                        name: 'adjustmentUnits',
                        type: 'uint128',
                    },
                    {
                        internalType: 'bool',
                        name: 'adjustmentPositive',
                        type: 'bool',
                    },
                ],
                internalType: 'struct Adjustment[]',
                name: 'updates',
                type: 'tuple[]',
            },
        ],
        name: 'updateAdjustmentUnits',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract ISuperToken',
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'withdrawFunds',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
