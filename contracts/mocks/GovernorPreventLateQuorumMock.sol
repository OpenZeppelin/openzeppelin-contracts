// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorPreventLateQuorum.sol";
import "../governance/extensions/GovernorSettings.sol";
import "../governance/extensions/GovernorCountingSimple.sol";
import "../governance/extensions/GovernorVotes.sol";

contract GovernorPreventLateQuorumMock is
    GovernorSettings,
    GovernorVotes,
    GovernorCountingSimple,
    GovernorPreventLateQuorum
{
    uint256 private _quorum;

    constructor(
        string memory name_,
        IVotes token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 quorum_,
        uint64 voteExtension_
    )
        Governor(name_)
        GovernorSettings(votingDelay_, votingPeriod_, 0)
        GovernorVotes(token_)
        GovernorPreventLateQuorum(voteExtension_)
    {
        _quorum = quorum_;
    }

    function quorum(uint256) public view override returns (uint256) {
        return _quorum;
    }

    function proposalDeadline(uint256 proposalId)
        public
        view
        override(Governor, GovernorPreventLateQuorum)
        returns (uint256)
    {
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
