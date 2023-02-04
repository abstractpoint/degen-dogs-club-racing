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

    struct PlayerUnitsUpdate {
        address player;
        uint128 units;
    }

contract Arena is StreamInDistributeOut {
    // ---------------------------------------------------------------------------------------------
    // STATE VARIABLES

    /// @notice Owner.
    address public owner;

    /// @notice CFA Library.
    using SuperTokenV1Library for ISuperToken;

    /// @notice Allow list.
    mapping(address => bool) public accountList;

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        IInstantDistributionAgreementV1 ida,
        ISuperToken superToken,
        address _owner
    ) StreamInDistributeOut(host, cfa, ida, superToken) {
        owner = _owner;
    }

    // ---------------------------------------------------------------------------------------------
    // BEFORE DISTRIBUTION CALLBACK

    /// @dev Before action callback. This can do calculation on a `superToken`, then returns the
    /// amount to distribute out in the `executeAction` function.
    /// @return distributionAmount amount to distribute after the callback.
    function _beforeDistribution() internal override returns (uint256 distributionAmount) {

        // Get the full balance of the underlying `_superToken` in the contract.
        distributionAmount = _superToken.balanceOf(address(this));
        // TODO: Distribute only 90% of everyone's balances leaving 10% after every distribute round
    }

    // ---------------------------------------------------------------------------------------------
    // Protected Execute Distribution function

    function executeDistribution() external {
        if (!accountList[msg.sender] && msg.sender != owner) revert Unauthorized();

        executeAction();
    }

    function updatePlayerUnits(PlayerUnitsUpdate[] memory updates) external {
        if (!accountList[msg.sender] && msg.sender != owner) revert Unauthorized();

        for(uint i = 0; i < updates.length; i++){
            updateSubscriptionUnits(updates[i].player, updates[i].units);
        }
    }

    /// @notice Add account to allow list.
    /// @param _account Account to allow.
    function allowAccount(address _account) external {
        if (msg.sender != owner) revert Unauthorized();

        accountList[_account] = true;
    }

    /// @notice Removes account from allow list.
    /// @param _account Account to disallow.
    function removeAccount(address _account) external {
        if (msg.sender != owner) revert Unauthorized();

        accountList[_account] = false;
    }

    /// @notice Transfer ownership.
    /// @param _newOwner New owner account.
    function changeOwner(address _newOwner) external {
        if (msg.sender != owner) revert Unauthorized();

        owner = _newOwner;
    }


    /// @notice Delete a stream that the msg.sender has open into the contract.
    /// @param token Token to quit streaming.
    function deleteFlowIntoContract(ISuperToken token) external {
        if (!accountList[msg.sender] && msg.sender != owner) revert Unauthorized();

        token.deleteFlow(msg.sender, address(this));
    }

    /// @notice Withdraw funds from the contract.
    /// @param token Token to withdraw.
    /// @param amount Amount to withdraw.
    function withdrawFunds(ISuperToken token, uint256 amount) external {
        if (!accountList[msg.sender] && msg.sender != owner) revert Unauthorized();

        token.transfer(msg.sender, amount);
    }
}
