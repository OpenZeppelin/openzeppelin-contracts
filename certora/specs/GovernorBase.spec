//////////////////////////////////////////////////////////////////////////////
///////////////////// Governor.sol base definitions //////////////////////////
//////////////////////////////////////////////////////////////////////////////

methods {
    proposalSnapshot(uint256) returns uint256 envfree // matches proposalVoteStart
    proposalDeadline(uint256) returns uint256 envfree // matches proposalVoteEnd
    hashProposal(address[],uint256[],bytes[],bytes32) returns uint256 envfree
    isExecuted(uint256) returns bool envfree
    isCanceled(uint256) returns bool envfree
    execute(address[], uint256[], bytes[], bytes32) returns uint256
    hasVoted(uint256, address) returns bool
    castVote(uint256, uint8) returns uint256

    // internal functions made public in harness:
    _quorumReached(uint256) returns bool envfree
    _voteSucceeded(uint256) returns bool envfree


    _pId_Harness() returns uint256 envfree;

    // function summarization
    hashProposal(address[], uint256[], bytes[], bytes32) => CONSTANT
}

//////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Ghosts ////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// ghost uniqueHashGhost(bytes32) returns uint256;

//////////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper Functions ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function callFunctionWithProposal(uint256 proposalId, method f) {
    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descriptionHash;
    uint8 support; uint8 v; bytes32 r; bytes32 s;
	env e;
	if (f.selector == callPropose(address[], uint256[], bytes[]).selector) {
		uint256 result = callPropose@withrevert(e, targets, values, calldatas);
        require(proposalId == result);
	} else if (f.selector == execute(address[], uint256[], bytes[], bytes32).selector) {
		uint256 result = execute@withrevert(e, targets, values, calldatas, descriptionHash);
        require(result == proposalId);
	} else if (f.selector == castVote(uint256, uint8).selector) {
		castVote@withrevert(e, proposalId, support);
	} else if  (f.selector == 0x7b3c71d3) {
        calldataarg args;
        require(_pId_Harness() == proposalId);
        f@withrevert(e, args);
	} else if (f.selector == castVoteBySig(uint256, uint8,uint8, bytes32, bytes32).selector) {
		castVoteBySig@withrevert(e, proposalId, support, v, r, s);
	} else {
        calldataarg args;
        f@withrevert(e, args);
    }
}

/*
 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 ///////////////////////////////////////////////////// State Diagram //////////////////////////////////////////////////////////
 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 //                                                                                                                          //
 //                                                                castVote(s)()                                             //
 //  -------------  propose()  ----------------------  time pass  ---------------       time passes         -----------      //
 // | No Proposal | --------> | Before Start (Delay) | --------> | Voting Period | ----------------------> | execute() |     //
 //  -------------             ----------------------             --------------- -> Executed/Canceled      -----------      //
 //  ------------------------------------------------------------|---------------|-------------------------|-------------->  //
 // t                                                          start            end                     timelock             //
 //                                                                                                                          //
 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
*/


///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Global Valid States /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////


/*
 * If any of the properties are non zero, the rest has to be non zero 
 */
invariant proposalInitiated(uint256 pId)
        (proposalSnapshot(pId) != 0 <=> proposalDeadline(pId) != 0) &&
        (isCanceled(pId) => proposalSnapshot(pId) != 0) &&
        (isExecuted(pId) => proposalSnapshot(pId) != 0)
        /*{ preserved with (env e){   
            require e.block.number > 0;
        }}*/
        


/*
 * A proposal cannot end unless it started.
 */
invariant voteStartBeforeVoteEnd(uint256 pId)
    (proposalSnapshot(pId) > 0 =>  proposalSnapshot(pId) < proposalDeadline(pId))
         && (proposalSnapshot(pId) == 0 => proposalDeadline(pId) == 0)


/*
 * A proposal cannot be both executed and canceled.
 */
invariant noBothExecutedAndCanceled(uint256 pId) 
        !isExecuted(pId) || !isCanceled(pId)


/**
 * A proposal could be executed only if quorum was reached and vote succeeded
 */
invariant executionOnlyIfQuoromReachedAndVoteSucceeded(uint256 pId) 
        isExecuted(pId) => _quorumReached(pId) && _voteSucceeded(pId)


///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// In-State Rules /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

//==========================================
//------------- Voting Period --------------
//==========================================


/*
 * A user cannot vote twice
 */
rule doubleVoting(uint256 pId, uint8 sup) {
    env e;
    address user = e.msg.sender;        
    bool votedCheck = hasVoted(e, pId, user);

    castVote@withrevert(e, pId, sup);
    bool reverted = lastReverted;

    assert votedCheck => reverted, "double voting accured";
}


///////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// State Transitions Rules //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

//===========================================
//-------- Propose() --> End of Time --------
//===========================================


/*
 * The voting must start not before the proposal’s creation time
 */
