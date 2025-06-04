// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (governance/extensions/GovernorCountingFractional.sol)

pragma solidity ^0.8.24;

import {IGovernor, Governor} from "../Governor.sol";
import {GovernorCountingSimple} from "./GovernorCountingSimple.sol";
import {Math} from "../../utils/math/Math.sol";

/**
 * @dev Extension of {Governor} for fractional voting.
 *
 * Similar to {GovernorCountingSimple}, this contract is a votes counting module for {Governor} that supports 3 options:
 * Against, For, Abstain. Additionally, it includes a fourth option: Fractional, which allows voters to split their voting
 * power amongst the other 3 options.
 *
 * Votes cast with the Fractional support must be accompanied by a `params` argument that is three packed `uint128` values
 * representing the weight the delegate assigns to Against, For, and Abstain respectively. For those votes cast for the other
 * 3 options, the `params` argument must be empty.
 *
 * This is mostly useful when the delegate is a contract that implements its own rules for voting. These delegate-contracts
 * can cast fractional votes according to the preferences of multiple entities delegating their voting power.
 *
 * Some example use cases include:
 *
 * * Voting from tokens that are held by a DeFi pool
 * * Voting from an L2 with tokens held by a bridge
 * * Voting privately from a shielded pool using zero knowledge proofs.
 *
 * Based on ScopeLift's https://github.com/ScopeLift/flexible-voting/blob/e5de2efd1368387b840931f19f3c184c85842761/src/GovernorCountingFractional.sol[`GovernorCountingFractional`]
 *
 * _Available since v5.1._
 */
abstract contract GovernorCountingFractional is Governor {
    using Math for *;

    uint8 internal constant VOTE_TYPE_FRACTIONAL = 255;

    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address voter => uint256) usedVotes;
    }

    /**
     * @dev Mapping from proposal ID to vote tallies for that proposal.
     */
    mapping(uint256 proposalId => ProposalVote) private _proposalVotes;

    /**
     * @dev A fractional vote params uses more votes than are available for that user.
     */
    error GovernorExceedRemainingWeight(address voter, uint256 usedVotes, uint256 remainingWeight);

    /// @inheritdoc IGovernor
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {
        return "support=bravo,fractional&quorum=for,abstain&params=fractional";
    }

    /// @inheritdoc IGovernor
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return usedVotes(proposalId, account) > 0;
    }

    /**
     * @dev Get the number of votes already cast by `account` for a proposal with `proposalId`. Useful for
     * integrations that allow delegates to cast rolling, partial votes.
     */
    function usedVotes(uint256 proposalId, address account) public view virtual returns (uint256) {
        return _proposalVotes[proposalId].usedVotes[account];
    }

    /**
     * @dev Get current distribution of votes for a given proposal.
     */
    function proposalVotes(
        uint256 proposalId
    ) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        return (proposalVote.againstVotes, proposalVote.forVotes, proposalVote.abstainVotes);
    }

    /// @inheritdoc Governor
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
     * @dev See {Governor-_countVote}. Function that records the delegate's votes.
     *
     * Executing this function consumes (part of) the delegate's weight on the proposal. This weight can be
     * distributed amongst the 3 options (Against, For, Abstain) by specifying a fractional `support`.
     *
     * This counting module supports two vote casting modes: nominal and fractional.
     *
     * - Nominal: A nominal vote is cast by setting `support` to one of the 3 bravo options (Against, For, Abstain).
     * - Fractional: A fractional vote is cast by setting `support` to `type(uint8).max` (255).
     *
     * Casting a nominal vote requires `params` to be empty and consumes the delegate's full remaining weight on the
     * proposal for the specified `support` option. This is similar to the {GovernorCountingSimple} module and follows
     * the `VoteType` enum from Governor Bravo. As a consequence, no vote weight remains unspent so no further voting
     * is possible (for this `proposalId` and this `account`).
     *
     * Casting a fractional vote consumes a fraction of the delegate's remaining weight on the proposal according to the
     * weights the delegate assigns to each support option (Against, For, Abstain respectively). The sum total of the
     * three decoded vote weights _must_ be less than or equal to the delegate's remaining weight on the proposal (i.e.
     * their checkpointed total weight minus votes already cast on the proposal). This format can be produced using:
     *
     * `abi.encodePacked(uint128(againstVotes), uint128(forVotes), uint128(abstainVotes))`
     *
     * NOTE: Consider that fractional voting restricts the number of casted votes (in each category) to 128 bits.
     * Depending on how many decimals the underlying token has, a single voter may require to split their vote into
     * multiple vote operations. For precision higher than ~30 decimals, large token holders may require a
     * potentially large number of calls to cast all their votes. The voter has the possibility to cast all the
     * remaining votes in a single operation using the traditional "bravo" vote.
     */
    // slither-disable-next-line cyclomatic-complexity
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 totalWeight,
        bytes memory params
    ) internal virtual override returns (uint256) {
        // Compute number of remaining votes. Returns 0 on overflow.
        (, uint256 remainingWeight) = totalWeight.trySub(usedVotes(proposalId, account));
        if (remainingWeight == 0) {
            revert GovernorAlreadyCastVote(account);
        }

        uint256 againstVotes = 0;
        uint256 forVotes = 0;
        uint256 abstainVotes = 0;
        uint256 usedWeight = 0;

        // For clarity of event indexing, fractional voting must be clearly advertised in the "support" field.
        //
        // Supported `support` value must be:
        // - "Full" voting: `support = 0` (Against), `1` (For) or `2` (Abstain), with empty params.
        // - "Fractional" voting: `support = 255`, with 48 bytes params.
        if (support == uint8(GovernorCountingSimple.VoteType.Against)) {
            if (params.length != 0) revert GovernorInvalidVoteParams();
            usedWeight = againstVotes = remainingWeight;
        } else if (support == uint8(GovernorCountingSimple.VoteType.For)) {
            if (params.length != 0) revert GovernorInvalidVoteParams();
            usedWeight = forVotes = remainingWeight;
        } else if (support == uint8(GovernorCountingSimple.VoteType.Abstain)) {
            if (params.length != 0) revert GovernorInvalidVoteParams();
            usedWeight = abstainVotes = remainingWeight;
        } else if (support == VOTE_TYPE_FRACTIONAL) {
            // The `params` argument is expected to be three packed `uint128`:
            // `abi.encodePacked(uint128(againstVotes), uint128(forVotes), uint128(abstainVotes))`
            if (params.length != 0x30) revert GovernorInvalidVoteParams();

            assembly ("memory-safe") {
                againstVotes := shr(128, mload(add(params, 0x20)))
                forVotes := shr(128, mload(add(params, 0x30)))
                abstainVotes := shr(128, mload(add(params, 0x40)))
                usedWeight := add(add(againstVotes, forVotes), abstainVotes) // inputs are uint128: cannot overflow
            }

            // check parsed arguments are valid
            if (usedWeight > remainingWeight) {
                revert GovernorExceedRemainingWeight(account, usedWeight, remainingWeight);
            }
        } else {
            revert GovernorInvalidVoteType();
        }

        // update votes tracking
        ProposalVote storage details = _proposalVotes[proposalId];
        if (againstVotes > 0) details.againstVotes += againstVotes;
        if (forVotes > 0) details.forVotes += forVotes;
        if (abstainVotes > 0) details.abstainVotes += abstainVotes;
        details.usedVotes[account] += usedWeight;

        return usedWeight;
    }
}
