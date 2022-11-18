import "GovernorCountingSimple.spec"

using ERC20VotesHarness as token

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
    // summarized
    hashProposal(address[],uint256[],bytes[],bytes32) returns (uint256) => NONDET
    _hashTypedDataV4(bytes32) returns (bytes32)
    
    // envfree 
    quorumNumerator(uint256) returns uint256
    quorumDenominator() returns uint256 envfree
    votingPeriod() returns uint256 envfree
    lateQuorumVoteExtension() returns uint64 envfree
    propose(address[], uint256[], bytes[], string)

    // harness
    getDeprecatedQuorumNumerator() returns uint256 envfree
    getQuorumNumeratorLength() returns uint256 envfree
    getQuorumNumeratorLatest() returns uint256 envfree
    getExtendedDeadlineIsUnset(uint256) returns bool envfree
    getExtendedDeadlineIsStarted(uint256) returns bool envfree
    getExtendedDeadline(uint256) returns uint64 envfree
    getAgainstVotes(uint256) returns uint256 envfree
    getAbstainVotes(uint256) returns uint256 envfree
    getForVotes(uint256) returns uint256 envfree
    getPastTotalSupply(uint256) returns (uint256) envfree

    // more robust check than f.selector == _castVote(...).selector
    latestCastVoteCall() returns uint256 envfree

    // timelock dispatch
    getMinDelay() returns uint256 => DISPATCHER(true)

    hashOperationBatch(address[], uint256[], bytes[], bytes32, bytes32) => DISPATCHER(true)
    executeBatch(address[], uint256[], bytes[], bytes32, bytes32) => CONSTANT
    scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256) => CONSTANT
}


////////////////////////////////////////////////////////////////////////////////
// Helper Functions                                                           //
////////////////////////////////////////////////////////////////////////////////

function helperFunctionsWithRevertOnlyCastVote(uint256 proposalId, method f, env e) {
    string reason; uint8 support; uint8 v; bytes32 r; bytes32 s; bytes params;
	if (f.selector == castVoteBySig(uint256, uint8,uint8, bytes32, bytes32).selector) {
		castVoteBySig@withrevert(e, proposalId, support, v, r, s);
    } else {
        calldataarg args;
        f@withrevert(e, args);
    }
}
/// Restricting out common reasons why rules break. We assume quorum length won't overflow (uint256) and that functions
/// called in env `e2` have a `block.number` greater than or equal `e1`'s `block.number`.
function setup(env e1, env e2) {
    require getQuorumNumeratorLength() + 1 < max_uint;
    require e2.block.number >= e1.block.number;
}   


////////////////////////////////////////////////////////////////////////////////
//// #### Definitions                                                         //
////////////////////////////////////////////////////////////////////////////////

/// The proposal with proposal id `pId` has a deadline which is extendable.
definition deadlineExtendable(env e, uint256 pId) returns bool =
    getExtendedDeadlineIsUnset(pId) // deadline == 0
    && !quorumReached(e, pId);

/// The proposal with proposal id `pId` has a deadline which has been extended.
definition deadlineExtended(env e, uint256 pId) returns bool =
    getExtendedDeadlineIsStarted(pId) // deadline > 0
    && quorumReached(e, pId);

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
	f.selector == castVoteWithReasonAndParamsBySig(uint256,uint8,string,bytes,uint8,bytes32,bytes32).selector ||
    f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector;


////////////////////////////////////////////////////////////////////////////////
//// ### Properties                                                           //
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// Invariants                                                                 //
////////////////////////////////////////////////////////////////////////////////

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

/** 
 * The quorum numerator is always less than or equal to the quorum denominator.
 */
invariant quorumNumerLTEDenom(env e1, uint256 blockNumber)
    quorumNumerator(e1, blockNumber) <= quorumDenominator()
    { 
        preserved with (env e2) {
            setup(e1, e2);
        }
    }

/**
 * The deprecated quorum numerator variable `_quorumNumerator` is always 0 in a contract that is not upgraded.
 */
invariant deprecatedQuorumStateIsUninitialized()
    getDeprecatedQuorumNumerator() == 0

/**
 * If a proposal's deadline has been extended, then the proposal must have been created and reached quorum.
 */
invariant cantExtendWhenQuorumUnreached(env e2, uint256 pId)
    getExtendedDeadlineIsStarted(pId) => quorumReached(e2, pId) && proposalCreated(pId)
    filtered { f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector }
    { preserved with (env e1) {
        require e1.block.number > proposalSnapshot(pId);
        setup(e1, e2);
    }}

