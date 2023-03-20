// SPDX-License-Identifier: AGPLv3
pragma solidity ^0.8.16;

import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {ISuperToken, ISuperfluid, SuperAppBase, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import {IInstantDistributionAgreementV1, IDAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/IDAv1Library.sol";

error InvalidToken();
error NotHost();
error TemporarilyUnavailable();

struct InterimAccount {
    uint128 flowAverage;
    uint256 timestampDelta;
    uint128 newUnits;
    bool newUnitsPending;
    uint128 adjustmentUnits;
    bool adjustmentPositive;
    bool adjustmentPending;
}

abstract contract StreamInDistributeOut is SuperAppBase {
    using IDAv1Library for IDAv1Library.InitData;

    event ActionExecuted(uint256 distributionAmount);
    event UnitsSet(uint128 distributionUnits);
    event Log(uint i);
    event Log2(bool i);

    address[] internal _pendingActions;
    uint256 _lastDistribution;
    mapping(address => InterimAccount) public _interimAccounts;
    IDAv1Library.InitData internal _idaLib;
    ISuperfluid internal immutable _host;
    IConstantFlowAgreementV1 internal immutable _cfa;
    ISuperToken internal immutable _superToken;
    uint32 internal constant INDEX_ID = 0;
    bool public _pausedFlowCreation;


    modifier onlyHost() {
        if (msg.sender != address(_host)) revert NotHost();
        _;
    }

    modifier onlyExpectedToken(ISuperToken superToken) {
        if (superToken != _superToken) revert InvalidToken();
        _;
    }

    modifier onlyWhenUnpaused() {
        if (_pausedFlowCreation) revert TemporarilyUnavailable();
        _;
    }

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        IInstantDistributionAgreementV1 ida,
        ISuperToken superToken
    ) {
        _idaLib = IDAv1Library.InitData(host, ida);
        _host = host;
        _cfa = cfa;
        _superToken = superToken;
        // setting last distribution as contract creating time for the first time
        _lastDistribution = block.timestamp;
        _pausedFlowCreation = false;

        host.registerApp(
            SuperAppDefinitions.APP_LEVEL_FINAL |
                SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
                SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
                SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP
        );

        _idaLib.createIndex(superToken, INDEX_ID);
    }

    function _pauseFlowCreation(bool paused) internal {
        _pausedFlowCreation = paused;
    }

    function _getInterimAccount(address subscriber) internal view returns (uint128, uint256, uint128, bool, uint128, bool, bool) {
        return (_interimAccounts[subscriber].flowAverage,
        _interimAccounts[subscriber].timestampDelta,
        _interimAccounts[subscriber].newUnits,
        _interimAccounts[subscriber].newUnitsPending,
        _interimAccounts[subscriber].adjustmentUnits,
        _interimAccounts[subscriber].adjustmentPositive,
        _interimAccounts[subscriber].adjustmentPending);
    }

    function _getSubscriptionUnits(address subscriber) internal view returns (uint128) {
        ( , , uint128 idaUnits,) = _idaLib.getSubscription(
            _superToken,
            address(this),
            INDEX_ID,
            subscriber
        );
        return idaUnits;
    }

    function _isNotPending(address subscriber) internal view returns (bool) {
        if (_interimAccounts[subscriber].newUnitsPending == true ||
            _interimAccounts[subscriber].adjustmentPending == true) {
            return false;
        }
        return true;
    }

    function _latestAverages(address subscriber, uint256 timestamp) internal view returns (uint128, uint256) {
        uint128 newTimestampDelta = uint128(timestamp - _lastDistribution);
        uint128 existingFlow;
        InterimAccount memory currentInterimAccount;
        currentInterimAccount = _interimAccounts[subscriber];
        if (currentInterimAccount.flowAverage == 0) {
            ( , , uint128 flowRate,) = _idaLib.getSubscription(
                _superToken,
                address(this),
                INDEX_ID,
                subscriber
            );
            existingFlow = flowRate;
        } else {
            existingFlow = currentInterimAccount.flowAverage;
        }

        // total of old average
        // uint256 amountOwed = (block.timestamp - lastDistribution) * uint256(int256(flowRate));
        uint128 timestampDelta = uint128(currentInterimAccount.timestampDelta);
        uint128 oldSum = existingFlow * timestampDelta;
        uint128 newSum = currentInterimAccount.newUnits * (newTimestampDelta - timestampDelta);
        uint128 allSums = oldSum + newSum;
        uint128 newAverageFlow = allSums / newTimestampDelta;
        return (newAverageFlow, newTimestampDelta);
    }


    function _updateInterimAccount(address subscriber, int96 flowRate) internal {
        if (_isNotPending(subscriber)) _pendingActions.push(subscriber);

        (uint128 newAverageFlow, uint256 newTimestampDelta) = _latestAverages(subscriber, block.timestamp);

        // adding to averages
        _interimAccounts[subscriber].flowAverage = newAverageFlow;
        _interimAccounts[subscriber].timestampDelta = newTimestampDelta;
        // saving latest flowrate as new pending
        _interimAccounts[subscriber].newUnits = uint128(int128(flowRate));
        _interimAccounts[subscriber].newUnitsPending = true;
    }

    function _updateAdjustmentUnits(address subscriber, uint128 adjustmentUnits, bool adjustmentPositive) internal {
        if (_isNotPending(subscriber)) _pendingActions.push(subscriber);

        InterimAccount memory currentInterimAccount;
        currentInterimAccount = _interimAccounts[subscriber];
        _interimAccounts[subscriber].adjustmentUnits = adjustmentUnits;
        _interimAccounts[subscriber].adjustmentPositive = adjustmentPositive;
        _interimAccounts[subscriber].adjustmentPending = true;
    }

    function _preAction(uint256 timestamp) internal {
        for (uint i = 0; i < _pendingActions.length; i++) {
            address subscriber = _pendingActions[i];
            uint128 newUnits;

            InterimAccount memory currentInterimAccount;
            currentInterimAccount = _interimAccounts[subscriber];

            if (currentInterimAccount.newUnitsPending) {
                (uint128 newAverageFlow,) = _latestAverages(subscriber, timestamp);
                newUnits = newAverageFlow;
                // clear the averages
                _interimAccounts[subscriber].flowAverage = 0;
                _interimAccounts[subscriber].timestampDelta = 0;
                // !!! units pending is still true, as that will be set in post distribute
            } else {
                ( , , uint128 existingUnits,) = _idaLib.getSubscription(
                    _superToken,
                    address(this),
                    INDEX_ID,
                    subscriber
                );
                newUnits = existingUnits;
            }

            if (currentInterimAccount.adjustmentPending) {
                if (currentInterimAccount.adjustmentPositive) {
                    newUnits = newUnits + currentInterimAccount.adjustmentUnits;
                } else {
                    newUnits = newUnits - currentInterimAccount.adjustmentUnits;
                }
                // !!! adjustment pending remains true because we need to reverse the calc in post distribute
            }

            // adjust the IDA units
            // adjust the IDA units
            // adjust the IDA units
            _idaLib.updateSubscriptionUnits(
                _superToken,
                INDEX_ID,
                subscriber,
                newUnits
            );

            emit UnitsSet(newUnits);
        }
    }


    function _postAction() internal {
        for (uint i = 0; i < _pendingActions.length; i++) {
            address subscriber = _pendingActions[i];
            uint128 newUnits;

            InterimAccount memory currentInterimAccount;
            currentInterimAccount = _interimAccounts[subscriber];
            if (currentInterimAccount.newUnitsPending) {
                newUnits = uint128(currentInterimAccount.newUnits);
                // clear the new units pending
                _interimAccounts[subscriber].newUnits = 0;
                _interimAccounts[subscriber].newUnitsPending = false;
            } else {
                ( , , uint128 existingUnits,) = _idaLib.getSubscription(
                    _superToken,
                    address(this),
                    INDEX_ID,
                    subscriber
                );
                newUnits = existingUnits;
            }

            if (currentInterimAccount.adjustmentPending) {
                // reverse earlier additions/subtractions
                if (currentInterimAccount.adjustmentPositive) {
                    newUnits = newUnits - currentInterimAccount.adjustmentUnits; // reverse
                } else {
                    newUnits = newUnits + currentInterimAccount.adjustmentUnits; // reverse
                }
                _interimAccounts[subscriber].adjustmentUnits = 0;
                _interimAccounts[subscriber].adjustmentPositive = true;
                _interimAccounts[subscriber].adjustmentPending = false;
            }


            // adjust the IDA units
            // adjust the IDA units
            // adjust the IDA units
            _idaLib.updateSubscriptionUnits(
                _superToken,
                INDEX_ID,
                subscriber,
                newUnits
            );

            emit UnitsSet(newUnits);
        }

        delete _pendingActions;
    }


    // ---------------------------------------------------------------------------------------------
    // ACTION EXECUTION
    function _executeAction() internal {
        uint256 distributionAmount = _beforeDistribution();

        _idaLib.distribute(_superToken, INDEX_ID, distributionAmount);

        _lastDistribution = block.timestamp;

        emit ActionExecuted(distributionAmount);
    }

    function _executeActionExact(uint256 distributionAmount) internal {
        _beforeDistribution();

        _idaLib.distribute(_superToken, INDEX_ID, distributionAmount);

        _lastDistribution = block.timestamp;

        emit ActionExecuted(distributionAmount);
    }

    /// @dev Executes dev-defined action BEFORE the out-token distribution.
    /// @return distributionAmount Amount to distribute
    function _beforeDistribution() internal virtual returns (uint256 distributionAmount) {}

    // ---------------------------------------------------------------------------------------------
    // SUPER APP CALLBACKS

    function afterAgreementCreated(
        ISuperToken _token,
        address _agreementClass,
        bytes32 _agreementId, //_agreementId
        bytes calldata _agreementData, //_agreementData
        bytes calldata, //_cbdata
        bytes calldata _ctx
    )
    external
    override
    onlyExpectedToken(_token)
    onlyHost
    onlyWhenUnpaused
    returns (bytes memory newCtx)
    {
        if (_agreementClass != address(_cfa)) {
            return _ctx;
        }
        newCtx = _ctx;
        (address subscriber, ) = abi.decode(_agreementData, (address, address));
        (, int96 flowRate, , ) = _cfa.getFlowByID(_token, _agreementId);
        _updateInterimAccount(subscriber, flowRate);
        return newCtx;
    }

    function afterAgreementUpdated(
        ISuperToken _token,
        address _agreementClass,
        bytes32 _agreementId, // _agreementId,
        bytes calldata _agreementData, // _agreementData,
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    )
    external
    override
    onlyExpectedToken(_token)
    onlyHost
    returns (bytes memory newCtx)
    {
        if (_agreementClass != address(_cfa)) {
            return _ctx;
        }
        newCtx = _ctx;
        (address subscriber, ) = abi.decode(_agreementData, (address, address));
        (, int96 flowRate, , ) = _cfa.getFlowByID(_token, _agreementId);
        _updateInterimAccount(subscriber, flowRate);
        return newCtx;
    }

    function afterAgreementTerminated(
        ISuperToken _token,
        address _agreementClass,
        bytes32 _agreementId, // _agreementId,
        bytes calldata _agreementData, // _agreementData
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        // According to the app basic law, we should never revert in a termination callback
        if (_token != _superToken || _agreementClass != address(_cfa)) {
            return _ctx;
        }

        newCtx = _ctx;
        (address subscriber, ) = abi.decode(_agreementData, (address, address));
        (, int96 flowRate, , ) = _cfa.getFlowByID(_token, _agreementId);
        _updateInterimAccount(subscriber, flowRate);
        return newCtx;
    }

}
