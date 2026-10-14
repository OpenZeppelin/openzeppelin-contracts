import "helpers/Governor.helpers.spec";
import "GovernorInvariants.spec";

use invariant proposalStateConsistency;
use invariant votesImplySnapshotPassed;

definition assumedSafeOrDuplicate(method f) returns bool =
    assumedSafe(f)
    || f.selector == sig:castVoteWithReason(uint256,uint8,string).selector
    || f.selector == sig:castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector
    || f.selector == sig:castVoteBySig(uint256,uint8,address,bytes).selector
    || f.selector == sig:castVoteWithReasonAndParamsBySig(uint256,uint8,address,string,bytes,bytes).selector;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: state returns one of the value in the enumeration                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateDomain(env e, uint256 pId) {
    IGovernor.ProposalState result = state(e, pId);
    assert (
        result == PENDING()   ||
        result == ACTIVE()    ||
        result == CANCELED()  ||
        result == DEFEATED()  ||
        result == SUCCEEDED() ||
        result == QUEUED()    ||
        result == EXECUTED()
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [DISABLED] Rule: State transitions caused by function calls                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
/// Previous version that results in the prover timing out.
// rule stateTransitionFn(uint256 pId, env e, method f, calldataarg args)
//     filtered { f -> !assumedSafeOrDuplicate(f) }
// {
//     require clockSanity(e);
//     require quorumNumeratorLength() < max_uint256; // sanity
//
//     bool                    createdBefore = proposalCreated(pId);
//     IGovernor.ProposalState stateBefore   = safeState(e, pId);
//     f(e, args);
//     bool                    createdAfter  = proposalCreated(pId);
//     IGovernor.ProposalState stateAfter    = safeState(e, pId);
//
//     assert (createdBefore != createdAfter || stateBefore != stateAfter) => (
//         (!createdBefore && createdAfter               && stateAfter == PENDING()  && f.selector == sig:propose(address[],uint256[],bytes[],string).selector ) ||
//         ( createdBefore && stateBefore == PENDING()   && stateAfter == CANCELED() && f.selector == sig:cancel(address[],uint256[],bytes[],bytes32).selector ) ||
//         ( createdBefore && stateBefore == SUCCEEDED() && stateAfter == QUEUED()   && f.selector == sig:queue(address[],uint256[],bytes[],bytes32).selector  ) ||
//         ( createdBefore && stateBefore == SUCCEEDED() && stateAfter == EXECUTED() && f.selector == sig:execute(address[],uint256[],bytes[],bytes32).selector) ||
//         ( createdBefore && stateBefore == QUEUED()    && stateAfter == EXECUTED() && f.selector == sig:execute(address[],uint256[],bytes[],bytes32).selector)
//     );
// }

/// This version also causes a lot of timeouts so we comment it out of now
// function stateTransitionFnHelper(method f, IGovernor.ProposalState s) returns IGovernor.ProposalState {
//     uint256 pId; env e; calldataarg args;
//
//     require clockSanity(e);
//     require quorumNumeratorLength() < max_uint256; // sanity
//
//     require proposalCreated(pId) && state(e, pId) == s; // constrain state before
//     f(e, args);
//     require state(e, pId) != s; // constrain state after
//
//     return state(e, pId);
// }
//
// rule stateTransitionFn_UNSET(method f) filtered { f -> !assumedSafeOrDuplicate(f) } {
//     uint256 pId; env e; calldataarg args;
//
//     require clockSanity(e);
//     require quorumNumeratorLength() < max_uint256; // sanity
//
//     require !proposalCreated(pId); // constrain state before
//     f(e, args);
//     require proposalCreated(pId); // constrain state after
//
//     assert state(e, pId) == PENDING() && f.selector == sig:propose(address[],uint256[],bytes[],string).selector;
// }
//
// rule stateTransitionFn_PENDING(method f) filtered { f -> !assumedSafeOrDuplicate(f) } {
//     IGovernor.ProposalState stateAfter = stateTransitionFnHelper(f, PENDING());
//     assert stateAfter == CANCELED() && f.selector == sig:cancel(address[],uint256[],bytes[],bytes32).selector;
// }
//
// rule stateTransitionFn_ACTIVE(method f) filtered { f -> !assumedSafeOrDuplicate(f) } {
//     IGovernor.ProposalState stateAfter = stateTransitionFnHelper(f, ACTIVE());
//     assert false;
// }
//
// rule stateTransitionFn_CANCELED(method f) filtered { f -> !assumedSafeOrDuplicate(f) } {
//     IGovernor.ProposalState stateAfter = stateTransitionFnHelper(f, CANCELED());
//     assert false;
// }
//
// rule stateTransitionFn_DEFEATED(method f) filtered { f -> !assumedSafeOrDuplicate(f) } {
//     IGovernor.ProposalState stateAfter = stateTransitionFnHelper(f, DEFEATED());
//     assert false;
// }
//
// rule stateTransitionFn_SUCCEEDED(method f) filtered { f -> !assumedSafeOrDuplicate(f) } {
//     IGovernor.ProposalState stateAfter = stateTransitionFnHelper(f, SUCCEEDED());
//     assert (
//         (stateAfter == QUEUED()   && f.selector == sig:queue(address[],uint256[],bytes[],bytes32).selector) ||
//         (stateAfter == EXECUTED() && f.selector == sig:execute(address[],uint256[],bytes[],bytes32).selector)
//     );
// }
//
// rule stateTransitionFn_QUEUED(method f) filtered { f -> !assumedSafeOrDuplicate(f) } {
//     IGovernor.ProposalState stateAfter = stateTransitionFnHelper(f, QUEUED());
//     assert stateAfter == EXECUTED() && f.selector == sig:execute(address[],uint256[],bytes[],bytes32).selector;
// }
//
// rule stateTransitionFn_EXECUTED(method f) filtered { f -> !assumedSafeOrDuplicate(f) } {
//     IGovernor.ProposalState stateAfter = stateTransitionFnHelper(f, EXECUTED());
//     assert false;
// }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: State transitions caused by time passing                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// The timelockId can be set in states QUEUED, EXECUTED and CANCELED. However, checking the full scope of this results
// in a timeout. This is a weaker version that is still useful. Ideally we would check `safeState`.
invariant noTimelockBeforeEndOfVote(env e, uint256 pId)
    state(e, pId) == ACTIVE() => timelockId(pId) == to_bytes32(0);

rule stateTransitionWait(uint256 pId, env e1, env e2) {
    require clockSanity(e1);
    require clockSanity(e2);
    require clock(e2) > clock(e1);

    // Force the state to be consistent with e1 (before). We want the storage related to `pId` to match what is
    // possible before the time passes. We don't want the state transition include elements that cannot have happened
    // before e1. This ensure that the e1 → e2 state transition is purelly a consequence of time passing.
    requireInvariant votesImplySnapshotPassed(e1, pId);
    requireInvariant noTimelockBeforeEndOfVote(e1, pId);

    IGovernor.ProposalState stateBefore = state(e1, pId); // Ideally we would also cover proposals that don't exist
    IGovernor.ProposalState stateAfter  = state(e2, pId); // Ideally we would also cover proposals that don't exist

    assert (stateBefore != stateAfter) => (
        (stateBefore == PENDING() && stateAfter == ACTIVE()   ) ||
        (stateBefore == PENDING() && stateAfter == DEFEATED() ) ||
        (stateBefore == ACTIVE()  && stateAfter == SUCCEEDED()) ||
        (stateBefore == ACTIVE()  && stateAfter == DEFEATED() )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: State corresponds to the vote timing and results                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateIsConsistentWithVotes(uint256 pId, env e) {
    require clockSanity(e);
    requireInvariant proposalStateConsistency(pId);
    require proposalCreated(pId); // state() reverts for proposals that don't exist

    uint48                  currentClock  = clock(e);
    IGovernor.ProposalState currentState  = state(e, pId);
    uint256                 snapshot      = proposalSnapshot(pId);
    uint256                 deadline      = proposalDeadline(pId);
    bool                    quorumSuccess = quorumReached(pId);
    bool                    voteSuccess   = voteSucceeded(pId);

    // Pending: before vote starts
    assert currentState == PENDING() => (
        snapshot >= currentClock
    );

    // Active: after vote starts & before vote ends
    assert currentState == ACTIVE() => (
        snapshot < currentClock &&
        deadline >= currentClock
    );

    // Succeeded: after vote end, with vote successful and quorum reached
    assert currentState == SUCCEEDED() => (
        deadline < currentClock &&
        (
            quorumSuccess &&
            voteSuccess
        )
    );

    // Defeated: after vote end, with vote not successful or quorum not reached
    assert currentState == DEFEATED() => (
        deadline < currentClock &&
        (
            !quorumSuccess ||
            !voteSuccess
        )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [NEED WORK] Rule: `updateQuorumNumerator` cannot cause quorumReached to change.                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
//// This would be nice, but its way to slow to run because "quorumReached" is a FV nightmare
//// Also, for it to work we need to prove that the checkpoints have (strictly) increasing keys.
// rule onlyVoteCanChangeQuorumReached(uint256 pId, env e, method f, calldataarg args)
//     filtered { f -> !assumedSafeOrDuplicate(f) }
// {
//     require clockSanity(e);
//     require clock(e) > proposalSnapshot(pId); // vote has started
//     require quorumNumeratorLength() < max_uint256; // sanity
//
//     bool quorumReachedBefore = quorumReached(pId);
//
//     uint256 snapshot    = proposalSnapshot(pId);
//     uint256 totalSupply = token_getPastTotalSupply(snapshot);
//
//     f(e, args);
//
//     // Needed because the prover doesn't understand the checkpoint properties of the voting token.
//     require clock(e) > snapshot => token_getPastTotalSupply(snapshot) == totalSupply;
//
//     assert quorumReached(pId) != quorumReachedBefore => (
//         !quorumReachedBefore &&
//         votingAll(f)
//     );
// }

//// To prove that, we need to prove that the checkpoints have (strictly) increasing keys.
//// otherwise it gives us counter example where the checkpoint history has keys:
//// [ 12,12,13,13,12] and the lookup obviously fail to get the correct value
// rule quorumUpdateDoesntAffectPastProposals(uint256 pId, env e) {
//     require clockSanity(e);
//     require clock(e) > proposalSnapshot(pId); // vote has started
//     require quorumNumeratorLength() < max_uint256; // sanity
//
//     bool quorumReachedBefore = quorumReached(pId);
//
//     uint256 newQuorumNumerator;
//     updateQuorumNumerator(e, newQuorumNumerator);
//
//     assert quorumReached(pId) == quorumReachedBefore;
// }
