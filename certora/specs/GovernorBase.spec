//////////////////////////////////////////////////////////////////////////////
///////////////////// Governor.sol base definitions //////////////////////////
//////////////////////////////////////////////////////////////////////////////

using ERC20VotesHarness as erc20votes

methods {
    proposalSnapshot(uint256) returns uint256 envfree // matches proposalVoteStart
    proposalDeadline(uint256) returns uint256 envfree // matches proposalVoteEnd
    hashProposal(address[],uint256[],bytes[],bytes32) returns uint256 envfree
    isExecuted(uint256) returns bool envfree
    isCanceled(uint256) returns bool envfree
    execute(address[], uint256[], bytes[], bytes32) returns uint256
    hasVoted(uint256, address) returns bool
    castVote(uint256, uint8) returns uint256
    updateQuorumNumerator(uint256)
    queue(address[], uint256[], bytes[], bytes32) returns uint256


    // internal functions made public in harness:
    _quorumReached(uint256) returns bool
    _voteSucceeded(uint256) returns bool envfree


    _pId_Harness() returns uint256 envfree;

    // function summarization
    proposalThreshold() returns uint256 envfree

    getVotes(address, uint256) returns uint256 => DISPATCHER(true)

    erc20votes.getPastTotalSupply(uint256) returns uint256
    erc20votes.getPastVotes(address, uint256) returns uint256

    //scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256) => DISPATCHER(true)
    //executeBatch(address[], uint256[], bytes[], bytes32, bytes32) => DISPATCHER(true)
}