/**
 * The snapshot arrat keeping tracking of quorum numerators must never be uninitialized.
 */
invariant quorumLengthGt0(env e)
    getQuorumNumeratorLength() > 0
    filtered { f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector }
    { preserved {
        setup(e,e);
    }}

/**
 * If a proposal has reached quorum then the proposal snapshot (start `block.number`) must be non-zero
 */
invariant quorumReachedEffect(env e1, uint256 pId)
    quorumReached(e1, pId) && getPastTotalSupply(0) > 0 => proposalCreated(pId)
    filtered { f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector }
    {
        preserved with (env e2) {
            setup(e1, e2);
        }
    }


//////////////////////////////////////////////////////////////////////////////
// Rules                                                                    //
//////////////////////////////////////////////////////////////////////////////

/**
 * `updateQuorumNumerator` can only change quorum requirements for future proposals.
 * @dev In the case that the array containing past quorum numerators overflows, this rule will fail.
 */
rule quorumReachedCantChange(method f) filtered { 
    f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector 
    } {
    env e1; uint256 pId;
    bool _quorumReached = quorumReached(e1, pId);

    env e2; uint256 newQuorumNumerator;
    setup(e1, e2);
    updateQuorumNumerator(e2, newQuorumNumerator);

    env e3;
    bool quorumReached_ = quorumReached(e3, pId);

    assert _quorumReached == quorumReached_, "function changed quorumReached";
}

/**
 * Casting a vote must not decrease any category's total number of votes and increase at least one category's.
 */
rule hasVotedCorrelationNonzero(uint256 pId, method f, env e) filtered {
    f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector
    } {
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
        "after a vote is cast, the number of votes for each category must not decrease";
    assert
        (!hasVotedBefore && hasVotedAfter) =>
        (againstBefore < againstAfter || forBefore < forAfter || abstainBefore < abstainAfter),
        "after a vote is cast, the number of votes of at least one category must increase";
}

/**
 * Voting against a proposal does not count towards quorum.
 */
rule againstVotesDontCount(method f) filtered { 
    f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector 
    } {
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
 * Deadline can never be reduced.
 */
rule deadlineNeverReduced(method f) filtered { 
    f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector 
    } {
    env e1; env e2; calldataarg args; uint256 pId;

    requireInvariant quorumReachedEffect(e1, pId);
    require proposalCreated(pId);
    setup(e1, e2);

    uint256 deadlineBefore = proposalDeadline(pId);
    f(e2, args);
    uint256 deadlineAfter = proposalDeadline(pId);

    assert(deadlineAfter >= deadlineBefore);
}

//// The rules [`deadlineChangeEffects`](#deadlineChangeEffects) and [`deadlineCantBeUnextended`](#deadlineCantBeUnextended)
//// are assumed in rule [`canExtendDeadlineOnce`](#canExtendDeadlineOnce), so we prove them first.

/**
 * If deadline increases then we are in `deadlineExtended` state and `castVote`
 * was called.
 */ 
rule deadlineChangeEffects(method f) filtered {
    f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector 
    } {
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
 */ 
rule deadlineCantBeUnextended(method f) filtered {
    f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector
    } {
    env e1; env e2; env e3; env e4; calldataarg args; uint256 pId;
    setup(e1, e2);

    require(deadlineExtended(e1, pId));
    requireInvariant quorumReachedEffect(e1, pId);

    f(e2, args);

    assert(deadlineExtended(e1, pId));
}

/**
 * A proposal's deadline can't change in `deadlineExtended` state.
 */ 
rule canExtendDeadlineOnce(method f) filtered {
    f -> !f.isFallback && !f.isView && !castVoteSubset(f) && f.selector != relay(address,uint256,bytes).selector
    } {
    env e1; env e2; calldataarg args; uint256 pId;

    require(deadlineExtended(e1, pId));
    require(proposalSnapshot(pId) > 0);
    requireInvariant quorumReachedEffect(e1, pId);
    setup(e1, e2); 

    uint256 deadlineBefore = proposalDeadline(pId);
    f(e2, args);
    uint256 deadlineAfter = proposalDeadline(pId);

    assert(deadlineBefore == deadlineAfter, "deadline can not be extended twice");
}