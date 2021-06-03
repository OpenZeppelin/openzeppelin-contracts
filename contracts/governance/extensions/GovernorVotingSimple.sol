// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IGovernor.sol";

/**
 * @dev Extension of {Governor} for simple, 3 options, voting.
 *
 * _Available since v4.2._
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

    struct Receipt {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping (address => bool) hasVoted;
    }

    mapping (uint256 => Receipt) private _receipts;

    /**
     * @dev See {IGovernor-hasVoted}.
     */
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _receipts[proposalId].hasVoted[account];
    }

    /**
     * @dev Accessor to the internal vote counts.
     */
    function proposalVotes(uint256 proposalId) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
        Receipt storage receipt = _receipts[proposalId];
        return (receipt.againstVotes, receipt.forVotes, receipt.abstainVotes);
    }

    /**
    * @dev See {IGovernor-proposalWeight}.
    */
    function _quorumReached(uint256 proposalId) public view virtual override returns (bool) {
        Receipt storage receipt = _receipts[proposalId];

        return quorum(proposalSnapshot(proposalId)) < receipt.againstVotes + receipt.forVotes + receipt.abstainVotes;
    }

    /**
     * @dev See {IGovernor-_voteSuccess}. In this module, the forVotes mush be scritly over the againstVotes.
     */
    function _voteSuccess(uint256 proposalId) internal view virtual override returns (bool) {
        return _receipts[proposalId].forVotes > _receipts[proposalId].againstVotes;
    }

    /**
     * @dev See {IGovernor-_pushVote}. In this module, the support follows the `VoteType` enum (from Governor Bravo).
     */
    function _pushVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual override {
        Receipt storage receipt = _receipts[proposalId];

        require(!receipt.hasVoted[account], "SimpleVoting: vote already casted");
        receipt.hasVoted[account] = true;

        if (support == uint8(VoteType.Against)) {
            receipt.againstVotes += weight;
        } else if (support == uint8(VoteType.For)) {
            receipt.forVotes += weight;
        } else if (support == uint8(VoteType.Abstain)) {
            receipt.abstainVotes += weight;
        } else {
            revert("SimpleVoting: invalid value for enum VoteType");
        }
    }
}
