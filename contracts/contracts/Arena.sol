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
        distributionAmount = ISuperToken(_superToken.getUnderlyingToken()).balanceOf(address(this));
        // TODO: Distribute only 90% of everyone's balances leaving 10% after every distribute round
        return distributionAmount;
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

    /// @notice Send a lump sum of super tokens into the contract.
    /// @dev This requires a super token ERC20 approval.
    /// @param token Super Token to transfer.
    /// @param amount Amount to transfer.
    function sendLumpSumToContract(ISuperToken token, uint256 amount) external {
        if (!accountList[msg.sender] && msg.sender != owner) revert Unauthorized();

        token.transferFrom(msg.sender, address(this), amount);
    }

    /// @notice Create a stream into the contract.
    /// @dev This requires the contract to be a flowOperator for the msg sender.
    /// @param token Token to stream.
    /// @param flowRate Flow rate per second to stream.
    function createFlowIntoContract(ISuperToken token, int96 flowRate) external {
        if (!accountList[msg.sender] && msg.sender != owner) revert Unauthorized();

        token.createFlowFrom(msg.sender, address(this), flowRate);
    }

    /// @notice Update an existing stream being sent into the contract by msg sender.
    /// @dev This requires the contract to be a flowOperator for the msg sender.
    /// @param token Token to stream.
    /// @param flowRate Flow rate per second to stream.
    function updateFlowIntoContract(ISuperToken token, int96 flowRate) external {
        if (!accountList[msg.sender] && msg.sender != owner) revert Unauthorized();

        token.updateFlowFrom(msg.sender, address(this), flowRate);
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
