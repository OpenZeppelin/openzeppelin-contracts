// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../../governance/Governor.sol";
import {GovernorVotes} from "../../governance/extensions/GovernorVotes.sol";
import {GovernorSuperQuorum} from "../../governance/extensions/GovernorSuperQuorum.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorTimelockControl} from "../../governance/extensions/GovernorTimelockControl.sol";

abstract contract GovernorSuperQuorumMock is
    GovernorVotes,
    GovernorTimelockControl,
    GovernorSuperQuorum,
    GovernorCountingSimple
{
    function state(
        uint256 proposalId
    ) public view override(Governor, GovernorSuperQuorum, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function superQuorum(uint256) public pure override(GovernorSuperQuorum) returns (uint256) {
        return 40;
    }

    function quorum(uint256) public pure override(Governor) returns (uint256) {
        return 10;
    }

    function votingDelay() public pure override returns (uint256) {
        return 4;
    }

    function votingPeriod() public pure override returns (uint256) {
        return 16;
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function proposalNeedsQueuing(
        uint256 proposalId
    ) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }
}
