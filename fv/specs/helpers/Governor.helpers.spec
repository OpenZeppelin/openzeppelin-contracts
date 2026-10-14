import "helpers.spec";
import "../methods/IGovernor.spec";
import "../methods/ITimelockController.spec";

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Sanity                                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function clockSanity(env e) returns bool {
    return e.block.number    < max_uint48
        && e.block.timestamp < max_uint48
        && clock(e) > 0;
}

function validProposal(address[] targets, uint256[] values, bytes[] calldatas) returns bool {
    return targets.length > 0
        && targets.length == values.length
        && targets.length == calldatas.length;
}

function sanityString(string s) returns bool {
    return s.length < 0xffff;
}

function sanityBytes(bytes b) returns bool {
    return b.length < 0xffff;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ States                                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition PENDING()   returns IGovernor.ProposalState = IGovernor.ProposalState.Pending;
definition ACTIVE()    returns IGovernor.ProposalState = IGovernor.ProposalState.Active;
definition CANCELED()  returns IGovernor.ProposalState = IGovernor.ProposalState.Canceled;
definition DEFEATED()  returns IGovernor.ProposalState = IGovernor.ProposalState.Defeated;
definition SUCCEEDED() returns IGovernor.ProposalState = IGovernor.ProposalState.Succeeded;
definition QUEUED()    returns IGovernor.ProposalState = IGovernor.ProposalState.Queued;
definition EXPIRED()   returns IGovernor.ProposalState = IGovernor.ProposalState.Expired;
definition EXECUTED()  returns IGovernor.ProposalState = IGovernor.ProposalState.Executed;

definition proposalCreated(uint256 pId) returns bool =
    proposalSnapshot(pId) > 0 && proposalDeadline(pId) > 0 && proposalProposer(pId) != 0;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Filters                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition assumedSafe(method f) returns bool =
    f.isView ||
    f.isFallback ||
    f.selector == sig:relay(address,uint256,bytes).selector ||
    f.selector == sig:onERC721Received(address,address,uint256,bytes).selector ||
    f.selector == sig:onERC1155Received(address,address,uint256,uint256,bytes).selector ||
    f.selector == sig:onERC1155BatchReceived(address,address,uint256[],uint256[],bytes).selector;

// These function are covered by helperFunctionsWithRevert
definition operateOnProposal(method f) returns bool =
    f.selector == sig:propose(address[],uint256[],bytes[],string).selector ||
    f.selector == sig:queue(address[],uint256[],bytes[],bytes32).selector ||
    f.selector == sig:execute(address[],uint256[],bytes[],bytes32).selector ||
    f.selector == sig:cancel(address[],uint256[],bytes[],bytes32).selector ||
    f.selector == sig:castVote(uint256,uint8).selector ||
    f.selector == sig:castVoteWithReason(uint256,uint8,string).selector ||
    f.selector == sig:castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector ||
    f.selector == sig:castVoteBySig(uint256,uint8,address,bytes).selector ||
    f.selector == sig:castVoteWithReasonAndParamsBySig(uint256,uint8,address,string,bytes,bytes).selector;

// These function are covered by helperVoteWithRevert
definition voting(method f) returns bool =
    f.selector == sig:castVote(uint256,uint8).selector ||
    f.selector == sig:castVoteWithReason(uint256,uint8,string).selector ||
    f.selector == sig:castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector;

definition votingBySig(method f) returns bool =
    f.selector == sig:castVoteBySig(uint256,uint8,address,bytes).selector ||
    f.selector == sig:castVoteWithReasonAndParamsBySig(uint256,uint8,address,string,bytes,bytes).selector;

definition votingAll(method f) returns bool =
    voting(f) || votingBySig(f);

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helper functions                                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// Returns whether the call succeeded (did not revert)
function helperVoteWithRevert(env e, method f, uint256 pId, address voter, uint8 support) returns bool {
    if (f.selector == sig:castVote(uint256,uint8).selector)
    {
        require e.msg.sender == voter;
        castVote@withrevert(e, pId, support);
    }
    else  if (f.selector == sig:castVoteWithReason(uint256,uint8,string).selector)
    {
        string reason;
        require e.msg.sender == voter && sanityString(reason);
        castVoteWithReason@withrevert(e, pId, support, reason);
    }
    else  if (f.selector == sig:castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector)
    {
        string reason; bytes params;
        require e.msg.sender == voter && sanityString(reason) && sanityBytes(params);
        castVoteWithReasonAndParams@withrevert(e, pId, support, reason, params);
    }
    else
    {
        calldataarg args;
        f@withrevert(e, args);
    }
    return !lastReverted;
}

// Same as helperVoteWithRevert, but only considers non-reverting calls. Returns the weight of the vote.
function helperVote(env e, method f, uint256 pId, address voter, uint8 support) returns uint256 {
    if (f.selector == sig:castVote(uint256,uint8).selector)
    {
        require e.msg.sender == voter;
        return castVote(e, pId, support);
    }
    else  if (f.selector == sig:castVoteWithReason(uint256,uint8,string).selector)
    {
        string reason;
        require e.msg.sender == voter && sanityString(reason);
        return castVoteWithReason(e, pId, support, reason);
    }
    else  if (f.selector == sig:castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector)
    {
        string reason; bytes params;
        require e.msg.sender == voter && sanityString(reason) && sanityBytes(params);
        return castVoteWithReasonAndParams(e, pId, support, reason, params);
    }
    else
    {
        calldataarg args;
        f(e, args);
        return 0;
    }
}

// Governor function that operates on a given proposalId may or may not include the proposalId in the arguments. This
// helper restricts the call to method `f` in a way that it's operating on a specific proposal.
//
// This can be used to say "consider any function call that operates on proposal `pId`" or "consider a propose call
// that corresponds to a given pId".
//
// This is for example used when proving that not 2 proposals can be proposed with the same id: Once the proposal is
// proposed a first time, we want to prove that "any propose call that corresponds to the same id should revert".
//
// Returns whether the call succeeded (did not revert)
function helperFunctionsWithRevert(env e, method f, uint256 pId) returns bool {
    if (f.selector == sig:propose(address[],uint256[],bytes[],string).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; string descr;
        require pId == hashProposal(targets, values, calldatas, descr);
        propose@withrevert(e, targets, values, calldatas, descr);
    }
    else if (f.selector == sig:queue(address[],uint256[],bytes[],bytes32).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
        require pId == hashProposal(targets, values, calldatas, descrHash);
        queue@withrevert(e, targets, values, calldatas, descrHash);
    }
    else if (f.selector == sig:execute(address[],uint256[],bytes[],bytes32).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
        require pId == hashProposal(targets, values, calldatas, descrHash);
        execute@withrevert(e, targets, values, calldatas, descrHash);
    }
    else if (f.selector == sig:cancel(address[],uint256[],bytes[],bytes32).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
        require pId == hashProposal(targets, values, calldatas, descrHash);
        cancel@withrevert(e, targets, values, calldatas, descrHash);
    }
    else if (f.selector == sig:castVote(uint256,uint8).selector)
    {
        uint8 support;
        castVote@withrevert(e, pId, support);
    }
    else if (f.selector == sig:castVoteWithReason(uint256,uint8,string).selector)
    {
        uint8 support; string reason;
        castVoteWithReason@withrevert(e, pId, support, reason);
    }
    else if (f.selector == sig:castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector)
    {
        uint8 support; string reason; bytes params;
        castVoteWithReasonAndParams@withrevert(e, pId, support, reason, params);
    }
    else if (f.selector == sig:castVoteBySig(uint256,uint8,address,bytes).selector)
    {
        uint8 support; address voter; bytes signature;
        castVoteBySig@withrevert(e, pId, support, voter, signature);
    }
    else if (f.selector == sig:castVoteWithReasonAndParamsBySig(uint256,uint8,address,string,bytes,bytes).selector)
    {
        uint8 support; address voter; string reason; bytes params; bytes signature;
        castVoteWithReasonAndParamsBySig@withrevert(e, pId, support, voter, reason, params, signature);
    }
    else
    {
        calldataarg args;
        f@withrevert(e, args);
    }
    return !lastReverted;
}
