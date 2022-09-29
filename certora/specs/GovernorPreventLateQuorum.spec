import "GovernorCountingSimple.spec"

methods {
    quorumDenominator() returns uint256 envfree
    votingPeriod() returns uint256 envfree
    lateQuorumVoteExtension() returns uint64 envfree
    propose(address[], uint256[], bytes[], string)

    // harness
    getExtendedDeadlineIsUnset(uint256) returns bool envfree
    getExtendedDeadlineIsStarted(uint256) returns bool envfree
    getExtendedDeadline(uint256) returns uint64 envfree
    getAgainstVotes(uint256) returns uint256 envfree
    getAbstainVotes(uint256) returns uint256 envfree
    getForVotes(uint256) returns uint256 envfree

    // more robust check than f.selector == _castVote(...).selector
    latestCastVoteCall() returns uint256 envfree

    // timelock dispatch
    getMinDelay() returns uint256 => DISPATCHER(true)

    hashOperationBatch(address[], uint256[], bytes[], bytes32, bytes32) => DISPATCHER(true)
    executeBatch(address[], uint256[], bytes[], bytes32, bytes32) => CONSTANT
    scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256) => CONSTANT
}


//////////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper Functions ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function helperFunctionsWithRevertOnlyCastVote(uint256 proposalId, method f, env e) {
    string reason; uint8 support; uint8 v; bytes32 r; bytes32 s; bytes params;
    if (f.selector == castVote(uint256, uint8).selector) {
		castVote@withrevert(e, proposalId, support);
	} else if  (f.selector == castVoteWithReason(uint256, uint8, string).selector) {
        castVoteWithReason@withrevert(e, proposalId, support, reason);
	} else if (f.selector == castVoteBySig(uint256, uint8,uint8, bytes32, bytes32).selector) {
		castVoteBySig@withrevert(e, proposalId, support, v, r, s);
	} else if (f.selector == castVoteWithReasonAndParamsBySig(uint256,uint8,string,bytes,uint8,bytes32,bytes32).selector) {
        castVoteWithReasonAndParamsBySig@withrevert(e, proposalId, support, reason, params, v, r, s);
    } else if (f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector) {
        castVoteWithReasonAndParams@withrevert(e, proposalId, support, reason, params);
    } else {
        calldataarg args;
        f@withrevert(e, args);
    }
}


//////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Definitions /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// proposal deadline can be extended (but isn't)
definition deadlineExtendable(env e, uint256 pId) returns bool =
    getExtendedDeadlineIsUnset(pId) // deadline == 0
    && !quorumReached(e, pId);

// proposal deadline has been extended
definition deadlineExtended(env e, uint256 pId) returns bool =
    getExtendedDeadlineIsStarted(pId) // deadline > 0
    && quorumReached(e, pId);

definition proposalNotCreated(env e, uint256 pId) returns bool =
    proposalSnapshot(pId) == 0
    && proposalDeadline(pId) == 0
    && getExtendedDeadlineIsUnset(pId)
    && getAgainstVotes(pId) == 0
    && getAbstainVotes(pId) == 0
    && getForVotes(pId) == 0
    && !quorumReached(e, pId);


//////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Invariants /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/*
 * I1: If a proposal has reached quorum then the proposal snapshot (start block.number) must be non-zero
 * INVARIANT NOT PASSING // fails for updateQuorumNumerator and in the initial state when voting token total supply is 0 (causes quoromReached to return true)
 * ADVANCED SANITY NOT RAN
 */
invariant quorumReachedEffect(env e, uint256 pId)
    quorumReached(e, pId) => proposalCreated(pId) // bug: 0 supply 0 votes => quorumReached
    // filtered { f -> f.selector != updateQuorumNumerator(uint256).selector } // * fails for this function

/*
 * I2: A non-existant proposal must meet the definition of one.
 * INVARIANT NOT PASSING // fails for updateQuorumNumerator and in the initial state when voting token total supply is 0 (causes quoromReached to return true)
 * ADVANCED SANITY NOT RAN
 */
invariant proposalNotCreatedEffects(env e, uint256 pId)
    !proposalCreated(pId) => proposalNotCreated(e, pId)
    // filtered { f -> f.selector != updateQuorumNumerator(uint256).selector } // * fails for this function

/*
 * I3: A created propsal must be in state deadlineExtendable or deadlineExtended.
 * INVARIANT NOT PASSING // fails for updateQuorumNumerator and in the initial state when voting token total supply is 0 (causes quoromReached to return true)
 * ADVANCED SANITY NOT RAN
 */
invariant proposalInOneState(env e, uint256 pId)
    proposalNotCreated(e, pId) || deadlineExtendable(e, pId) || deadlineExtended(e, pId)
    // filtered { f -> f.selector != updateQuorumNumerator(uint256).selector } // * fails for this function
    { preserved { requireInvariant proposalNotCreatedEffects(e, pId); }}


//////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Rules /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

///////////////////////////// first set of rules /////////////////////////////

// R1 and R2 are assumed in R3, so we prove them first
/*
 * R1: If deadline increases then we are in deadlineExtended state and castVote was called.
 * RULE PASSING
 * ADVANCED SANITY PASSING
 */
