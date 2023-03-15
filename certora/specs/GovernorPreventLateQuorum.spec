import "helpers.spec"
import "methods/IGovernor.spec"
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
    requireInvariant proposalStateConsistency(pId);
    requireInvariant votesImplySnapshotPassed(pId);

    uint256 deadlineBefore         = proposalDeadline(pId);
    bool    deadlineExtendedBefore = getExtendedDeadline(pId) > 0;
    bool    quorumReachedBefore    = quorumReached(pId);

    f(e, args);

    uint256 deadlineAfter         = proposalDeadline(pId);
    bool    deadlineExtendedAfter = getExtendedDeadline(pId) > 0;
    bool    quorumReachedAfter    = quorumReached(pId);

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
            // !quorumReachedBefore && // Not sure how to prove that
            quorumReachedAfter &&
            deadlineAfter == clock(e) + lateQuorumVoteExtension() &&
            votingAll(f)
        )
    );

    // a deadline can only be extended once
    assert deadlineExtendedBefore => deadlineBefore == deadlineAfter;

    // a deadline cannot be un-extended
    assert deadlineExtendedBefore => deadlineExtendedAfter;
}
