import "helpers.spec"
import "Governor.helpers.spec"
import "GovernorInvariants.spec"

methods {
    lateQuorumVoteExtension()    returns uint64 envfree
    getExtendedDeadline(uint256) returns uint64 envfree
}

use invariant proposalStateConsistency
use invariant votesImplySnapshotPassed

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ This is not (easily) provable as an invariant because the prover think `_totalSupplyCheckpoints` can arbitrarily    │
│ change, which causes the quorum() to change. Not sure how to fix that.                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// invariant deadlineExtendedEquivQuorumReached(uint256 pId)
//     getExtendedDeadline(pId) > 0 <=> (quorumReached(pId) && !isCanceled(pId))

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule:                                                                                                               │
│  * Deadline can never be reduced                                                                                    │
│  * If deadline increases then we are in `deadlineExtended` state and `castVote` was called.                         │
│  * A proposal's deadline can't change in `deadlineExtended` state.                                                  │
│  * A proposal's deadline can't be unextended.                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule deadlineChangeToPreventLateQuorum(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> !skip(f) }
{
    require clockSanity(e);
    requireInvariant proposalStateConsistency(pId);
    requireInvariant votesImplySnapshotPassed(e, pId);

    uint256 deadlineBefore         = proposalDeadline(pId);
    bool    deadlineExtendedBefore = getExtendedDeadline(pId) > 0;

    f(e, args);

    uint256 deadlineAfter         = proposalDeadline(pId);
    bool    deadlineExtendedAfter = getExtendedDeadline(pId) > 0;

    // deadline can never be reduced
    assert deadlineBefore <= proposalDeadline(pId);

    // deadline can only be extended in proposal or on cast vote
    assert deadlineAfter != deadlineBefore => (
        (
            !deadlineExtendedBefore &&
            !deadlineExtendedAfter &&
            f.selector == propose(address[], uint256[], bytes[], string).selector
        ) || (
            !deadlineExtendedBefore &&
            deadlineExtendedAfter &&
            deadlineAfter == clock(e) + lateQuorumVoteExtension() &&
            votingAll(f)
        )
    );

    // a deadline can only be extended once
    assert deadlineExtendedBefore => deadlineBefore == deadlineAfter;

    // a deadline cannot be un-extended
    assert deadlineExtendedBefore => deadlineExtendedAfter;
}
