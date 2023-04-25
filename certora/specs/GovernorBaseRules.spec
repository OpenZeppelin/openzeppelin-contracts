import "helpers.spec"
import "Governor.helpers.spec"
import "GovernorInvariants.spec"

use invariant proposalStateConsistency
use invariant canceledImplyCreated
use invariant executedImplyCreated
use invariant noBothExecutedAndCanceled

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: No double proposition                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noDoublePropose(uint256 pId, env e) {
    require proposalCreated(pId);

    address[] targets; uint256[] values; bytes[] calldatas; string reason;
    uint256 result = propose(e, targets, values, calldatas, reason);

    assert result != pId, "double proposal";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Once a proposal is created, voteStart, voteEnd and proposer are immutable                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule immutableFieldsAfterProposalCreation(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> !assumedSafe(f) }
{
    require proposalCreated(pId);

    uint256 voteStart = proposalSnapshot(pId);
    uint256 voteEnd   = proposalDeadline(pId);
    address proposer  = proposalProposer(pId);

    f(e, args);

    assert voteStart == proposalSnapshot(pId), "Start date was changed";
    assert voteEnd   == proposalDeadline(pId), "End date was changed";
    assert proposer  == proposalProposer(pId), "Proposer was changed";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: A user cannot vote twice                                                                                      │
│                                                                                                                     │
│ This rule is checked for castVote, castVoteWithReason and castVoteWithReasonAndParams. For the signature variants   │
│ (castVoteBySig and castVoteWithReasonAndParamsBySig) we basically assume that the signature referendum is correct   │
│ without checking it.                                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noDoubleVoting(uint256 pId, env e, method f)
    filtered { f -> voting(f) }
{
    address voter;
    uint8   support;

    bool votedCheck = hasVoted(pId, voter);

    helperVoteWithRevert(e, f, pId, voter, support);

    assert votedCheck => lastReverted, "double voting occurred";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Voting against a proposal does not count towards quorum.                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule againstVotesDontCountTowardsQuorum(uint256 pId, env e)
{
    bool quorumReachedBefore = quorumReached(pId);

    // Ideally we would use `helperVoteWithRevert` here, but it causes timeout. Consider changing it if/when the prover improves.
    castVote(e, pId, 0);

    assert quorumReached(pId) == quorumReachedBefore, "quorum must not be reached with an against vote";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: A proposal could be executed only if quorum was reached and vote succeeded                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule executionOnlyIfQuoromReachedAndVoteSucceeded(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> !assumedSafe(f) }
{
    require !isExecuted(pId);

    bool quorumReachedBefore = quorumReached(pId);
    bool voteSucceededBefore = voteSucceeded(pId);

    f(e, args);

    assert isExecuted(pId) => (quorumReachedBefore && voteSucceededBefore), "quorum not met or vote not successful";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Voting cannot start at a block number prior to proposal’s creation block number                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noStartBeforeCreation(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> !assumedSafe(f) }
{
    require !proposalCreated(pId);

    f(e, args);

    assert proposalCreated(pId) => proposalSnapshot(pId) >= clock(e), "starts before proposal";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: A proposal cannot be executed before it ends                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noExecuteBeforeDeadline(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> !assumedSafe(f) }
{
    require !isExecuted(pId);

    f(e, args);

    assert isExecuted(pId) => proposalDeadline(pId) <= clock(e), "executed before deadline";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: The quorum numerator is always less than or equal to the quorum denominator                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant quorumRatioLessThanOne()
    quorumNumerator() <= quorumDenominator()
    filtered { f -> !assumedSafe(f) }
    {
        preserved {
            require quorumNumeratorLength() < max_uint256;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: All proposal specific (non-view) functions should revert if proposal is executed                              │
│                                                                                                                     │
│ In this rule we show that if a function is executed, i.e. execute() was called on the proposal ID, none of the      │
│ proposal specific functions can make changes again. Note that we prove that only the `execute()` function can set   |
| isExecuted() to true in in `GorvernorChanges.spec`.                                                                 |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule allFunctionsRevertIfExecuted(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> operateOnProposal(f) }
{
    require isExecuted(pId);
    requireInvariant noBothExecutedAndCanceled(pId);
    requireInvariant executedImplyCreated(pId);

    helperFunctionsWithRevert(e, f, pId);

    assert lastReverted, "Function was not reverted";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: All proposal specific (non-view) functions should revert if proposal is canceled                              │
│                                                                                                                     │
│ In this rule we show that if a function is executed, i.e. execute() was called on the proposal ID, non of the       │
│ proposal specific functions can make changes again. Note that we prove that only the `execute()` function can set   |
| isExecuted() to true in in `GorvernorChanges.spec`.                                                                 |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule allFunctionsRevertIfCanceled(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> operateOnProposal(f) }
{
    require isCanceled(pId);
    requireInvariant noBothExecutedAndCanceled(pId);
    requireInvariant canceledImplyCreated(pId);

    helperFunctionsWithRevert(e, f, pId);

    assert lastReverted, "Function was not reverted";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Update operation are restricted to executor                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule privilegedUpdate(env e, method f, calldataarg args)
    filtered { f -> !assumedSafe(f) }
{
    address executorBefore        = getExecutor();
    uint256 quorumNumeratorBefore = quorumNumerator();
    address timelockBefore        = timelock();

    f(e, args);

    assert quorumNumerator() != quorumNumeratorBefore => e.msg.sender == executorBefore;
    assert timelock()        != timelockBefore        => e.msg.sender == executorBefore;
}
