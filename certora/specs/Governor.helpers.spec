import "helpers.spec"
import "methods/IGovernor.spec"
import "methods/ITimelockController.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Sanity                                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function clockSanity(env e) returns bool {
    return e.block.number    < max_uint48()
        && e.block.timestamp < max_uint48()
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
definition UNSET()     returns uint8 = 255;
definition PENDING()   returns uint8 = 0;
definition ACTIVE()    returns uint8 = 1;
definition CANCELED()  returns uint8 = 2;
definition DEFEATED()  returns uint8 = 3;
definition SUCCEEDED() returns uint8 = 4;
definition QUEUED()    returns uint8 = 5;
definition EXPIRED()   returns uint8 = 6;
definition EXECUTED()  returns uint8 = 7;

// This helper is an alternative to state(e, pId) that will return UNSET() instead of reverting when then proposal
// does not exist (not created yet)
function safeState(env e, uint256 pId) returns uint8 {
    return proposalCreated(pId) ? state(e, pId): UNSET();
}

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
    f.selector == relay(address,uint256,bytes).selector ||
    f.selector == onERC721Received(address,address,uint256,bytes).selector ||
    f.selector == onERC1155Received(address,address,uint256,uint256,bytes).selector ||
    f.selector == onERC1155BatchReceived(address,address,uint256[],uint256[],bytes).selector;

// These function are covered by helperFunctionsWithRevert
definition operateOnProposal(method f) returns bool =
    f.selector == propose(address[],uint256[],bytes[],string).selector ||
    f.selector == queue(address[],uint256[],bytes[],bytes32).selector ||
    f.selector == execute(address[],uint256[],bytes[],bytes32).selector ||
    f.selector == cancel(address[],uint256[],bytes[],bytes32).selector ||
    f.selector == castVote(uint256,uint8).selector ||
    f.selector == castVoteWithReason(uint256,uint8,string).selector ||
    f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector ||
    f.selector == castVoteBySig(uint256,uint8,uint8,bytes32,bytes32).selector ||
    f.selector == castVoteWithReasonAndParamsBySig(uint256,uint8,string,bytes,uint8,bytes32,bytes32).selector;

// These function are covered by helperVoteWithRevert
definition voting(method f) returns bool =
    f.selector == castVote(uint256,uint8).selector ||
    f.selector == castVoteWithReason(uint256,uint8,string).selector ||
    f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector;

definition votingBySig(method f) returns bool =
    f.selector == castVoteBySig(uint256,uint8,uint8,bytes32,bytes32).selector ||
    f.selector == castVoteWithReasonAndParamsBySig(uint256,uint8,string,bytes,uint8,bytes32,bytes32).selector;

definition votingAll(method f) returns bool =
    voting(f) || votingBySig(f);

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helper functions                                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function helperVoteWithRevert(env e, method f, uint256 pId, address voter, uint8 support) returns uint256 {
    if (f.selector == castVote(uint256,uint8).selector)
    {
        require e.msg.sender == voter;
        return castVote@withrevert(e, pId, support);
    }
    else  if (f.selector == castVoteWithReason(uint256,uint8,string).selector)
    {
        string reason;
        require e.msg.sender == voter && sanityString(reason);
        return castVoteWithReason@withrevert(e, pId, support, reason);
    }
    else  if (f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector)
    {
        string reason; bytes params;
        require e.msg.sender == voter && sanityString(reason) && sanityBytes(params);
        return castVoteWithReasonAndParams@withrevert(e, pId, support, reason, params);
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
function helperFunctionsWithRevert(env e, method f, uint256 pId) {
    if (f.selector == propose(address[],uint256[],bytes[],string).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; string descr;
        require pId == hashProposal(targets, values, calldatas, descr);
        propose@withrevert(e, targets, values, calldatas, descr);
    }
    else if (f.selector == queue(address[],uint256[],bytes[],bytes32).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
        require pId == hashProposal(targets, values, calldatas, descrHash);
        queue@withrevert(e, targets, values, calldatas, descrHash);
    }
    else if (f.selector == execute(address[],uint256[],bytes[],bytes32).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
        require pId == hashProposal(targets, values, calldatas, descrHash);
        execute@withrevert(e, targets, values, calldatas, descrHash);
    }
    else if (f.selector == cancel(address[],uint256[],bytes[],bytes32).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
        require pId == hashProposal(targets, values, calldatas, descrHash);
        cancel@withrevert(e, targets, values, calldatas, descrHash);
    }
    else if (f.selector == castVote(uint256,uint8).selector)
    {
        uint8 support;
        castVote@withrevert(e, pId, support);
    }
    else if (f.selector == castVoteWithReason(uint256,uint8,string).selector)
    {
        uint8 support; string reason;
        castVoteWithReason@withrevert(e, pId, support, reason);
    }
    else if (f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector)
    {
        uint8 support; string reason; bytes params;
        castVoteWithReasonAndParams@withrevert(e, pId, support, reason, params);
    }
    else if (f.selector == castVoteBySig(uint256,uint8,uint8,bytes32,bytes32).selector)
    {
        uint8 support; uint8 v; bytes32 r; bytes32 s;
        castVoteBySig@withrevert(e, pId, support, v, r, s);
    }
    else if (f.selector == castVoteWithReasonAndParamsBySig(uint256,uint8,string,bytes,uint8,bytes32,bytes32).selector)
    {
        uint8 support; string reason; bytes params; uint8 v; bytes32 r; bytes32 s;
        castVoteWithReasonAndParamsBySig@withrevert(e, pId, support, reason, params, v, r, s);
    }
    else
    {
        calldataarg args;
        f(e, args);
    }
}
