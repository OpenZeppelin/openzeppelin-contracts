// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/extensions/GovernorCountingOverridable.sol)

pragma solidity ^0.8.24;

import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {VotesExtended} from "../utils/VotesExtended.sol";
import {GovernorVotes} from "./GovernorVotes.sol";
import {IGovernor, Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} which enables delegators to override the vote of their delegates. This module requires a
 * token that inherits {VotesExtended}.
 */
abstract contract GovernorCountingOverridable is GovernorVotes {
    bytes32 public constant OVERRIDE_BALLOT_TYPEHASH =
        keccak256("OverrideBallot(uint256 proposalId,uint8 support,address voter,uint256 nonce,string reason)");

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
        bool hasOverridden;
        uint208 overriddenWeight;
    }

    struct ProposalVote {
        uint256[3] votes;
        mapping(address voter => VoteReceipt) voteReceipt;
    }

    /// @dev The votes casted by `delegate` were reduced by `weight` after an override vote was casted by the original token holder
    event VoteReduced(address indexed delegate, uint256 proposalId, uint8 support, uint256 weight);

    /// @dev A delegated vote on `proposalId` was overridden by `weight`
    event OverrideVoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason);

    error GovernorAlreadyOverriddenVote(address account);

    mapping(uint256 proposalId => ProposalVote) private _proposalVotes;

    /// @inheritdoc IGovernor
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {
        return "support=bravo,override&quorum=for,abstain&overridable=true";
    }

    /**
     * @dev See {IGovernor-hasVoted}.
     *
     * NOTE: Calling {castVote} (or similar) casts a vote using the voting power that is delegated to the voter.
     * Conversely, calling {castOverrideVote} (or similar) uses the voting power of the account itself, from its asset
     * balances. Casting an "override vote" does not count as voting and won't be reflected by this getter. Consider
     * using {hasVotedOverride} to check if an account has casted an "override vote" for a given proposal id.
     */
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _proposalVotes[proposalId].voteReceipt[account].casted != 0;
    }

    /**
     * @dev Check if an `account` has overridden their delegate for a proposal.
     */
    function hasVotedOverride(uint256 proposalId, address account) public view virtual returns (bool) {
        return _proposalVotes[proposalId].voteReceipt[account].hasOverridden;
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

    /// @inheritdoc Governor
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

        if (proposalVote.voteReceipt[account].casted != 0) {
            revert GovernorAlreadyCastVote(account);
        }

        totalWeight -= proposalVote.voteReceipt[account].overriddenWeight;
        proposalVote.votes[support] += totalWeight;
        proposalVote.voteReceipt[account].casted = support + 1;

        return totalWeight;
    }

    /**
     * @dev Variant of {Governor-_countVote} that deals with vote overrides.
     *
     * NOTE: See {hasVoted} for more details about the difference between {castVote} and {castOverrideVote}.
     */
    function _countOverride(uint256 proposalId, address account, uint8 support) internal virtual returns (uint256) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        if (support > uint8(VoteType.Abstain)) {
            revert GovernorInvalidVoteType();
        }

        if (proposalVote.voteReceipt[account].hasOverridden) {
            revert GovernorAlreadyOverriddenVote(account);
        }

        uint256 snapshot = proposalSnapshot(proposalId);
        uint256 overriddenWeight = VotesExtended(address(token())).getPastBalanceOf(account, snapshot);
        address delegate = VotesExtended(address(token())).getPastDelegate(account, snapshot);
        uint8 delegateCasted = proposalVote.voteReceipt[delegate].casted;

        proposalVote.voteReceipt[account].hasOverridden = true;
        proposalVote.votes[support] += overriddenWeight;
        if (delegateCasted == 0) {
            proposalVote.voteReceipt[delegate].overriddenWeight += SafeCast.toUint208(overriddenWeight);
        } else {
            uint8 delegateSupport = delegateCasted - 1;
            proposalVote.votes[delegateSupport] -= overriddenWeight;
            emit VoteReduced(delegate, proposalId, delegateSupport, overriddenWeight);
        }

        return overriddenWeight;
    }

    /// @dev Variant of {Governor-_castVote} that deals with vote overrides. Returns the overridden weight.
    function _castOverride(
        uint256 proposalId,
        address account,
        uint8 support,
        string calldata reason
    ) internal virtual returns (uint256) {
        _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Active));

        uint256 overriddenWeight = _countOverride(proposalId, account, support);

        emit OverrideVoteCast(account, proposalId, support, overriddenWeight, reason);

        _tallyUpdated(proposalId);

        return overriddenWeight;
    }

    /// @dev Public function for casting an override vote. Returns the overridden weight.
    function castOverrideVote(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public virtual returns (uint256) {
        address voter = _msgSender();
        return _castOverride(proposalId, voter, support, reason);
    }

    /// @dev Public function for casting an override vote using a voter's signature. Returns the overridden weight.
    function castOverrideVoteBySig(
        uint256 proposalId,
        uint8 support,
        address voter,
        string calldata reason,
        bytes calldata signature
    ) public virtual returns (uint256) {
        bool valid = SignatureChecker.isValidSignatureNow(
            voter,
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        OVERRIDE_BALLOT_TYPEHASH,
                        proposalId,
                        support,
                        voter,
                        _useNonce(voter),
                        keccak256(bytes(reason))
                    )
                )
            ),
            signature
        );

        if (!valid) {
            revert GovernorInvalidSignature(voter);
        }

        return _castOverride(proposalId, voter, support, reason);
    }
}
