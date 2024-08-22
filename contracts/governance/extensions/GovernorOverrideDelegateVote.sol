// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {GovernorVotes} from "./GovernorVotes.sol";
import {IVotes} from "../utils/IVotes.sol";
import {IERC5805} from "../../interfaces/IERC5805.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {Time} from "../../utils/types/Time.sol";
import {VotesOverridable} from "../utils/VotesOverridable.sol";

/**
 * @dev Extension of {Governor} which enables delegatees to override the vote of their delegates. This module requires a
 * token token that inherits `VotesOverridable`.
 */
abstract contract GovernorOverrideDelegateVote is GovernorVotes {
    /**
     * @dev Supported vote types. Matches Governor Bravo ordering.
     */
    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct VoteReceipt {
        uint8 support;
        bool hasOverriden;
        uint208 overrideWeight;
    }

    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address voter => VoteReceipt) voteReceipt;
    }

    error GovernorAlreadyCastVoteOverride(address account);

    mapping(uint256 proposalId => ProposalVote) private _proposalVotes;

    constructor(VotesOverridable tokenAddress) GovernorVotes(tokenAddress) {}

    /**
     * @dev See {IGovernor-COUNTING_MODE}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {
        return "support=bravo,override&quorum=for,abstain&params=override";
    }

    /**
     * @dev See {IGovernor-hasVoted}.
     */
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _proposalVotes[proposalId].voteReceipt[account].support != 0;
    }

    /**
     * @dev Check if an `account` has overridden their delegate for a proposal.
     */
    function hasVotedOverride(uint256 proposalId, address account) public view virtual returns (bool) {
        return _proposalVotes[proposalId].voteReceipt[account].hasOverriden;
    }

    /**
     * @dev Accessor to the internal vote counts.
     */
    function proposalVotes(
        uint256 proposalId
    ) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        return (proposalVote.againstVotes, proposalVote.forVotes, proposalVote.abstainVotes);
    }

    /**
     * @dev See {Governor-_quorumReached}.
     */
    function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        return quorum(proposalSnapshot(proposalId)) <= proposalVote.forVotes + proposalVote.abstainVotes;
    }

    /**
     * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be strictly over the againstVotes.
     */
    function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        return proposalVote.forVotes > proposalVote.againstVotes;
    }

    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 totalWeight,
        bytes memory params
    ) internal virtual override returns (uint256) {
        if (keccak256(params) == keccak256(hex"23b70c8d0000000000000000000000000000000000000000")) {
            return _countVotesOverride(proposalId, account, support, params);
        }

        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        totalWeight -= proposalVote.voteReceipt[account].overrideWeight;

        if (proposalVote.voteReceipt[account].support != 0) {
            revert GovernorAlreadyCastVote(account);
        }
        // Support tracks support and if a user voted. Store support + 1.
        proposalVote.voteReceipt[account].support = support + 1;

        _tallyVote(proposalVote, support, _add, totalWeight);

        return totalWeight;
    }

    function _countVotesOverride(
        uint256 proposalId,
        address account,
        uint8 support,
        bytes memory params
    ) private returns (uint256) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        uint256 proposalSnapshot = proposalSnapshot(proposalId);
        address delegate = VotesOverridable(address(token())).getPastDelegate(account, proposalSnapshot);

        if (proposalVote.voteReceipt[account].hasOverriden) {
            revert GovernorAlreadyCastVoteOverride(account);
        }
        proposalVote.voteReceipt[account].hasOverriden = true;

        uint256 overrideWeight = VotesOverridable(address(token())).getPastBalanceOf(account, proposalSnapshot);
        _tallyVote(proposalVote, support, _add, overrideWeight);

        // Account for the delegate's vote
        VoteReceipt memory delegateVoteReceipt = proposalVote.voteReceipt[delegate];
        if (delegateVoteReceipt.support != 0) {
            uint8 correctedSupport = delegateVoteReceipt.support - 1;
            // If delegate has voted, remove the delegatee's vote weight from their support
            _tallyVote(proposalVote, correctedSupport, _subtract, overrideWeight);

            // Write delegate into the params for event
            assembly {
                mstore(add(params, 0x20), or(mload(add(params, 0x20)), shl(64, delegate)))
            }
        } else {
            // Only write override weight if they have not voted yet
            proposalVote.voteReceipt[delegate].overrideWeight += uint208(overrideWeight);
        }
        return overrideWeight;
    }

    function _tallyVote(
        ProposalVote storage proposalVote,
        uint8 support,
        function(uint256, uint256) view returns (uint256) op,
        uint256 delta
    ) private {
        if (support == uint8(VoteType.Against)) {
            proposalVote.againstVotes = op(proposalVote.againstVotes, delta);
        } else if (support == uint8(VoteType.For)) {
            proposalVote.forVotes = op(proposalVote.forVotes, delta);
        } else if (support == uint8(VoteType.Abstain)) {
            proposalVote.abstainVotes = op(proposalVote.abstainVotes, delta);
        } else {
            revert GovernorInvalidVoteType();
        }
    }

    function _add(uint256 a, uint256 b) private pure returns (uint256) {
        return a + b;
    }

    function _subtract(uint256 a, uint256 b) private pure returns (uint256) {
        return a - b;
    }
}
