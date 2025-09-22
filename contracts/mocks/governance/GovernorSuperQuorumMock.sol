// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Governor} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorVotes} from "../../governance/extensions/GovernorVotes.sol";
import {GovernorSuperQuorum} from "../../governance/extensions/GovernorSuperQuorum.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorTimelockControl} from "../../governance/extensions/GovernorTimelockControl.sol";

abstract contract GovernorSuperQuorumMock is
    GovernorSettings,
    GovernorVotes,
    GovernorTimelockControl,
    GovernorSuperQuorum,
    GovernorCountingSimple
{
    uint256 private _quorum;
    uint256 private _superQuorum;

    constructor(uint256 quorum_, uint256 superQuorum_) {
        _quorum = quorum_;
        _superQuorum = superQuorum_;
    }

    function quorum(uint256) public view override returns (uint256) {
        return _quorum;
    }

    function superQuorum(uint256) public view override returns (uint256) {
        return _superQuorum;
    }

    function state(
        uint256 proposalId
    ) public view override(Governor, GovernorSuperQuorum, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function proposalVotes(
        uint256 proposalId
    )
        public
        view
        virtual
        override(GovernorCountingSimple, GovernorSuperQuorum)
        returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
    {
        return super.proposalVotes(proposalId);
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
