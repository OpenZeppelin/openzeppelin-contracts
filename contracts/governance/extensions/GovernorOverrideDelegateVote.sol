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
        bool hasVoted;
        uint8 support;
    }

    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address voter => VoteReceipt) voteReceipt;
        mapping(address voter => VoteReceipt) overrideVoteReceipt;
    }

    error GovernorAlreadyCastVoteOverride(address account);

    mapping(uint256 proposalId => ProposalVote) private _proposalVotes;
    mapping(address account => mapping(uint256 proposalId => uint256 votes)) private _overrideVoteWeight;

    constructor(VotesOverridable tokenAddress) GovernorVotes(tokenAddress) {}

    /**
     * @dev Fetch the past delegate for an `account` at a given `timepoint` from the token.
     */
    function _getPastDelegate(address account, uint256 timepoint) internal view virtual returns (address) {
        return VotesOverridable(address(token())).getPastDelegate(account, timepoint);
    }

    /**
     * @dev Fetch the past `balanceOf` for an `account` at a given `timepoint` from the token.
     */
    function _getPastBalanceOf(address account, uint256 timepoint) internal view virtual returns (uint256) {
        return VotesOverridable(address(token())).getPastBalanceOf(account, timepoint);
    }

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
        return _proposalVotes[proposalId].voteReceipt[account].hasVoted;
    }

    /**
     * @dev Check if an `account` has overridden their delegate for a proposal.
     */
    function hasVotedOverride(uint256 proposalId, address account) public view virtual returns (bool) {
        return _proposalVotes[proposalId].overrideVoteReceipt[account].hasVoted;
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

        totalWeight -= _overrideVoteWeight[account][proposalId];

        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        if (proposalVote.voteReceipt[account].hasVoted) {
            revert GovernorAlreadyCastVote(account);
        }
        proposalVote.voteReceipt[account] = VoteReceipt({hasVoted: true, support: support});

        if (support == uint8(VoteType.Against)) {
            proposalVote.againstVotes += totalWeight;
        } else if (support == uint8(VoteType.For)) {
            proposalVote.forVotes += totalWeight;
        } else if (support == uint8(VoteType.Abstain)) {
            proposalVote.abstainVotes += totalWeight;
        } else {
            revert GovernorInvalidVoteType();
        }

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
        address delegate = _getPastDelegate(account, proposalSnapshot);

        if (proposalVote.overrideVoteReceipt[account].hasVoted) {
            revert GovernorAlreadyCastVoteOverride(account);
        }

        uint256 overrideWeight = _getPastBalanceOf(account, proposalSnapshot);

        proposalVote.overrideVoteReceipt[account] = VoteReceipt({hasVoted: true, support: support});
        if (support == uint8(VoteType.Against)) {
            proposalVote.againstVotes += overrideWeight;
        } else if (support == uint8(VoteType.For)) {
            proposalVote.forVotes += overrideWeight;
        } else if (support == uint8(VoteType.Abstain)) {
            proposalVote.abstainVotes += overrideWeight;
        } else {
            revert GovernorInvalidVoteType();
        }

        // Account for the delegate's vote
        VoteReceipt memory delegateVoteReceipt = proposalVote.voteReceipt[delegate];
        if (delegateVoteReceipt.hasVoted) {
            // If delegate has voted, remove the delegatee's vote weight from their support
            if (delegateVoteReceipt.support == uint8(VoteType.Against)) {
                proposalVote.againstVotes -= overrideWeight;
            } else if (delegateVoteReceipt.support == uint8(VoteType.For)) {
                proposalVote.forVotes -= overrideWeight;
            } else if (delegateVoteReceipt.support == uint8(VoteType.Abstain)) {
                proposalVote.abstainVotes -= overrideWeight;
            } else {
                revert GovernorInvalidVoteType();
            }

            // Write delegate into the params for event
            assembly {
                mstore(add(params, 0x20), or(mload(add(params, 0x20)), shl(64, delegate)))
            }
        } else {
            // Only write override weight if they have not voted yet
            _overrideVoteWeight[delegate][proposalId] += overrideWeight;
        }
        return overrideWeight;
    }
}
