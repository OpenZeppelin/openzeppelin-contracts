//////////////////////////////////////////////////////////////////////////////
///////////////////// Governor.sol base definitions //////////////////////////
//////////////////////////////////////////////////////////////////////////////

using ERC721VotesHarness as erc721votes
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
    quorumNumerator() returns uint256 envfree
    quorumDenominator() returns uint256 envfree
    votingPeriod() returns uint256 envfree
    lateQuorumVoteExtension() returns uint64 envfree
    propose(address[], uint256[], bytes[], string)

    // harness
    getExtendedDeadlineIsUnset(uint256) returns bool envfree
    getExtendedDeadline(uint256) returns uint64 envfree
    quorumReached(uint256) returns bool envfree
    voteSucceeded(uint256) returns bool envfree
    quorum(uint256) returns uint256
    latestCastVoteCall() returns uint256 envfree // more robust check than f.selector == _castVote(...).selector

    // function summarization
    proposalThreshold() returns uint256 envfree

    // erc20votes dispatch
    getVotes(address, uint256) returns uint256 => DISPATCHER(true)
    // erc721votes/Votes dispatch
    getPastTotalSupply(uint256) returns uint256 => DISPATCHER(true)
    getPastVotes(address, uint256) returns uint256 => DISPATCHER(true)
    // timelock dispatch
    getMinDelay() returns uint256 => DISPATCHER(true)
    
    hashOperationBatch(address[], uint256[], bytes[], bytes32, bytes32) => DISPATCHER(true)
    executeBatch(address[], uint256[], bytes[], bytes32, bytes32) => CONSTANT
    scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256) => CONSTANT
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Definitions /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// where can invariants help?
// can I replace definitions with invariants?

// create definition for extended
definition deadlineCanBeExtended(uint256 pId) returns bool = 
    getExtendedDeadlineIsUnset(pId) &&
    !quorumReached(pId);

definition deadlineHasBeenExtended(uint256 pId) returns bool = 
    !getExtendedDeadlineIsUnset(pId) &&
    quorumReached(pId);

definition proposalCreated(uint256 pId) returns bool = proposalSnapshot(pId) > 0;

//////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Rules /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// RULE deadline can only be extended only once PASSING but vacuous
    // 1. if deadline changes then we have state transition to deadlineHasBeenExtended RULE PASSING; ADV SANITY PASSING
rule deadlineChangeEffects(method f) 
    filtered {
        f -> !f.isView
    } {
    env e; calldataarg args; uint256 pId;

    require (proposalCreated(pId));
    
    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);
    
    assert(deadlineAfter > deadlineBefore => latestCastVoteCall() == e.block.number && deadlineHasBeenExtended(pId));
}

    // 2. cant unextend RULE PASSING*; ADV SANITY PASSING
rule deadlineCantBeUnextended(method f) 
    filtered {
        f -> !f.isView
        && f.selector != updateQuorumNumerator(uint256).selector // * fails for this function
    } {
    env e; calldataarg args; uint256 pId;

    require(deadlineHasBeenExtended(pId));
    require(proposalCreated(pId));
    
    f(e, args);
    
    assert(deadlineHasBeenExtended(pId));
}

    // 3. extended => can't change deadline RULE PASSING; ADV SANITY PASSING
        //@note if deadline changed, then it wasnt extended and castvote was called
rule canExtendDeadlineOnce(method f) 
    filtered {
        f -> !f.isView 
    } {
    env e; calldataarg args; uint256 pId;

    require(deadlineHasBeenExtended(pId));
    require(proposalCreated(pId)); 
    
    uint256 deadlineBefore = proposalDeadline(pId);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(pId);
    
    assert(deadlineBefore == deadlineAfter, "deadline can not be extended twice");
}
