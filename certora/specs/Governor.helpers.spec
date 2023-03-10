import "methods/IGovernor.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ States                                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition UNSET()      returns uint8 = 255;
definition PENDING()    returns uint8 = 0;
definition ACTIVE()     returns uint8 = 1;
definition CANCELED()   returns uint8 = 2;
definition DEFEATED()   returns uint8 = 3;
definition SUCCEEDED()  returns uint8 = 4;
definition QUEUED()     returns uint8 = 5;
definition EXPIRED()    returns uint8 = 6;
definition EXECUTED()   returns uint8 = 7;

function safeState(env e, uint256 pId) returns uint8 {
    uint8 result = state@withrevert(e, pId);
    return lastReverted ? UNSET() : result;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Filters                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition skip(method f) returns bool =
    f.isView ||
    f.isFallback ||
    f.selector == relay(address,uint256,bytes).selector ||
    f.selector == 0xb9a61961 || // __acceptAdmin()
    f.selector == onERC721Received(address,address,uint256,bytes).selector ||
    f.selector == onERC1155Received(address,address,uint256,uint256,bytes).selector ||
    f.selector == onERC1155BatchReceived(address,address,uint256[],uint256[],bytes).selector;

definition voting(method f) returns bool =
    f.selector == castVote(uint256,uint8).selector ||
    f.selector == castVoteWithReason(uint256,uint8,string).selector ||
    f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helper functions                                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function helperVoteWithRevert(env e, method f, uint256 pId, address voter, uint8 support) returns uint256 {
    string reason; bytes params; uint8 v; bytes32 s; bytes32 r;

    if (f.selector == castVote(uint256,uint8).selector)
    {
        require e.msg.sender == voter;
        return castVote@withrevert(e, pId, support);
    }
    else  if (f.selector == castVoteWithReason(uint256,uint8,string).selector)
    {
        require e.msg.sender == voter;
        return castVoteWithReason@withrevert(e, pId, support, reason);
    }
    else  if (f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector)
    {
        require e.msg.sender == voter;
        return castVoteWithReasonAndParams@withrevert(e, pId, support, reason, params);
    }
    else
    {
        calldataarg args;
        f@withrevert(e, args);
        return 0;
    }
}

function helperFunctionsWithRevert(env e, method f, uint256 pId) {
    if (f.selector == propose(address[], uint256[], bytes[], string).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; string description;
        require pId == propose@withrevert(e, targets, values, calldatas, description);
    }
    else if (f.selector == queue(address[], uint256[], bytes[], bytes32).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; bytes32 description;
        require pId == queue@withrevert(e, targets, values, calldatas, description);
    }
    else if (f.selector == execute(address[], uint256[], bytes[], bytes32).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; bytes32 description;
        require pId == execute@withrevert(e, targets, values, calldatas, description);
    }
    else if (f.selector == cancel(address[], uint256[], bytes[], bytes32).selector)
    {
        address[] targets; uint256[] values; bytes[] calldatas; bytes32 description;
        require pId == cancel@withrevert(e, targets, values, calldatas, description);
    }
    else if (f.selector == castVote(uint256, uint8).selector)
    {
        uint8 support;
        castVote@withrevert(e, pId, support);
    }
    else if  (f.selector == castVoteWithReason(uint256, uint8, string).selector)
    {
        uint8 support; string reason;
        castVoteWithReason@withrevert(e, pId, support, reason);
    }
    else if (f.selector == castVoteWithReasonAndParams(uint256,uint8,string,bytes).selector)
    {
        uint8 support; string reason; bytes params;
        castVoteWithReasonAndParams@withrevert(e, pId, support, reason, params);
    }
    else if (f.selector == castVoteBySig(uint256, uint8,uint8, bytes32, bytes32).selector)
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
        f@withrevert(e, args);
    }
}