rule deadlineChangeEffects(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;

    requireInvariant quorumReachedEffect(e, pId);

    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);

    assert(deadlineAfter > deadlineBefore => latestCastVoteCall() == e.block.number && deadlineExtended(e, pId));
}


/*
 * R2: A proposal can't leave deadlineExtended state.
 * RULE PASSING*
 * ADVANCED SANITY PASSING
 */
rule deadlineCantBeUnextended(method f)
    filtered {
        f -> !f.isView
        // && f.selector != updateQuorumNumerator(uint256).selector // * fails for this function
    } {
    env e; calldataarg args; uint256 pId;

    require(deadlineExtended(e, pId));
    requireInvariant quorumReachedEffect(e, pId);

    f(e, args);

    assert(deadlineExtended(e, pId));
}


/*
 * R3: A proposal's deadline can't change in deadlineExtended state.
 * RULE PASSING
 * ADVANCED SANITY PASSING
 */
rule canExtendDeadlineOnce(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;

    require(deadlineExtended(e, pId));
    requireInvariant quorumReachedEffect(e, pId);

    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);

    assert(deadlineBefore == deadlineAfter, "deadline can not be extended twice");
}


//////////////////////////// second set of rules ////////////////////////////

// HIGH LEVEL RULE R6: deadline can only extended if quorum reached w/ <= timeOfExtension left to vote
// I3, R4 and R5 are assumed in R6 so we prove them first

/*
 * R4: A change in hasVoted must be correlated with an increasing of the vote supports, i.e. casting a vote increases the total number of votes.
 * RULE PASSING
 * ADVANCED SANITY PASSING
 */
rule hasVotedCorrelationNonzero(uint256 pId, method f, env e) filtered {f -> !f.isView} {
    address acc = e.msg.sender;

    require(getVotes(e, acc, proposalSnapshot(pId)) > 0); // assuming voter has non-zero voting power

    uint256 againstBefore = votesAgainst();
    uint256 forBefore = votesFor();
    uint256 abstainBefore = votesAbstain();

    bool hasVotedBefore = hasVoted(e, pId, acc);

    helperFunctionsWithRevertOnlyCastVote(pId, f, e); // should be f(e, args)

    uint256 againstAfter = votesAgainst();
    uint256 forAfter = votesFor();
    uint256 abstainAfter = votesAbstain();

    bool hasVotedAfter = hasVoted(e, pId, acc);

    // want all vote categories to not decrease and at least one category to increase
    assert
        (!hasVotedBefore && hasVotedAfter) =>
        (againstBefore <= againstAfter && forBefore <= forAfter && abstainBefore <= abstainAfter),
        "after a vote is cast, the number of votes for each category must not decrease"; // currently vacous but keeping for CI tests
    assert
        (!hasVotedBefore && hasVotedAfter) =>
        (againstBefore < againstAfter || forBefore < forAfter || abstainBefore < abstainAfter),
        "after a vote is cast, the number of votes of at least one category must increase";
}


/*
 * R5: An against vote does not make a proposal reach quorum.
 * RULE PASSING
 * --ADVANCED SANITY PASSING vacuous but keeping
 */
rule againstVotesDontCount(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;
    address acc = e.msg.sender;

    bool quorumBefore = quorumReached(e, pId);
    uint256 againstBefore = votesAgainst();

    f(e, args);

    bool quorumAfter = quorumReached(e, pId);
    uint256 againstAfter = votesAgainst();

    assert (againstBefore < againstAfter) => quorumBefore == quorumAfter, "quorum must not be reached with an against vote";
}

/*
 * R6: Deadline can only be extended from a `deadlineExtendible` state with quorum being reached with <= `lateQuorumVoteExtension` time left to vote
 * RULE PASSING
 * ADVANCED SANITY PASSING
 */
rule deadlineExtenededIfQuorumReached(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;

    requireInvariant proposalInOneState(e, pId);
    requireInvariant quorumReachedEffect(e, pId);
    requireInvariant proposalNotCreatedEffects(e, pId);

    bool wasDeadlineExtendable = deadlineExtendable(e, pId);
    uint64 extension = lateQuorumVoteExtension();
    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);

    assert deadlineAfter > deadlineBefore => wasDeadlineExtendable, "deadline must have been extendable for the deadline to be extended";
    assert deadlineAfter > deadlineBefore => deadlineBefore - e.block.number <= extension, "deadline extension should not be used";
}

/*
 * R7: `extendedDeadlineField` is set iff `_castVote` is called and quroum is reached.
 * RULE PASSING
 * ADVANCED SANITY PASSING
 */
rule extendedDeadlineValueSetIfQuorumReached(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;

    requireInvariant proposalInOneState(e, pId);

    bool extendedBefore = deadlineExtended(e, pId);
    f(e, args);
    bool extendedAfter = deadlineExtended(e, pId);
    uint256 extDeadline = getExtendedDeadline(pId);

    assert(
        !extendedBefore && extendedAfter
        => extDeadline == e.block.number + lateQuorumVoteExtension(),
        "extended deadline was not set"
    );
}

/*
 * R8: Deadline can never be reduced.
 * RULE PASSING
 * ADVANCED SANITY PASSING
 */
rule deadlineNeverReduced(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;

    requireInvariant quorumReachedEffect(e, pId);
    requireInvariant proposalNotCreatedEffects(e, pId);

    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);

    assert(deadlineAfter >= deadlineBefore);
}
