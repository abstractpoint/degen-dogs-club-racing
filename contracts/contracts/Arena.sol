//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import {
    ISuperfluid,
    IInstantDistributionAgreementV1,
    IConstantFlowAgreementV1,
    StreamInDistributeOut,
    ISuperToken
} from "./base/StreamInDistributeOut.sol";

import { SuperTokenV1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";

error Unauthorized();
error OutOfSequence();

struct Adjustment {
    address subscriber;
    uint128 adjustmentUnits;
    bool adjustmentPositive;
}

contract Arena is StreamInDistributeOut {

    using SuperTokenV1Library for ISuperToken;


    address public owner;
    mapping(address => bool) public accountList;
    bool public _preDistributeDone;
    bool public _distributeDone;
    bool public _postDistributeDone;

    modifier onlyOwner() {
        if (msg.sender != address(owner)) revert Unauthorized();
        _;
    }

    modifier onlyAllowed() {
        if (msg.sender != address(owner) && !accountList[msg.sender]) revert Unauthorized();
        _;
    }

    modifier onlyWhenUndistributed() {
        uint256 futureTimestamp = _lastDistribution * 14 days;
        if (futureTimestamp > block.timestamp) revert Unauthorized();
        _;
    }

    modifier onlyPreDistribute() {
        if (_preDistributeDone == true || _distributeDone == true || _postDistributeDone == true) revert OutOfSequence();
        _;
    }
    modifier onlyDistribute() {
        if (_preDistributeDone == false || _distributeDone == true || _postDistributeDone == true) revert OutOfSequence();
        _;
    }
    modifier onlyPostDistribute() {
        if (_preDistributeDone == false || _distributeDone == false || _postDistributeDone == true) revert OutOfSequence();
        _;
    }

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        IInstantDistributionAgreementV1 ida,
        ISuperToken superToken,
        address _owner
    ) StreamInDistributeOut(host, cfa, ida, superToken) {
        owner = _owner;
    }

    function _resetFlags() internal {
        _preDistributeDone = false;
        _distributeDone = false;
        _postDistributeDone = false;
    }

    // @dev Before action callback. This can do calculation on a `superToken`, then returns the
    // amount to distribute out in the `executeAction` function.
    // @return distributionAmount amount to distribute after the callback.
    function _beforeDistribution() internal override returns (uint256 distributionAmount) {

        // Get the full balance of the underlying `_superToken` in the contract.
        // Only used by distributeAll as distributeExact accepts an amount
        distributionAmount = _superToken.balanceOf(address(this));
    }


    function preDistribute() external onlyAllowed onlyPreDistribute {
        _preAction(block.timestamp);
        _preDistributeDone = true;
    }

    function preDistribute(uint256 timestamp) external onlyAllowed onlyPreDistribute {
        _preAction(timestamp);
        _preDistributeDone = true;
    }

    function postDistribute() external onlyAllowed onlyPostDistribute {
        _postAction();
        _resetFlags();
    }

    function distributeAll() external onlyAllowed onlyDistribute {
        _executeAction();
        _distributeDone = true;
    }

    function distributeExact(uint256 distributionAmount) external onlyAllowed onlyDistribute {
        _executeActionExact(distributionAmount);
        _distributeDone = true;
    }

    function distributeCombined() external onlyAllowed onlyPreDistribute {
        _preAction(block.timestamp);
        _executeAction();
        _postAction();
        _resetFlags();
    }

    function distributeCombined(uint256 distributionAmount, uint256 timestamp) external onlyAllowed onlyPreDistribute {
        _preAction(timestamp);
        _executeActionExact(distributionAmount);
        _postAction();
        _resetFlags();
    }

    function publicDistribute() external onlyWhenUndistributed {
        _preAction(block.timestamp);
        _executeAction();
        _postAction();
        _resetFlags();
    }


    function updateAdjustmentUnits(Adjustment[] memory updates) external onlyAllowed {
        for(uint i = 0; i < updates.length; i++){
            _updateAdjustmentUnits(
                updates[i].subscriber,
                updates[i].adjustmentUnits,
                updates[i].adjustmentPositive
            );
        }
    }

    function stats1ForSubscriber(address subscriber) external view returns (
        uint128,
        uint256,
        uint128,
        bool,
        uint128,
        bool,
        bool
    ) {
        (uint128 flowAverage,
        uint256 timestampDelta,
        uint128 newUnits,
        bool newUnitsPending,
        uint128 adjustmentUnits,
        bool adjustmentPositive,
        bool adjustmentPending) = _getInterimAccount(subscriber);

        return (flowAverage,
            timestampDelta,
            newUnits,
            newUnitsPending,
            adjustmentUnits,
            adjustmentPositive,
            adjustmentPending);
    }

    function stats2ForSubscriber(address subscriber) external view returns (bool,uint128) {
                bool pendingActions = _isNotPending(subscriber) == false;
                uint128 idaUnits = _getSubscriptionUnits(subscriber);
        return (pendingActions, idaUnits);
    }

    function allowAccount(address _account) external onlyOwner {
        accountList[_account] = true;
    }

    function removeAccount(address _account) external onlyOwner {
        accountList[_account] = false;
    }

    function changeOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    function deleteFlowIntoContract(ISuperToken token) external onlyOwner onlyAllowed {
        token.deleteFlow(msg.sender, address(this));
    }

    function withdrawFunds(ISuperToken token, uint256 amount) external onlyOwner {
        token.transfer(msg.sender, amount);
    }
}
