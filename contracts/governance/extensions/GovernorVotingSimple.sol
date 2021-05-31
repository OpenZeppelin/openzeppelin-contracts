// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IGovernor.sol";

/**
 * @dev Extension of {Governor} for simple, 3 options, voting.
 */
abstract contract GovernorVotingSimple is IGovernor {
    /**
     * @dev Supported vote types. Matches Governor Bravo ordering.
     */
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

    /**
     * @dev Current weight (number of votes) expressed for a proposal. FOr a proposal to be successfull, this value
     * needs to be above the quorum threshold
     */
    function proposalWeight(uint256 proposalId) public view virtual override returns (uint256) {
        return _votings[proposalId].againstVotes
            + _votings[proposalId].forVotes
            + _votings[proposalId].abstainVotes;
    }

    /**
     * @dev Internal hook returning weither a vote is successfull. This is combined with the quorum check to determine
     * if a proposal is to be executed. In this version of voting, the forVotes mush be scritly over the againstVotes.
     */
    function _voteSuccess(uint256 proposalId) internal view virtual override returns (bool) {
        return _votings[proposalId].forVotes > _votings[proposalId].againstVotes;
    }

    /**
     * @dev Internal hook for storing votes.
     */
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
