// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../../governance/Governor.sol";
import {GovernorPreventLateQuorum} from "../../governance/extensions/GovernorPreventLateQuorum.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "../../governance/extensions/GovernorVotes.sol";

abstract contract GovernorPreventLateQuorumMock is
    GovernorSettings,
    GovernorVotes,
    GovernorCountingSimple,
    GovernorPreventLateQuorum
{
    uint256 private _quorum;

    constructor(uint256 quorum_) {
        _quorum = quorum_;
    }

    function quorum(uint256) public view override returns (uint256) {
        return _quorum;
    }

    function proposalDeadline(
        uint256 proposalId
    ) public view override(Governor, GovernorPreventLateQuorum) returns (uint256) {
        return super.proposalDeadline(proposalId);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal override(Governor, GovernorPreventLateQuorum) returns (uint256) {
        return super._castVote(proposalId, account, support, reason, params);
    }
}
