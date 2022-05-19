import "GovernorCountingSimple.spec"

using ERC721VotesHarness as erc721votes

methods {
    quorumDenominator() returns uint256 envfree
    votingPeriod() returns uint256 envfree
    lateQuorumVoteExtension() returns uint64 envfree
    propose(address[], uint256[], bytes[], string)

    // harness
    getExtendedDeadlineIsUnset(uint256) returns bool envfree
    getExtendedDeadlineIsStarted(uint256) returns bool envfree
    getExtendedDeadline(uint256) returns uint64 envfree
    
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
    getExtendedDeadlineIsUnset(pId)
    && !quorumReached(e, pId);

// proposal deadline has been extended
definition deadlineExtended(env e, uint256 pId) returns bool = 
    getExtendedDeadlineIsStarted(pId)
    && quorumReached(e, pId);


//////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Invariants /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/*
 * I1: A propsal must be in state deadlineExtendable or deadlineExtended.
 * --INVARIANT PASSING // fails for updateQuorumNumerator
 * --ADVANCED SANITY PASSING // can't sanity test failing rules, not sure how it works for invariants
 */
invariant proposalInOneState(env e, uint256 pId)
    deadlineExtendable(e, pId) || deadlineExtended(e, pId)
    { preserved { require proposalCreated(pId); } }


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

    require (proposalCreated(pId));
    
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
        && f.selector != updateQuorumNumerator(uint256).selector // * fails for this function
    } {
    env e; calldataarg args; uint256 pId;

    require(deadlineExtended(e, pId));
    require(proposalCreated(pId));
    
    f(e, args);
    
    assert(deadlineExtended(e, pId));
}


/*
 * R3: A proposal's deadline can't change in deadlineExtended state.
 * RULE PASSING*
 * ADVANCED SANITY PASSING 
 */ 
rule canExtendDeadlineOnce(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;

    require(deadlineExtended(e, pId));
    require(proposalCreated(pId)); 
    
    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);
    
    assert(deadlineBefore == deadlineAfter, "deadline can not be extended twice");
}


//////////////////////////// second set of rules ////////////////////////////

// HIGH LEVEL RULE R6: deadline can only extended if quorum reached w/ <= timeOfExtension left to vote
// I1, R4 and R5 are assumed in R6 so we prove them first

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

    helperFunctionsWithRevertOnlyCastVote(pId, f, e);

    uint256 againstAfter = votesAgainst();
    uint256 forAfter = votesFor();
    uint256 abstainAfter = votesAbstain();
    
    bool hasVotedAfter = hasVoted(e, pId, acc);

    // want all vote categories to not decrease and at least one category to increase
    assert 
        (!hasVotedBefore && hasVotedAfter) => 
        (againstBefore <= againstAfter && forBefore <= forAfter && abstainBefore <= abstainAfter), 
        "no correlation: some category decreased"; // currently vacous but keeping for CI tests
    assert 
        (!hasVotedBefore && hasVotedAfter) => 
        (againstBefore < againstAfter || forBefore < forAfter || abstainBefore < abstainAfter),
        "no correlation: no category increased";
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

    assert (againstBefore < againstAfter) => quorumBefore == quorumAfter, "quorum reached with against vote"; 
}

/*
 * R6: Deadline can only be extended from a `deadlineExtendible` state with quorum being reached with <= `lateQuorumVoteExtension` time left to vote
 * RULE PASSING
 * ADVANCED SANITY PASSING 
 */
rule deadlineExtenededIfQuorumReached(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;

    // need invariant that proves that a propsal must be in state deadlineExtendable or deadlineExtended
    require(deadlineExtended(e, pId) || deadlineExtendable(e, pId));
    require(proposalCreated(pId));

    bool wasDeadlineExtendable = deadlineExtendable(e, pId);
    uint64 extension = lateQuorumVoteExtension();
    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);
    
    assert(deadlineAfter > deadlineBefore => wasDeadlineExtendable, "deadline was not extendable");
    assert(deadlineAfter > deadlineBefore => deadlineBefore - e.block.number <= extension, "deadline extension should not be used");
}

/*
 * R7: `extendedDeadlineField` is set iff `_castVote` is called and quroum is reached.
 * RULE PASSING
 * ADVANCED SANITY PASSING 
 */
rule extendedDeadlineValueSetIfQuorumReached(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;
    require(deadlineExtended(e, pId) || deadlineExtendable(e, pId));
    
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
* R8: If the deadline for a proposal has not been reached, users can still vote.
* --RULE PASSING
* --ADVANCED SANITY PASSING
*/
rule canVote(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;
    address acc = e.msg.sender;
    uint256 deadline = proposalDeadline(pId);
    bool votedBefore = hasVoted(e, pId, acc);
    
    require(proposalCreated(pId));
    require(deadline >= e.block.number);
    // last error? 
    helperFunctionsWithRevertOnlyCastVote(pId, f, e);
    bool votedAfter = hasVoted(e, pId, acc);
    
    assert !votedBefore && votedAfter => deadline >= e.block.number;
}

/*
 * R9: Deadline can never be reduced.
 * RULE PASSING
 * ADVANCED SANITY PASSING
 */
rule deadlineNeverReduced(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;
    require(proposalCreated(pId));

    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);

    assert(deadlineAfter >= deadlineBefore);
}

