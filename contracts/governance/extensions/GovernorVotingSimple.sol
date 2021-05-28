// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IGovernor.sol";

abstract contract GovernorVotingSimple is IGovernor {
    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Voting {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
    }

    mapping (uint256 => Voting) private _votings;

    function proposalWeight(uint256 proposalId) public view virtual override returns (uint256) {
        return _votings[proposalId].againstVotes
            + _votings[proposalId].forVotes
            + _votings[proposalId].abstainVotes;
    }

    function _voteSuccess(uint256 proposalId) internal view virtual override returns (bool) {
        return _votings[proposalId].forVotes > _votings[proposalId].againstVotes;
    }

    function _pushVote(uint256 proposalId, uint8 support, uint256 weight) internal virtual override {
        if (support == uint8(VoteType.Against)) {
            _votings[proposalId].againstVotes += weight;
        } else if (support == uint8(VoteType.For)) {
            _votings[proposalId].forVotes += weight;
        } else if (support == uint8(VoteType.Abstain)) {
            _votings[proposalId].abstainVotes += weight;
        } else {
            revert("SimpleVoting: invalid value for enum VoteType");
        }
    }
}
