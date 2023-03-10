import "methods/IGovernor.spec"
import "Governor.helpers.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Definitions                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

definition proposalCreated(uint256 pId) returns bool =
    proposalSnapshot(pId) > 0 && proposalDeadline(pId) > 0 && proposalProposer(pId) != 0;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Votes start and end are either initialized (non zero) or uninitialized (zero) simultaneously             │
│                                                                                                                     │
│ This invariant assumes that the block number cannot be 0 at any stage of the contract cycle                         │
│ This is very safe assumption as usually the 0 block is genesis block which is uploaded with data                    │
│ by the developers and will not be valid to raise proposals (at the current way that block chain is functioning)     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant proposalStateConsistency(uint256 pId)
    (proposalProposer(pId) != 0 <=> proposalSnapshot(pId) != 0) && (proposalProposer(pId) != 0 <=> proposalDeadline(pId) != 0)
    {
        preserved with (env e) {
            require clock(e) > 0;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: cancel => created                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant canceledImplyCreated(uint pId)
    isCanceled(pId) => proposalCreated(pId)
    {
        preserved with (env e) {
            requireInvariant proposalStateConsistency(pId);
            require clock(e) > 0;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: executed => created                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant executedImplyCreated(uint pId)
    isExecuted(pId) => proposalCreated(pId)
    {
        preserved with (env e) {
            requireInvariant proposalStateConsistency(pId);
            require clock(e) > 0;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Votes start before it ends                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant voteStartBeforeVoteEnd(uint256 pId)
    proposalSnapshot(pId) <= proposalDeadline(pId)
    {
        preserved {
            requireInvariant proposalStateConsistency(pId);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: A proposal cannot be both executed and canceled simultaneously                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant noBothExecutedAndCanceled(uint256 pId)
    !isExecuted(pId) || !isCanceled(pId)

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
    uint256 voteEnd = proposalDeadline(pId);
    address proposer = proposalProposer(pId);

    f(e, arg);

    assert voteStart == proposalSnapshot(pId), "Start date was changed";
    assert voteEnd == proposalDeadline(pId), "End date was changed";
    assert proposer == proposalProposer(pId), "Proposer was changed";
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

    assert isExecuted(pId) => (quorumReachedBefore && voteSucceededBefore), "quorum was changed";
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
rule allFunctionsRevertIfExecuted(uint256 pId, env e, method f, calldataarg args) filtered {
    f -> !f.isView && !f.isFallback
    && f.selector != updateTimelock(address).selector
    && f.selector != updateQuorumNumerator(uint256).selector
    && f.selector != relay(address,uint256,bytes).selector
    && f.selector != 0xb9a61961 // __acceptAdmin()
    && f.selector != onERC721Received(address,address,uint256,bytes).selector
    && f.selector != onERC1155Received(address,address,uint256,uint256,bytes).selector
    && f.selector != onERC1155BatchReceived(address,address,uint256[],uint256[],bytes).selector
} {
    require isExecuted(pId);
    requireInvariant noBothExecutedAndCanceled(pId);
    requireInvariant executedImplyCreated(pId);

    helperFunctionsWithRevert(pId, f, e);

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
rule allFunctionsRevertIfCanceled(uint256 pId, env e, method f, calldataarg args) filtered {
    f -> !f.isView && !f.isFallback
    && f.selector != updateTimelock(address).selector
    && f.selector != updateQuorumNumerator(uint256).selector
    && f.selector != relay(address,uint256,bytes).selector
    && f.selector != 0xb9a61961 // __acceptAdmin()
    && f.selector != onERC721Received(address,address,uint256,bytes).selector
    && f.selector != onERC1155Received(address,address,uint256,uint256,bytes).selector
    && f.selector != onERC1155BatchReceived(address,address,uint256[],uint256[],bytes).selector
} {
    require isCanceled(pId);
    requireInvariant noBothExecutedAndCanceled(pId);
    requireInvariant canceledImplyCreated(pId);

    helperFunctionsWithRevert(pId, f, e);

    assert lastReverted, "Function was not reverted";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Proposal can be switched state only by specific functions                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateOnlyAfterFunc(uint256 pId, env e, method f) {
    bool createdBefore = proposalCreated(pId);
    bool executedBefore = isExecuted(pId);
    bool canceledBefore = isCanceled(pId);

    helperFunctionsWithRevert(pId, f, e);

    assert (proposalCreated(pId) != createdBefore)
        => (createdBefore == false && f.selector == propose(address[], uint256[], bytes[], string).selector),
        "proposalCreated only changes in the propose method";

    assert (isExecuted(pId) != executedBefore)
        => (executedBefore == false && f.selector == execute(address[], uint256[], bytes[], bytes32).selector),
        "isExecuted only changes in the execute method";

    assert (isCanceled(pId) != canceledBefore)
        => (canceledBefore == false && f.selector == cancel(address[], uint256[], bytes[], bytes32).selector),
        "isCanceled only changes in the cancel method";
}
