import "GovernorBase.spec"
import "GovernorCountingSimple.spec"

using ERC20VotesHarness as token

methods {
    // envfree
    quorumNumerator(uint256) returns uint256
    quorumDenominator() returns uint256 envfree

    // harness
    getDeprecatedQuorumNumerator() returns uint256 envfree
    getQuorumNumeratorLength() returns uint256 envfree
    getQuorumNumeratorLatest() returns uint256 envfree
    getExtendedDeadline(uint256) returns uint64 envfree
    getPastTotalSupply(uint256) returns (uint256) envfree
}














////////////////////////////////////////////////////////////////////////////////
// Helper Functions                                                           //
////////////////////////////////////////////////////////////////////////////////



function sanity() {
    require getQuorumNumeratorLength() + 1 < max_uint;
}





definition deadlineExtendable(env e, uint256 pId) returns bool = getExtendedDeadline(pId) == 0;
definition deadlineExtended(env e, uint256 pId) returns bool = getExtendedDeadline(pId) > 0;





invariant deadlineConsistency(env e, uint256 pId)
    (!quorumReached(e, pId) => deadlineExtendable(pId))
    &&
    (deadlineExtended(pId) => quorumReached(e, pId))


invariant proposalStateConsistencyExtended(uint256 pId)
    !proposalCreated(pId) => (getAgainstVotes(pId) == 0  && getAbstainVotes(pId) == 0  && getForVotes(pId) == 0)
    && (proposalProposer(pId) == 0 <=> proposalSnapshot(pId) == 0)
    && (proposalProposer(pId) == 0 <=> proposalDeadline(pId) == 0)
    {
        preserved with (env e) {
            require e.block.number > 0;
        }
    }








/**
 * If a proposal has reached quorum then the proposal snapshot (start `block.number`) must be non-zero
 */
invariant quorumReachedEffect(env e, uint256 pId)
    (quorumReached(e, pId) && getPastTotalSupply(proposalSnapshot(pId)) > 0) => proposalCreated(pId)

/**
 * The quorum numerator is always less than or equal to the quorum denominator.
 */
invariant quorumRatioLessThanOne(env e, uint256 blockNumber)
    quorumNumerator(e, blockNumber) <= quorumDenominator()


/**
 * If a proposal's deadline has been extended, then the proposal must have been created and reached quorum.
 */
invariant cantExtendWhenQuorumUnreached(env e, uint256 pId)
    getExtendedDeadline(pId) > 0 => (quorumReached(e, pId) && proposalCreated(pId))
    //{
    //    preserved with (env e1) {
    //        require e1.block.number > proposalSnapshot(pId);
    //        setup(e1, e);
    //    }
    //}








