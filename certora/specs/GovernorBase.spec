//////////////////////////////////////////////////////////////////////////////
///////////////////// Governor.sol base definitions //////////////////////////
//////////////////////////////////////////////////////////////////////////////

methods {
    hashProposal(address[],uint256[],bytes[],bytes32) returns uint256 envfree
    state(uint256) returns uint8
    proposalThreshold() returns uint256 envfree
    proposalSnapshot(uint256) returns uint256 envfree // matches proposalVoteStart
    proposalDeadline(uint256) returns uint256 envfree // matches proposalVoteEnd

    propose(address[], uint256[], bytes[], string) returns uint256
    execute(address[], uint256[], bytes[], bytes32) returns uint256
    cancel(address[], uint256[], bytes[], bytes32) returns uint256

    getVotes(address, uint256) returns uint256 => DISPATCHER(true)
    getVotesWithParams(address, uint256, bytes) returns uint256 => DISPATCHER(true)
    castVote(uint256, uint8) returns uint256
    castVoteWithReason(uint256, uint8, string) returns uint256
    castVoteWithReasonAndParams(uint256, uint8, string, bytes) returns uint256

    // GovernorTimelockController
    queue(address[], uint256[], bytes[], bytes32) returns uint256

    // GovernorCountingSimple
    hasVoted(uint256, address) returns bool envfree
    updateQuorumNumerator(uint256)

    // harness functions
    getAgainstVotes(uint256) returns uint256 envfree
    getAbstainVotes(uint256) returns uint256 envfree
    getForVotes(uint256) returns uint256 envfree
    getExecutor(uint256) returns bool envfree
    isExecuted(uint256) returns bool envfree
    isCanceled(uint256) returns bool envfree

    // full harness functions
    getPastTotalSupply(uint256) returns uint256 => DISPATCHER(true)
    /// getPastVotes(address, uint256) returns uint256 => DISPATCHER(true)

    // internal functions made public in harness:
    quorumReached(uint256) returns bool
    voteSucceeded(uint256) returns bool envfree
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Definitions                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

definition proposalCreated(uint256 pId) returns bool =
    proposalSnapshot(pId) > 0 && proposalDeadline(pId) > 0;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helper functions                                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function helperFunctionsWithRevert(uint256 proposalId, method f, env e) {
    address[] targets; uint256[] values; bytes[] calldatas; string reason; bytes32 descriptionHash;
    uint8 support; uint8 v; bytes32 r; bytes32 s; bytes params;

    if (f.selector == propose(address[], uint256[], bytes[], string).selector)
    {
        uint256 result = propose@withrevert(e, targets, values, calldatas, reason);
        require(result == proposalId);
    }
    else if (f.selector == execute(address[], uint256[], bytes[], bytes32).selector)
    {
        uint256 result = execute@withrevert(e, targets, values, calldatas, descriptionHash);
        require(result == proposalId);
    }
    else if (f.selector == queue(address[], uint256[], bytes[], bytes32).selector)
    {
        uint256 result = queue@withrevert(e, targets, values, calldatas, descriptionHash);
        require(result == proposalId);
    }
    else if (f.selector == cancel(address[], uint256[], bytes[], bytes32).selector)
    {
        uint256 result = cancel@withrevert(e, targets, values, calldatas, descriptionHash);
        require(result == proposalId);
    }
    else if (f.selector == castVote(uint256, uint8).selector)
    {
        castVote@withrevert(e, proposalId, support);
    }
    else if  (f.selector == castVoteWithReason(uint256, uint8, string).selector)
    {
        castVoteWithReason@withrevert(e, proposalId, support, reason);
    }
    else if (f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector)
    {
        castVoteWithReasonAndParams@withrevert(e, proposalId, support, reason, params);
    }
    else if (f.selector == castVoteBySig(uint256, uint8,uint8, bytes32, bytes32).selector)
    {
        castVoteBySig@withrevert(e, proposalId, support, v, r, s);
    }
    else if (f.selector == castVoteWithReasonAndParamsBySig(uint256,uint8,string,bytes,uint8,bytes32,bytes32).selector)
    {
        castVoteWithReasonAndParamsBySig@withrevert(e, proposalId, support, reason, params, v, r, s);
    }
    else
    {
        calldataarg args;
        f@withrevert(e, args);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Votes start and end are either initialized (non zero) or uninitialized (zero) simultaneously             │
│                                                                                                                     │
│ This invariant assumes that the block number cannot be 0 at any stage of the contract cycle                         │
│ This is very safe assumption as usually the 0 block is genesis block which is uploaded with data                    │
│ by the developers and will not be valid to raise proposals (at the current way that block chain is functioning)     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant startAndEndDatesNonZero(uint256 pId)
    proposalSnapshot(pId) != 0 <=> proposalDeadline(pId) != 0
    {
        preserved with (env e) {
            require e.block.number > 0;
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
            requireInvariant startAndEndDatesNonZero(pId);
            require e.block.number > 0;
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
            requireInvariant startAndEndDatesNonZero(pId);
            require e.block.number > 0;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Votes start before it ends                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant voteStartBeforeVoteEnd(uint256 pId)
    //proposalCreated(pId) => proposalSnapshot(pId) <= proposalDeadline(pId)
    proposalSnapshot(pId) <= proposalDeadline(pId)
    {
        preserved {
            requireInvariant startAndEndDatesNonZero(pId);
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
│ Rule: A proposal could be executed only if quorum was reached and vote succeeded                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule executionOnlyIfQuoromReachedAndVoteSucceeded(uint256 pId, env e, method f, calldataarg args) {
    require(!isExecuted(pId));

    bool quorumReachedBefore = quorumReached(e, pId);
    bool voteSucceededBefore = voteSucceeded(pId);

    f(e, args);

    assert isExecuted(pId) => (quorumReachedBefore && voteSucceededBefore), "quorum was changed";
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
rule noDoubleVoting(uint256 pId, env e, uint8 sup) {
    bool votedCheck = hasVoted(pId, e.msg.sender);

    castVote@withrevert(e, pId, sup);

    assert votedCheck => lastReverted, "double voting occurred";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Once a proposal is created, voteStart and voteEnd are immutable                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule immutableFieldsAfterProposalCreation(uint256 pId, env e, method f, calldataarg arg) {
    require proposalCreated(pId);

    uint256 voteStart = proposalSnapshot(pId);
    uint256 voteEnd = proposalDeadline(pId);

    f(e, arg);

    assert voteStart == proposalSnapshot(pId), "Start date was changed";
    assert voteEnd == proposalDeadline(pId), "End date was changed";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Voting cannot start at a block number prior to proposal’s creation block number                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noStartBeforeCreation(uint256 pId, env e, method f, calldataarg args){
    require !proposalCreated(pId);
    f(e, args);
    assert proposalCreated(pId) => proposalSnapshot(pId) >= e.block.number, "starts before proposal";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: A proposal cannot be executed before it ends                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noExecuteBeforeDeadline(uint256 pId, env e, method f, calldataarg args) {
    require !isExecuted(pId);
    f(e, args);
    assert isExecuted(pId) => proposalDeadline(pId) <= e.block.number, "executed before deadline";
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
rule proposedOnlyAfterProposeFunc(uint256 pId, env e, method f) {
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
