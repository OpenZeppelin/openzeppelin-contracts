// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorVoteExtension.sol";
import "../governance/extensions/GovernorSettings.sol";
import "../governance/extensions/GovernorCountingSimple.sol";
import "../governance/extensions/GovernorVotes.sol";

contract GovernorVoteExtensionMock is GovernorSettings, GovernorVotes, GovernorCountingSimple, GovernorVoteExtension {
    uint256 private _quorum;

    constructor(
        string memory name_,
        ERC20Votes token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 quorum_,
        uint64 voteExtension_
    )
        Governor(name_)
        GovernorSettings(votingDelay_, votingPeriod_, 0)
        GovernorVotes(token_)
        GovernorVoteExtension(voteExtension_)
    {
        _quorum = quorum_;
    }

    function quorum(uint256) public view virtual override returns (uint256) {
        return _quorum;
    }

    function proposalDeadline(uint256 proposalId)
        public
        view
        virtual
        override(Governor, GovernorVoteExtension)
        returns (uint256)
    {
        return super.proposalDeadline(proposalId);
    }

    function proposalThreshold() public view virtual override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal virtual override(Governor, GovernorVoteExtension) returns (uint256) {
        return super._castVote(proposalId, account, support, reason);
    }
}
