// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";
import {GovernorCountingSimple} from "./GovernorCountingSimple.sol";
import {Math} from "../../utils/math/Math.sol";

/**
 * @notice Extension of {Governor} for 3 option fractional vote counting. When voting, a delegate may split their vote
 * weight between Against/For/Abstain. This is most useful when the delegate is itself a contract, implementing its
 * own rules for voting. By allowing a contract-delegate to split its vote weight, the voting preferences of many
 * disparate token holders can be rolled up into a single vote to the Governor itself. Some example use cases include
 * voting with tokens that are held by a DeFi pool, voting from L2 with tokens held by a bridge, or voting privately
 * from a shielded pool using zero knowledge proofs.
 *
 * Based on ScopeLift's https://github.com/ScopeLift/flexible-voting/blob/master/src/GovernorCountingFractional.sol
 */
abstract contract GovernorCountingFractional is Governor {
    using Math for *;

    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address voter => uint256) usedVotes;
    }

    /**
     * @dev Mapping from proposal ID to vote tallies for that proposal.
     */
    mapping(uint256 => ProposalVote) private _proposalVotes;

    error GovernorInvalidParamsFormat(address voter);
    error GovernorUsedVotesExceedRemainingWeight(address voter, uint256 usedVotes, uint256 remainingWeight);

    /**
     * @dev See {IGovernor-COUNTING_MODE}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {
        return "support=bravo&quorum=for,abstain&params=fractional";
    }

    /**
     * @dev See {IGovernor-hasVoted}.
     */
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return voteWeightCast(proposalId, account) > 0;
    }

    /**
     * @dev Get the number of votes cast thus far on proposal `proposalId` by account `account`. Useful for
     * integrations that allow delegates to cast rolling, partial votes.
     */
    function voteWeightCast(uint256 proposalId, address account) public view virtual returns (uint256) {
        return _proposalVotes[proposalId].usedVotes[account];
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
     * @dev See {Governor-_voteSucceeded}. In this module, forVotes must be > againstVotes.
     */
    function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        return proposalVote.forVotes > proposalVote.againstVotes;
    }

    /**
     * @notice See {Governor-_countVote}.
     *
     * @dev Function that records the delegate's votes.
     *
     * If the `params` bytes parameter is empty, then this module behaves identically to {GovernorCountingSimple}.
     * That is, it assigns the remaining weight of the delegate to the `support` parameter, which follows the
     * `VoteType` enum from Governor Bravo (as defined in {GovernorCountingSimple}).
     *
     * If the `params` bytes parameter is not zero, then it _must_ be tree packed uint128s, totaling 48 bytes,
     * representing the weight the delegate assigns to Against, For, and Abstain respectively. This format can be
     * produced using:
     *
     * `abi.encodePacked(uint128(againstVotes), uint128(forVotes), uint128(abstainVotes))`
     *
     * The sum total of the three decoded vote weights _must_ be less than or equal to the delegate's remaining weight
     * on the proposal, i.e. their checkpointed total weight minus votes already cast on the proposal.
     *
     * See `_countVoteNominal` and `_countVoteFractional` for more details.
     */
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 totalWeight,
        bytes memory params
    ) internal virtual override returns (uint256) {
        // Compute number of remaining votes. Returns 0 on overflow.
        (, uint256 remainingWeight) = totalWeight.trySub(voteWeightCast(proposalId, account));
        if (remainingWeight == 0) {
            revert GovernorAlreadyCastVote(account);
        }

        if (params.length == 0) {
            return _countVoteNominal(proposalId, account, support, remainingWeight);
        } else if (params.length == 0x30) {
            return _countVoteFractional(proposalId, account, params, remainingWeight);
        } else {
            revert GovernorInvalidParamsFormat(account);
        }
    }

    /**
     * @dev Record votes with full weight cast for `support`.
     *
     * Because this function votes with the delegate's remaining weight, it can only be called once per proposal and
     * thus does not require any replay protection.
     */
    function _countVoteNominal(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) private returns (uint256) {
        ProposalVote storage details = _proposalVotes[proposalId];
        details.usedVotes[account] += weight;

        if (support == uint8(GovernorCountingSimple.VoteType.Against)) {
            details.againstVotes += weight;
        } else if (support == uint8(GovernorCountingSimple.VoteType.For)) {
            details.forVotes += weight;
        } else if (support == uint8(GovernorCountingSimple.VoteType.Abstain)) {
            details.abstainVotes += weight;
        } else {
            revert GovernorInvalidVoteType();
        }

        return weight;
    }

    /**
     * @dev Count votes with fractional weight.
     *
     * `params` is expected to be tree packed uint128s:
     * `abi.encodePacked(uint128(againstVotes), uint128(forVotes), uint128(abstainVotes))`
     *
     * This function can be called multiple times for the same account and proposal, i.e. partial/rolling votes are
     * allowed. For example, an account with total weight of 10 could call this function three times with the
     * following vote data:
     *   - against: 1, for: 0, abstain: 2
     *   - against: 3, for: 1, abstain: 0
     *   - against: 1, for: 1, abstain: 1
     * The result of these three calls would be that the account casts 5 votes AGAINST, 2 votes FOR, and 3 votes
     * ABSTAIN on the proposal. Though partial, votes are still final once cast and cannot be changed or overridden.
     * Subsequent partial votes simply increment existing totals.
     */
    function _countVoteFractional(
        uint256 proposalId,
        address account,
        bytes memory params,
        uint256 weight
    ) private returns (uint256) {
        uint128 againstVotes = _extractUint128(params, 0);
        uint128 forVotes = _extractUint128(params, 1);
        uint128 abstainVotes = _extractUint128(params, 2);

        uint256 usedWeight = againstVotes + forVotes + abstainVotes;
        if (usedWeight > weight) {
            revert GovernorUsedVotesExceedRemainingWeight(account, usedWeight, weight);
        }

        ProposalVote storage details = _proposalVotes[proposalId];
        details.againstVotes += againstVotes;
        details.forVotes += forVotes;
        details.abstainVotes += abstainVotes;
        details.usedVotes[account] += usedWeight;

        return usedWeight;
    }

    function _extractUint128(bytes memory data, uint256 pos) private pure returns (uint128 result) {
        assembly {
            result := shr(128, mload(add(data, add(0x20, mul(0x10, pos)))))
        }
    }
}
