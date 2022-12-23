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

    // function summarization
    proposalThreshold() returns uint256 envfree

    getVotes(address, uint256) returns uint256 => DISPATCHER(true)

    getPastTotalSupply(uint256 t) returns uint256      => PER_CALLEE_CONSTANT
    getPastVotes(address a, uint256 t) returns uint256 => PER_CALLEE_CONSTANT

    //scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256) => DISPATCHER(true)
    //executeBatch(address[], uint256[], bytes[], bytes32, bytes32) => DISPATCHER(true)
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Definitions /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


// proposal was created - relation proved in noStartBeforeCreation
definition proposalCreated(uint256 pId) returns bool = proposalSnapshot(pId) > 0;


//////////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper Functions ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function helperFunctionsWithRevert(uint256 proposalId, method f, env e) {
    address[] targets; uint256[] values; bytes[] calldatas; string reason; bytes32 descriptionHash;
    uint8 support; uint8 v; bytes32 r; bytes32 s;
	if (f.selector == propose(address[], uint256[], bytes[], string).selector) {
		uint256 result = propose@withrevert(e, targets, values, calldatas, reason);
        require(result == proposalId);
	} else if (f.selector == execute(address[], uint256[], bytes[], bytes32).selector) {
		uint256 result = execute@withrevert(e, targets, values, calldatas, descriptionHash);
        require(result == proposalId);
	} else if (f.selector == castVote(uint256, uint8).selector) {
		castVote@withrevert(e, proposalId, support);
	} else if  (f.selector == castVoteWithReason(uint256, uint8, string).selector) {
        castVoteWithReason@withrevert(e, proposalId, support, reason);
	} else if (f.selector == castVoteBySig(uint256, uint8,uint8, bytes32, bytes32).selector) {
		castVoteBySig@withrevert(e, proposalId, support, v, r, s);
    } else if (f.selector == queue(address[], uint256[], bytes[], bytes32).selector) {
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
 // To use env with general preserved block disable type checking [--disableLocalTypeChecking]
invariant startAndEndDatesNonZero(uint256 pId)
        proposalSnapshot(pId) != 0 <=> proposalDeadline(pId) != 0
        { preserved with (env e){
                require e.block.number > 0;
        }}


/*
 * If a proposal is canceled it must have a start and an end date
 */
 // To use env with general preserved block disable type checking [--disableLocalTypeChecking]
invariant canceledImplyStartAndEndDateNonZero(uint pId)
        isCanceled(pId) => proposalSnapshot(pId) != 0
        {preserved with (env e){
                require e.block.number > 0;
        }}


/*
 * If a proposal is executed it must have a start and an end date
 */
 // To use env with general preserved block disable type checking [--disableLocalTypeChecking]
invariant executedImplyStartAndEndDateNonZero(uint pId)
        isExecuted(pId) => proposalSnapshot(pId) != 0
        { preserved with (env e){
            requireInvariant startAndEndDatesNonZero(pId);
            require e.block.number > 0;
        }}


/*
 * A proposal starting block number must be less or equal than the proposal end date
 */
invariant voteStartBeforeVoteEnd(uint256 pId)
        // from < to <= because snapshot and deadline can be the same block number if delays are set to 0
        // This is possible before the integration of GovernorSettings.sol to the system.
        // After integration of GovernorSettings.sol the invariant expression should be changed from <= to <
        (proposalSnapshot(pId) > 0 =>  proposalSnapshot(pId) <= proposalDeadline(pId))
        // (proposalSnapshot(pId) > 0 =>  proposalSnapshot(pId) <= proposalDeadline(pId))
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
 // Checked for castVote only. all 3 castVote functions call _castVote, so the completeness of the verification is counted on
 // the fact that the 3 functions themselves makes no changes, but rather call an internal function to execute.
 // That means that we do not check those 3 functions directly, however for castVote & castVoteWithReason it is quite trivial
 // to understand why this is ok. For castVoteBySig we basically assume that the signature referendum is correct without checking it.
 // We could check each function separately and pass the rule, but that would have uglyfied the code with no concrete
 // benefit, as it is evident that nothing is happening in the first 2 functions (calling a view function), and we do not desire to check the signature verification.
rule doubleVoting(uint256 pId, uint8 sup, method f) {
    env e;
    address user = e.msg.sender;
    bool votedCheck = hasVoted(e, pId, user);

    castVote@withrevert(e, pId, sup);

    assert votedCheck => lastReverted, "double voting occurred";
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
    uint256 _voteStart = proposalSnapshot(pId);
    uint256 _voteEnd = proposalDeadline(pId);

    require proposalCreated(pId); // startDate > 0

    env e; calldataarg arg;
    f(e, arg);

    uint256 voteStart_ = proposalSnapshot(pId);
    uint256 voteEnd_ = proposalDeadline(pId);
    assert _voteStart == voteStart_, "Start date was changed";
    assert _voteEnd == voteEnd_, "End date was changed";
}


/*
 * Voting cannot start at a block number prior to proposal’s creation block number
 */
rule noStartBeforeCreation(uint256 pId) {
    uint256 previousStart = proposalSnapshot(pId);
    // This line makes sure that we see only cases where start date is changed from 0, i.e. creation of proposal
    // We proved in immutableFieldsAfterProposalCreation that once dates set for proposal, it cannot be changed
    require !proposalCreated(pId); // previousStart == 0;

    env e; calldataarg args;
    propose(e, args);

    uint256 newStart = proposalSnapshot(pId);
    // if created, start is after current block number (creation block)
    assert(newStart != previousStart => newStart >= e.block.number);
}


//============================================
//--- End of Voting Period --> End of Time ---
//============================================


/*
 * A proposal can neither be executed nor canceled before it ends
 */
 // By induction it cannot be executed nor canceled before it starts, due to voteStartBeforeVoteEnd
rule noExecuteOrCancelBeforeDeadline(uint256 pId, method f){
    require !isExecuted(pId) && !isCanceled(pId);

    env e; calldataarg args;
    f(e, args);

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
 * All proposal specific (non-view) functions should revert if proposal is executed
 */
 // In this rule we show that if a function is executed, i.e. execute() was called on the proposal ID,
 // non of the proposal specific functions can make changes again. In executedOnlyAfterExecuteFunc
 // we connected the executed attribute to the execute() function, showing that only execute() can
 // change it, and that it will always change it.
rule allFunctionsRevertIfExecuted(method f) filtered { f ->
    !f.isView && !f.isFallback
      && f.selector != updateTimelock(address).selector
      && f.selector != updateQuorumNumerator(uint256).selector
      && f.selector != queue(address[],uint256[],bytes[],bytes32).selector
      && f.selector != relay(address,uint256,bytes).selector
      && f.selector != 0xb9a61961 // __acceptAdmin()
} {
    env e; calldataarg args;
    uint256 pId;
    require(isExecuted(pId));
    requireInvariant noBothExecutedAndCanceled(pId);
    requireInvariant executedImplyStartAndEndDateNonZero(pId);

    helperFunctionsWithRevert(pId, f, e);

    assert(lastReverted, "Function was not reverted");
}

/*
 * All proposal specific (non-view) functions should revert if proposal is canceled
 */
rule allFunctionsRevertIfCanceled(method f) filtered {
    f -> !f.isView && !f.isFallback
      && f.selector != updateTimelock(address).selector
      && f.selector != updateQuorumNumerator(uint256).selector
      && f.selector != queue(address[],uint256[],bytes[],bytes32).selector
      && f.selector != relay(address,uint256,bytes).selector
      && f.selector != 0xb9a61961 // __acceptAdmin()
} {
    env e; calldataarg args;
    uint256 pId;
    require(isCanceled(pId));
    requireInvariant noBothExecutedAndCanceled(pId);
    requireInvariant canceledImplyStartAndEndDateNonZero(pId);

    helperFunctionsWithRevert(pId, f, e);

    assert(lastReverted, "Function was not reverted");
}

/*
 * Proposal can be switched to executed only via execute() function
 */
rule executedOnlyAfterExecuteFunc(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash, method f) {
    env e; calldataarg args;
    uint256 pId;
    bool executedBefore = isExecuted(pId);
    require(!executedBefore);

    helperFunctionsWithRevert(pId, f, e);

    bool executedAfter = isExecuted(pId);
    assert(executedAfter != executedBefore => f.selector == execute(address[], uint256[], bytes[], bytes32).selector, "isExecuted only changes in the execute method");
}
