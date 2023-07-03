// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {IGovernor, Governor} from "../../governance/Governor.sol";
import {GovernorTimelockCompound} from "../../governance/extensions/GovernorTimelockCompound.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";

abstract contract GovernorTimelockCompoundMock is
    GovernorSettings,
    GovernorTimelockCompound,
    GovernorVotesQuorumFraction,
    GovernorCountingSimple
{
    function quorum(
        uint256 blockNumber
    ) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function state(
        uint256 proposalId
    ) public view override(Governor, GovernorTimelockCompound) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _queueCalls(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) returns (bool, uint48) {
        return super._queueCalls(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeCalls(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) {
        super._executeCalls(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) {
        return super._cancel(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockCompound) returns (address) {
        return super._executor();
    }
}
