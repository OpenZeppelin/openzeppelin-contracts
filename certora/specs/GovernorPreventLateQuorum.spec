import "GovernorCountingSimple.spec"

/***
## Verification of `GovernorPreventLateQuorum`

`GovernorPreventLateQuorum` extends the Governor group of contracts to add the
feature of giving voters more time to vote in the case that a proposal reaches
quorum with less than `voteExtension` amount of time left to vote.

### Assumptions and Simplifications
    
None
    
#### Harnessing
- The contract that the specification was verified against is
  `GovernorPreventLateQuorumHarness`, which inherits from all of the Governor
  contracts — excluding Compound variations — and implements a number of view
  functions to gain access to values that are impossible/difficult to access in
  CVL. It also implements all of the required functions not implemented in the
  abstract contracts it inherits from.

- `_castVote` was overridden to add an additional flag before calling the parent
  version. This flag stores the `block.number` in a variable
  `latestCastVoteCall` and is used as a way to check when any of variations of
  `castVote` are called.
    
#### Munging

- Various variables' visibility was changed from private to internal or from
  internal to public throughout the Governor contracts in order to make them
  accessible in the spec.

- Arbitrary low level calls are assumed to change nothing and thus the function
  `_execute` is changed to do nothing. The tool normally havocs in this
  situation, assuming all storage can change due to possible reentrancy. We
  assume, however, there is no risk of reentrancy because `_execute` is a
  protected call locked behind the timelocked governance vote. All other
  governance functions are verified separately.
*/

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
// Helper Functions                            ///////////////////////////////
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

////////////////////////////////////////////////////////////////////////////////
//// #### Definitions                                                         //
////////////////////////////////////////////////////////////////////////////////

/// proposal deadline can be extended (but isn't)
definition deadlineExtendable(env e, uint256 pId) returns bool = 
    getExtendedDeadlineIsUnset(pId) // deadline == 0
    && !quorumReached(e, pId);



/// proposal deadline has been extended
definition deadlineExtended(env e, uint256 pId) returns bool = 
    getExtendedDeadlineIsStarted(pId) // deadline > 0
    && quorumReached(e, pId);

/// proposal isn't created
definition proposalNotCreated(env e, uint256 pId) returns bool = 
    proposalSnapshot(pId) == 0
    && proposalDeadline(pId) == 0
    && getExtendedDeadlineIsUnset(pId)
    && getAgainstVotes(pId) == 0
    && getAbstainVotes(pId) == 0
    && getForVotes(pId) == 0
    && !quorumReached(e, pId);


////////////////////////////////////////////////////////////////////////////////
//// ### Properties                                                           //
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Invariants                                                                 //
////////////////////////////////////////////////////////////////////////////////

/**
 * If a proposal has reached quorum then the proposal snapshot (start `block.number`) must be non-zero
 * @dev INVARIANT NOT PASSING // fails for updateQuorumNumerator and in the initial state when voting token total supply is 0 (causes quoromReached to return true)
 * @dev ADVANCED SANITY NOT RAN
 */ 
invariant quorumReachedEffect(env e, uint256 pId)
    quorumReached(e, pId) => proposalCreated(pId) // bug: 0 supply 0 votes => quorumReached
    // filtered { f -> f.selector != updateQuorumNumerator(uint256).selector } // * fails for this function

/**
 * A non-existent proposal must meet the definition of one.
 * @dev INVARIANT NOT PASSING // fails for updateQuorumNumerator and in the initial state when voting token total supply is 0 (causes quoromReached to return true)
 * @dev ADVANCED SANITY NOT RAN
 */
invariant proposalNotCreatedEffects(env e, uint256 pId)
    !proposalCreated(pId) => proposalNotCreated(e, pId)
    // filtered { f -> f.selector != updateQuorumNumerator(uint256).selector } // * fails for this function

/**
 * A created proposal must be in state `deadlineExtendable` or `deadlineExtended`.
 * @dev INVARIANT NOT PASSING // fails for updateQuorumNumerator and in the initial state when voting token total supply is 0 (causes quoromReached to return true)
 * @dev ADVANCED SANITY NOT RAN 
 */
invariant proposalInOneState(env e, uint256 pId)
    proposalNotCreated(e, pId) || deadlineExtendable(e, pId) || deadlineExtended(e, pId)
    // filtered { f -> f.selector != updateQuorumNumerator(uint256).selector } // * fails for this function
    { preserved { requireInvariant proposalNotCreatedEffects(e, pId); }}


//////////////////////////////////////////////////////////////////////////////
// Rules                                  ////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

///////////////////////////// #### first set of rules ////////////////////////

//// The rules [`deadlineChangeEffects`](#deadlineChangeEffects) and [`deadlineCantBeUnextended`](#deadlineCantBeUnextended)
//// are assumed in rule [`canExtendDeadlineOnce`](#canExtendDeadlineOnce), so we prove them first.

/**
 * If deadline increases then we are in `deadlineExtended` state and `castVote`
 * was called.
 * @dev RULE PASSING
 * @dev ADVANCED SANITY PASSING 
 */ 
rule deadlineChangeEffects(method f) filtered {f -> !f.isView} {
    env e; calldataarg args; uint256 pId;

    requireInvariant quorumReachedEffect(e, pId);

    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);

    assert(deadlineAfter > deadlineBefore => latestCastVoteCall() == e.block.number && deadlineExtended(e, pId));
}


/**
 * @title Deadline can't be unextended
 * @notice A proposal can't leave `deadlineExtended` state.
 * @dev RULE PASSING
 * @dev ADVANCED SANITY PASSING 
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


/**
 * A proposal's deadline can't change in `deadlineExtended` state.
 * @dev RULE PASSING
 * @dev ADVANCED SANITY PASSING 
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


/////////////////////// #### second set of rules ////////////////////////////

//// The main rule in this section is [the deadline can only be extended if quorum reached with <= `timeOfExtension` left to vote](#deadlineExtnededIfQuorumReached)
//// The other rules of this section are assumed in the proof, so we prove them
//// first.

/**
 * A change in `hasVoted` must be correlated with an increasing of the vote
 * supports, i.e. casting a vote increases the total number of votes.
 * @dev RULE PASSING
 * @dev ADVANCED SANITY PASSING
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

/**
 * @title Against votes don't count
 * @notice An against vote does not make a proposal reach quorum.
 * @dev RULE PASSING
 * @dev --ADVANCED SANITY PASSING vacuous but keeping
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

/**
 * Deadline can only be extended from a `deadlineExtendible` state with quorum being reached with <= `lateQuorumVoteExtension` time left to vote
 * @dev RULE PASSING
 * @dev ADVANCED SANITY PASSING 
 */
rule deadlineExtendedIfQuorumReached(method f) filtered {f -> !f.isView} {
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

/**
 * `extendedDeadlineField` is set if and only if `_castVote` is called and quorum is reached.
 * @dev RULE PASSING
 * @dev ADVANCED SANITY PASSING 
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

/**
 * Deadline can never be reduced.
 * @dev RULE PASSING
 * @dev ADVANCED SANITY PASSING
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
