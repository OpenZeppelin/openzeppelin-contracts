// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {VotesOverridable} from "../utils/VotesOverridable.sol";
import {GovernorVotes} from "./GovernorVotes.sol";

/**
 * @dev Extension of {Governor} which enables delegatees to override the vote of their delegates. This module requires a
 * token token that inherits `VotesOverridable`.
 */
abstract contract GovernorOverrideDelegateVote is GovernorVotes {
    bytes32 public constant OVERRIDE_TYPEHASH =
        keccak256("Override(uint256 proposalId,uint8 support,address voter,uint256 nonce)");

    /**
     * @dev Supported vote types. Matches Governor Bravo ordering.
     */
    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct VoteReceipt {
        uint8 casted; // 0 if vote was not casted. Otherwise: support + 1
        bool hasOverriden;
        uint208 overridenWeight;
    }

    struct ProposalVote {
        uint256[3] votes;
        mapping(address voter => VoteReceipt) voteReceipt;
    }

    error GovernorAlreadyCastVoteOverride(address account);

    mapping(uint256 proposalId => ProposalVote) private _proposalVotes;

    /**
     * @dev See {IGovernor-COUNTING_MODE}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {
        return "support=bravo,override&quorum=for,abstain&overridable=true";
    }

    /**
     * @dev See {IGovernor-hasVoted}.
     */
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _proposalVotes[proposalId].voteReceipt[account].casted != 0;
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
        uint256[3] storage votes = _proposalVotes[proposalId].votes;
        return (votes[uint8(VoteType.Against)], votes[uint8(VoteType.For)], votes[uint8(VoteType.Abstain)]);
    }

    /**
     * @dev See {Governor-_quorumReached}.
     */
    function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
        uint256[3] storage votes = _proposalVotes[proposalId].votes;
        return quorum(proposalSnapshot(proposalId)) <= votes[uint8(VoteType.For)] + votes[uint8(VoteType.Abstain)];
    }

    /**
     * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be strictly over the againstVotes.
     */
    function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
        uint256[3] storage votes = _proposalVotes[proposalId].votes;
        return votes[uint8(VoteType.For)] > votes[uint8(VoteType.Against)];
    }

    /**
     * @dev See {Governor-_countVote}. In this module, the support follows the `VoteType` enum (from Governor Bravo).
     *
     * NOTE: called by {Governor-_castVote} which emits the {IGovernor-VoteCast} (or {IGovernor-VoteCastWithParams})
     * event.
     */
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 totalWeight,
        bytes memory /*params*/
    ) internal virtual override returns (uint256) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        if (support > uint8(VoteType.Abstain)) {
            revert GovernorInvalidVoteType();
        }

        if (proposalVote.voteReceipt[account].casted == 0) {
            revert GovernorAlreadyCastVote(account);
        }

        totalWeight -= proposalVote.voteReceipt[account].overridenWeight;
        proposalVote.votes[support] += totalWeight;
        proposalVote.voteReceipt[account].casted = support + 1;

        return totalWeight;
    }

    function _overrideVote(uint256 proposalId, address account, uint8 support) internal virtual returns (uint256) {
        if (support > uint8(VoteType.Abstain)) {
            revert GovernorInvalidVoteType();
        }

        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        if (proposalVote.voteReceipt[account].hasOverriden) {
            revert GovernorAlreadyCastVoteOverride(account);
        }

        uint256 proposalSnapshot = proposalSnapshot(proposalId);
        uint256 overridenWeight = VotesOverridable(address(token())).getPastBalanceOf(account, proposalSnapshot);
        address delegate = VotesOverridable(address(token())).getPastDelegate(account, proposalSnapshot);
        uint8 delegateCasted = proposalVote.voteReceipt[delegate].casted;

        proposalVote.voteReceipt[account].hasOverriden = true;
        proposalVote.votes[support] += overridenWeight;
        if (delegateCasted == 0) {
            proposalVote.voteReceipt[delegate].overridenWeight += SafeCast.toUint208(overridenWeight);
            // TODO: emit event VoteCast ?
        } else {
            proposalVote.votes[delegateCasted - 1] -= overridenWeight;
            // TODO: emit event VoteCastOverride ?
        }

        return overridenWeight;
    }

    function overrideVote(uint256 proposalId, uint8 support) public virtual returns (uint256) {
        _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Active));

        address voter = _msgSender();
        return _overrideVote(proposalId, voter, support);
    }

    function overrideVoteBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        bytes memory signature
    ) public virtual returns (uint256) {
        _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Active));

        if (
            !SignatureChecker.isValidSignatureNow(
                voter,
                _hashTypedDataV4(
                    keccak256(abi.encode(OVERRIDE_TYPEHASH, proposalId, support, voter, _useNonce(voter)))
                ),
                signature
            )
        ) {
            revert GovernorInvalidSignature(voter);
        }

        return _overrideVote(proposalId, voter, support);
    }
}
