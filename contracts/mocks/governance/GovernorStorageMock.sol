// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {IGovernor, Governor} from "../../governance/Governor.sol";
import {GovernorTimelockControl} from "../../governance/extensions/GovernorTimelockControl.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorStorage} from "../../governance/extensions/GovernorStorage.sol";

abstract contract GovernorStorageMock is
    GovernorSettings,
    GovernorTimelockControl,
    GovernorVotesQuorumFraction,
    GovernorCountingSimple,
    GovernorStorage
{
    function quorum(
        uint256 blockNumber
    ) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _propose(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        address proposer
    ) internal virtual override(Governor, GovernorStorage) {
        super._propose(proposalId, targets, values, calldatas, description, proposer);
    }

    function _queueCalls(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (bool, uint48) {
        return super._queueCalls(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeCalls(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeCalls(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        return super._cancel(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}