/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: `updateQuorumNumerator` can only change quorum requirements for future proposals.                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule quorumReachedCantChange(uint256 pId, env e, method f) filtered { f ->
    !f.isFallback
    && !f.isView
    && f.selector != relay(address,uint256,bytes).selector
    && !castVoteSubset(f)
} {
    sanity(); // not overflowing checkpoint struct
    require proposalSnapshot(pId) < e.block.number; // vote has started

    bool quorumReachedBefore = quorumReached(e, pId);

    uint256 newQuorumNumerator;
    updateQuorumNumerator(e, newQuorumNumerator);

    assert quorumReachedBefore == quorumReached(e, pId);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Casting a vote must not decrease any category's total number of votes and increase at least one category's    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule hasVotedCorrelationNonzero(uint256 pId, env e, method f, calldataarg args) filtered { f ->
    !f.isFallback
    && !f.isView
    && f.selector != relay(address,uint256,bytes).selector
    && !castVoteSubset(f)
} {
    require getVotes(e, e.msg.sender, proposalSnapshot(pId)) > 0; // assuming voter has non-zero voting power

    uint256 againstBefore = votesAgainst();
    uint256 forBefore = votesFor();
    uint256 abstainBefore = votesAbstain();

    bool hasVotedBefore = hasVoted(pId, e.msg.sender);

    f(e, args);

    uint256 againstAfter = votesAgainst();
    uint256 forAfter = votesFor();
    uint256 abstainAfter = votesAbstain();

    bool hasVotedAfter = hasVoted(pId, e.msg.sender);

    // want all vote categories to not decrease and at least one category to increase
    assert
        (!hasVotedBefore && hasVotedAfter) =>
        (againstBefore <= againstAfter && forBefore <= forAfter && abstainBefore <= abstainAfter),
        "after a vote is cast, the number of votes for each category must not decrease";
    assert
        (!hasVotedBefore && hasVotedAfter) =>
        (againstBefore < againstAfter || forBefore < forAfter || abstainBefore < abstainAfter),
        "after a vote is cast, the number of votes of at least one category must increase";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Voting against a proposal does not count towards quorum.                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule againstVotesDontCount(uint256 pId, env e, method f, calldataarg args) filtered { f ->
    !f.isFallback
    && !f.isView
    && f.selector != relay(address,uint256,bytes).selector
    && !castVoteSubset(f)
} {
    bool quorumBefore = quorumReached(e, pId);
    uint256 againstBefore = votesAgainst();

    f(e, args);

    bool quorumAfter = quorumReached(e, pId);
    uint256 againstAfter = votesAgainst();

    assert againstBefore < againstAfter => quorumBefore == quorumAfter, "quorum must not be reached with an against vote";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule:                                                                                                               │
│  * Deadline can never be reduced                                                                                    │
│  * If deadline increases then we are in `deadlineExtended` state and `castVote` was called.                         │
│  * A proposal's deadline can't change in `deadlineExtended` state.                                                  │
│  * A proposal's deadline can't be unextended.                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule deadlineChangeEffects(uint256 pId, env e, method f, calldataarg args) filtered { f ->
    !f.isFallback
    && !f.isView
    && f.selector != relay(address,uint256,bytes).selector
    && !castVoteSubset(f)
} {
    requireInvariant proposalStateConsistencyExtended(pId);

    uint256 deadlineBefore = proposalDeadline(pId);
    bool deadlineExtendedBefore = deadlineExtended(e, pId);

    f(e, args);

    uint256 deadlineAfter = proposalDeadline(pId);
    bool deadlineExtendedAfter = deadlineExtended(e, pId);

    // deadline can never be reduced
    assert deadlineBefore <= proposalDeadline(pId);

    // deadline can only be extended in proposal or on cast vote
    assert (
        deadlineAfter > deadlineBefore
    ) => (
        (!deadlineExtendedBefore && !deadlineExtendedAfter && f.selector == propose(address[], uint256[], bytes[], string).selector)
        ||
        (!deadlineExtendedBefore && deadlineExtendedAfter && f.selector == castVoteBySig(uint256, uint8,uint8, bytes32, bytes32).selector)
    );

    // a deadline can only be extended once
    assert deadlineExtendedBefore => deadlineBefore == deadlineAfter;

    // a deadline cannot be un-extended
    assert deadlineExtendedBefore => deadlineExtendedAfter;
}









































function setup(env e1, env e2) {
    require getQuorumNumeratorLength() + 1 < max_uint;
    require e2.block.number >= e1.block.number;
}

/// The proposal with proposal id `pId` has not been created.
definition proposalNotCreated(env e, uint256 pId) returns bool =
    proposalSnapshot(pId) == 0
    && proposalDeadline(pId) == 0
    && getAgainstVotes(pId) == 0
    && getAbstainVotes(pId) == 0
    && getForVotes(pId) == 0;

/// Method f is a version of `castVote` whose state changing effects are covered by `castVoteBySig`.
/// @dev castVoteBySig allows anyone to cast a vote for anyone else if they can supply the signature. Specifically,
/// it covers the case where the msg.sender supplies a signature for themselves which is normally done using the normal
/// `castVote`.
definition castVoteSubset(method f) returns bool =
    f.selector == castVote(uint256, uint8).selector ||
    f.selector == castVoteWithReason(uint256, uint8, string).selector ||
    f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector ||
    f.selector == castVoteWithReasonAndParamsBySig(uint256,uint8,string,bytes,uint8,bytes32,bytes32).selector;

/**
 * A created proposal must be in state `deadlineExtendable` or `deadlineExtended`.
 * @dev We assume the total supply of the voting token is non-zero
 */
invariant proposalInOneState(env e1, uint256 pId)
    getPastTotalSupply(0) > 0 => (proposalNotCreated(e1, pId) || deadlineExtendable(e1, pId) || deadlineExtended(e1, pId))
    filtered { f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector }
    {
        preserved with (env e2) {
            setup(e1, e2);
        }
    }