rule noStartBeforeCreation(uint256 pId) {
    uint256 previousStart = proposalSnapshot(pId);
    require previousStart == 0;
    env e;
    calldataarg arg;
    propose(e, arg);

    uint newStart = proposalSnapshot(pId);
    // if created, start is after current block number (creation block)
    assert(newStart != previousStart => newStart >= e.block.number);
}


/*
 * Once a proposal is created, voteStart and voteEnd are immutable
 */
rule immutableFieldsAfterProposalCreation(uint256 pId, method f) {
    uint _voteStart = proposalSnapshot(pId);
    uint _voteEnd = proposalDeadline(pId);
    require _voteStart > 0; // proposal was created - relation proved in noStartBeforeCreation

    env e;
    calldataarg arg;
    f(e, arg);

    uint voteStart_ = proposalSnapshot(pId);
    uint voteEnd_ = proposalDeadline(pId);
    assert _voteStart == voteStart_;
    assert _voteEnd == voteEnd_;
}


/*
 * A proposal cannot be neither executed nor canceled before it starts
 */
rule noExecuteOrCancelBeforeStarting(uint256 pId, method f){
    env e;

    require !isExecuted(pId) && !isCanceled(pId);

    calldataarg arg;
    f(e, arg);

    assert e.block.number < proposalSnapshot(pId) => (!isExecuted(pId) && !isCanceled(pId)), "executed/cancelled before start";
}

//============================================
//--- End of Voting Period --> End of Time ---
//============================================


/*
 * A proposal cannot be neither executed nor canceled before proposal's deadline
 */
rule noExecuteOrCancelBeforeDeadline(uint256 pId, method f){
    env e;

    requireInvariant voteStartBeforeVoteEnd(pId);
    require !isExecuted(pId) && !isCanceled(pId);

    calldataarg arg;
    f(e, arg);

    assert e.block.number < proposalDeadline(pId) => (!isExecuted(pId) && !isCanceled(pId)), "executed/cancelled before deadline";
}

////////////////////////////////////////////////////////////////////////////////
////////////////////// Integrity Of Functions (Unit Tests) /////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Check hashProposal hashing is reliable (different inputs lead to different buffers hashed)
 */
/*
rule checkHashProposal {
    address[] t1;
    address[] t2;
    uint256[] v1;
    uint256[] v2;
    bytes[] c1;
    bytes[] c2;
    bytes32 d1;
    bytes32 d2;

    uint256 h1 = hashProposal(t1,v1,c1,d1);
    uint256 h2 = hashProposal(t2,v2,c2,d2);
    bool equalHashes = h1 == h2;
    assert equalHashes => t1.length == t2.length;
    assert equalHashes => v1.length == v2.length;
    assert equalHashes => c1.length == c2.length;
    assert equalHashes => d1 == d2;
}
*/

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// High Level Rules ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/*
 * all non-view functions should revert if proposal is executed
 */
// summarization - hashProposal => Const - for any set of arguments passed to the function the same value will be returned.
// that means that for different arguments passed, the same value will be returned, for example: func(a,b,c,d) == func(o,p,g,r)
// the summarization is not an under estimation in this case, because we want to check that for a specific proposal ID (pId), any 
// (non view) function call is reverting. We dont care what happen with other pIds, and dont care how the hash function generates the ID.
rule allFunctionsRevertIfExecuted(method f) filtered { f -> !f.isView && f.selector != 0x7d5e81e2 && !f.isFallback} {
    env e; calldataarg args;                                                         //     ^
    uint256 pId;                                                                     //  propose
    require(isExecuted(pId));
    requireInvariant proposalInitiated(pId);
    requireInvariant noBothExecutedAndCanceled(pId);
    callFunctionWithProposal(pId, f);
    assert(lastReverted, "Function was not reverted");
}

/*
 * all non-view functions should revert if proposal is canceled
 */
rule allFunctionsRevertIfCanceled(method f) filtered { f -> !f.isView && f.selector != 0x7d5e81e2 && !f.isFallback} {
    env e; calldataarg args;                                                         //     ^
    uint256 pId;                                                                     //  propose
    require(isCanceled(pId));
    requireInvariant noBothExecutedAndCanceled(pId);
    requireInvariant proposalInitiated(pId);
    callFunctionWithProposal(pId, f);
    assert(lastReverted, "Function was not reverted");
}

/*
 * Shows that executed can only change due to execute()
 */
rule executedOnlyAfterExecuteFunc(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash, method f) {
    env e; calldataarg args;
    uint256 pId;
    bool executedBefore = isExecuted(pId);
    require(!executedBefore);
    callFunctionWithProposal(pId, f);
    require(!lastReverted);
    // execute(e, targets, values, calldatas, descriptionHash);
    bool executedAfter = isExecuted(pId);
    assert(executedAfter != executedBefore, "executed property did not change");
}
