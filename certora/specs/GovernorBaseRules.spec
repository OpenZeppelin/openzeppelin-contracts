import "methods/IGovernor.spec"
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
rule immutableFieldsAfterProposalCreation(uint256 pId, env e, method f, calldataarg arg) {
    require proposalCreated(pId);

    uint256 voteStart = proposalSnapshot(pId);
    uint256 voteEnd   = proposalDeadline(pId);
    address proposer  = proposalProposer(pId);

    f(e, arg);

    assert voteStart == proposalSnapshot(pId), "Start date was changed";
    assert voteEnd   == proposalDeadline(pId), "End date was changed";
    assert proposer  == proposalProposer(pId), "Proposer was changed";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: A user cannot vote twice                                                                                      │
│                                                                                                                     │
│ Checked for castVote only. all 3 castVote functions call _castVote, so the completeness of the verification is      │
│ counted on the fact that the 3 functions themselves makes no changes, but rather call an internal function to       │
│ execute. That means that we do not check those 3 functions directly, however for castVote & castVoteWithReason it   │
│ is quite trivial to understand why this is ok. For castVoteBySig we basically assume that the signature referendum  │
│ is correct without checking it. We could check each function separately and pass the rule, but that would have      │
│ uglyfied the code with no concrete benefit, as it is evident that nothing is happening in the first 2 functions     │
│ (calling a view function), and we do not desire to check the signature verification.                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noDoubleVoting(uint256 pId, env e, uint8 sup) {
    bool votedCheck = hasVoted(pId, e.msg.sender);

    castVote@withrevert(e, pId, sup);

    assert votedCheck => lastReverted, "double voting occurred";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: A proposal could be executed only if quorum was reached and vote succeeded                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule executionOnlyIfQuoromReachedAndVoteSucceeded(uint256 pId, env e, method f, calldataarg args) {
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
rule noStartBeforeCreation(uint256 pId, env e, method f, calldataarg args){
    require !proposalCreated(pId);
    f(e, args);
    assert proposalCreated(pId) => proposalSnapshot(pId) >= clock(e), "starts before proposal";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: A proposal cannot be executed before it ends                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noExecuteBeforeDeadline(uint256 pId, env e, method f, calldataarg args) {
    require !isExecuted(pId);
    f(e, args);
    assert isExecuted(pId) => proposalDeadline(pId) <= clock(e), "executed before deadline";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: All proposal specific (non-view) functions should revert if proposal is executed                              │
│                                                                                                                     │
│ In this rule we show that if a function is executed, i.e. execute() was called on the proposal ID, non of the       │
│ proposal specific functions can make changes again. In executedOnlyAfterExecuteFunc we connected the executed       │
│ attribute to the execute() function, showing that only execute() can change it, and that it will always change it.  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule allFunctionsRevertIfExecuted(uint256 pId, env e, method f, calldataarg args) filtered { f ->
    !skip(f) &&
    f.selector != updateQuorumNumerator(uint256).selector &&
    f.selector != updateTimelock(address).selector
} {
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
│ proposal specific functions can make changes again. In executedOnlyAfterExecuteFunc we connected the executed       │
│ attribute to the execute() function, showing that only execute() can change it, and that it will always change it.  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule allFunctionsRevertIfCanceled(uint256 pId, env e, method f, calldataarg args) filtered { f ->
    !skip(f) &&
    f.selector != updateQuorumNumerator(uint256).selector &&
    f.selector != updateTimelock(address).selector
} {
    require isCanceled(pId);
    requireInvariant noBothExecutedAndCanceled(pId);
    requireInvariant canceledImplyCreated(pId);

    helperFunctionsWithRevert(e, f, pId);

    assert lastReverted, "Function was not reverted";
}
