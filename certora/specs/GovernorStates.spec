import "helpers.spec"
import "Governor.helpers.spec"
import "GovernorInvariants.spec"

use invariant proposalStateConsistency
use invariant votesImplySnapshotPassed

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: state returns one of the value in the enumeration                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateConsistency(env e, uint256 pId) {
    uint8 result = state(e, pId);
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
│ Rule: State transitions caused by function calls                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateTransitionFn(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> !assumedSafe(f) }
{
    require clockSanity(e);
    require quorumNumeratorLength() < max_uint256; // sanity

    uint8 stateBefore = state(e, pId);
    f(e, args);
    uint8 stateAfter  = state(e, pId);

    assert (stateBefore != stateAfter) => (
        (stateBefore == UNSET()     && stateAfter == PENDING()  && f.selector == propose(address[],uint256[],bytes[],string).selector ) ||
        (stateBefore == PENDING()   && stateAfter == CANCELED() && f.selector == cancel(address[],uint256[],bytes[],bytes32).selector ) ||
        (stateBefore == SUCCEEDED() && stateAfter == QUEUED()   && f.selector == queue(address[],uint256[],bytes[],bytes32).selector  ) ||
        (stateBefore == SUCCEEDED() && stateAfter == EXECUTED() && f.selector == execute(address[],uint256[],bytes[],bytes32).selector) ||
        (stateBefore == QUEUED()    && stateAfter == EXECUTED() && f.selector == execute(address[],uint256[],bytes[],bytes32).selector)
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: State transitions caused by time passing                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateTransitionWait(uint256 pId, env e1, env e2) {
    require clockSanity(e1);
    require clockSanity(e2);
    require clock(e2) > clock(e1);

    // Force the state to be consistent with e1 (before). We want the storage related to `pId` to match what is
    // possible before the time passes. We don't want the state transition include elements that cannot have happened
    // before e1. This ensure that the e1 → e2 state transition is purelly a consequence of time passing.
    requireInvariant votesImplySnapshotPassed(e1, pId);

    uint8 stateBefore = state(e1, pId);
    uint8 stateAfter  = state(e2, pId);

    assert (stateBefore != stateAfter) => (
        (stateBefore == PENDING() && stateAfter == ACTIVE()   ) ||
        (stateBefore == PENDING() && stateAfter == DEFEATED() ) ||
        (stateBefore == ACTIVE()  && stateAfter == SUCCEEDED()) ||
        (stateBefore == ACTIVE()  && stateAfter == DEFEATED() ) ||
        // Strange consequence of the timelock binding:
        // When transitioning from ACTIVE to SUCCEEDED (because of the clock moving forward) the proposal state in
        // the timelock is suddenly considered. Prior state set in the timelock can cause the proposal to already be
        // queued, executed or canceled.
        (stateBefore == ACTIVE()  && stateAfter == CANCELED()) ||
        (stateBefore == ACTIVE()  && stateAfter == EXECUTED()) ||
        (stateBefore == ACTIVE()  && stateAfter == QUEUED())
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

    uint48  currentClock  = clock(e);
    uint8   currentState  = state(e, pId);
    uint256 snapshot      = proposalSnapshot(pId);
    uint256 deadline      = proposalDeadline(pId);
    bool    quorumSuccess = quorumReached(pId);
    bool    voteSuccess   = voteSucceeded(pId);

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
//     filtered { f -> !assumedSafe(f) }
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