definition proposalCreated(uint256 pId) returns bool = proposalSnapshot(pId) > 0;

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
	} else if  (f.selector == 0x7b3c71d3 /* castVoteWithReason */) {
        calldataarg args;
        require(_pId_Harness() == proposalId);
        f@withrevert(e, args);
	} else if (f.selector == castVoteBySig(uint256, uint8,uint8, bytes32, bytes32).selector) {
		castVoteBySig@withrevert(e, proposalId, support, v, r, s);
    } else if (f.selector == queue(address[], uint256[], bytes[], bytes32).selector) {
		require targets.length <= 1 && values.length <= 1 && calldatas.length <= 1;
        queue@withrevert(e, targets, values, calldatas, descriptionHash);
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
 * Start and end date are either initialized (non zero) or uninitialized (zero) simultaneously
 * This invariant assumes that the block number cannot be 0 at any stage of the contract cycle
 * This is very safe assumption as usually the 0 block is genesis block which is uploaded with data
 * by the developers and will not be valid to raise proposals (at the current way that block chain is functioning)
 */
 // To use env with general preserved block first disable type checking then
 // use Uri's branch - --staging uri/add_with_env_to_preserved_all
invariant startAndEndDatesNonZero(uint256 pId)
        proposalSnapshot(pId) != 0 <=> proposalDeadline(pId) != 0
        /*{ preserved with (env e){   
                require e.block.number > 0;
        }}*/
        

/*
 * If a proposal is canceled it must have a start and an end date 
 */
 // To use env with general preserved block first disable type checking then
 // use Uri's branch - --staging uri/add_with_env_to_preserved_all
invariant canceledImplyStartAndEndDateNonZero(uint pId)
        isCanceled(pId) => proposalSnapshot(pId) != 0
        /*{ preserved with (env e){
                requireInvariant startAndEndDatesNonZero(pId); //@note maybe unndeeded
                require e.block.number > 0;
        }}*/


/*
 * If a proposal is executed it must have a start and an end date 
 */
 // To use env with general preserved block first disable type checking then
 // use Uri's branch - --staging uri/add_with_env_to_preserved_all
invariant executedImplyStartAndEndDateNonZero(uint pId)
        isExecuted(pId) => proposalSnapshot(pId) != 0
        /*{ preserved with (env e){
                requireInvariant startAndEndDatesNonZero(pId); //@note maybe unndeeded
                require e.block.number > 0;
        }}*/


/*
 * A proposal starting block number must be <= to the proposal end date
 */
invariant voteStartBeforeVoteEnd(uint256 pId)
        // from < to <= because snapshot and deadline can be the same block number if delays are set to 0
        // This is possible before the integration of GovernorSettings.sol to the system.
        // After integration of GovernorSettings.sol the invariant expression should be changed from <= to <
        (proposalSnapshot(pId) > 0 =>  proposalSnapshot(pId) <= proposalDeadline(pId))
        { preserved {
            requireInvariant startAndEndDatesNonZero(pId);
        }}


/*
 * A proposal cannot be both executed and canceled simultaneously.
 */
invariant noBothExecutedAndCanceled(uint256 pId) 
        !isExecuted(pId) || !isCanceled(pId)


/*
 * A proposal could be executed only if quorum was reached and vote succeeded
 */
rule executionOnlyIfQuoromReachedAndVoteSucceeded(uint256 pId, env e, method f){
    bool isExecutedBefore = isExecuted(pId);
    bool quorumReachedBefore = _quorumReached(e, pId);
    bool voteSucceededBefore = _voteSucceeded(pId);
    
    calldataarg args;
    f(e, args);
    
    bool isExecutedAfter = isExecuted(pId);
    assert (!isExecutedBefore && isExecutedAfter) => (quorumReachedBefore && voteSucceededBefore), "quorum was changed";
}

///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// In-State Rules /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

//==========================================
//------------- Voting Period --------------
//==========================================

/*
 * A user cannot vote twice
 */
 // Checked for castVote only. all 3 castVote functions call _castVote, so the completness of the verification is counted on
 // the fact that the 3 functions themselves makes no chages, but rather call an internal function to execute.
 // That means that we do not check those 3 functions directly, however for castVote & castVoteWithReason it is quite trivial
 // to understand why this is ok. For castVoteBySig we basically assume that the signature referendum is correct without checking it.
 // We could check each function seperately and pass the rule, but that would have uglyfied the code with no concrete 
 // benefit, as it is evident that nothing is happening in the first 2 functions (calling a view function), and we do not desire to check the signature verification.
rule doubleVoting(uint256 pId, uint8 sup, method f) {
    env e;
    address user = e.msg.sender;        
    bool votedCheck = hasVoted(e, pId, user);

    castVote@withrevert(e, pId, sup);

    assert votedCheck => lastReverted, "double voting accured";
}


///////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// State Transitions Rules //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

//===========================================
//-------- Propose() --> End of Time --------
//===========================================


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
 * Voting cannot start at a block number prior to proposal’s creation block number
 */
rule noStartBeforeCreation(uint256 pId) {
    uint256 previousStart = proposalSnapshot(pId);
    // This line makes sure that we see only cases where start date is changed from 0, i.e. creation of proposal
    // We proved in immutableFieldsAfterProposalCreation that once dates set for proposal, it cannot be changed
    require previousStart == 0;
    env e; calldataarg arg;
    propose(e, arg);

    uint newStart = proposalSnapshot(pId);
    // if created, start is after current block number (creation block)
    assert(newStart != previousStart => newStart >= e.block.number);
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


////////////////////////////////////////////////////////////////////////////////
////////////////////////////// High Level Rules ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
///////////////////////////// Not Categorized Yet //////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/*
 * all non-view functions should revert if proposal is executed
 */
// summarization - hashProposal => Const - for any set of arguments passed to the function the same value will be returned.
// that means that for different arguments passed, the same value will be returned, for example: func(a,b,c,d) == func(o,p,g,r)
// the summarization is not an under estimation in this case, because we want to check that for a specific proposal ID (pId), any 
// (non view) function call is reverting. We dont care what happen with other pIds, and dont care how the hash function generates the ID.
rule allFunctionsRevertIfExecuted(method f) filtered { f -> !f.isView && f.selector != 0x7d5e81e2 && !f.isFallback && f.selector != updateQuorumNumerator(uint256).selector && f.selector != 0xa890c910} {
    env e; calldataarg args;                                                         //     ^                                                                                                    ^
    uint256 pId;                                                                     //  propose                                                                                           updateTimelock
    require(isExecuted(pId));
    // requireInvariant proposalInitiated(pId);
    requireInvariant noBothExecutedAndCanceled(pId);
    callFunctionWithProposal(pId, f);
    assert(lastReverted, "Function was not reverted");
}

/*
 * all non-view functions should revert if proposal is canceled
 */
rule allFunctionsRevertIfCanceled(method f) filtered { f -> !f.isView && f.selector != 0x7d5e81e2 && !f.isFallback && f.selector != updateQuorumNumerator(uint256).selector && f.selector != 0xa890c910} {
    env e; calldataarg args;                                                         //     ^                                                                                                     ^
    uint256 pId;                                                                     //  propose                                                                                           updateTimelock
    require(isCanceled(pId));
    requireInvariant noBothExecutedAndCanceled(pId);
    // requireInvariant proposalInitiated(pId);
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


/*
* User should not be able to affect proposal threshold
*/
rule unaffectedThreshhold(method f){
    uint256 thresholdBefore = proposalThreshold();

    env e;
    calldataarg args;
    f(e, args);

    uint256 thresholdAfter = proposalThreshold();

    assert thresholdBefore == thresholdAfter, "threshold was changed";
}
