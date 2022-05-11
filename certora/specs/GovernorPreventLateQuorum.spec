//////////////////////////////////////////////////////////////////////////////
///////////////////// Governor.sol base definitions //////////////////////////
//////////////////////////////////////////////////////////////////////////////

using ERC721VotesHarness as erc20votes

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

    // harness
    getExtendedDeadlineIsUnset(uint256) returns bool envfree
    getExtendedDeadline(uint256) returns uint64 envfree
    quorumReached(uint256) returns bool envfree
    latestCastVoteCall() returns uint256 envfree // more robust check than f.selector == _castVote(...).selector

    // function summarization
    proposalThreshold() returns uint256 envfree

    getVotes(address, uint256) returns uint256 => DISPATCHER(true)

    getPastTotalSupply(uint256 t) returns uint256      => PER_CALLEE_CONSTANT
    getPastVotes(address a, uint256 t) returns uint256 => PER_CALLEE_CONSTANT
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Definitions /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// create definition for extended
definition deadlineCanBeExtended(uint256 id) returns bool = 
    getExtendedDeadlineIsUnset(id) &&
    getExtendedDeadline(id) == 0 && 
    !quorumReached(id);

definition deadlineHasBeenExtended(uint256 id) returns bool = 
    !getExtendedDeadlineIsUnset(id) &&
    getExtendedDeadline(id) > 0 &&
    quorumReached(id);



// RULE deadline can only be extended once
    // 1. if deadline changes then we have state transition from deadlineCanBeExtended to deadlineHasBeenExtended
rule deadlineChangeEffects(method f) filtered {f -> !f.isView /* bottleneck, restrict for faster testing && f.selector != propose(address[], uint256[], bytes[], string).selector*/ } {
    env e; calldataarg args; uint256 id;

    require (latestCastVoteCall() < e.block.number);
    require (quorumNumerator() <= quorumDenominator());
    require deadlineCanBeExtended(id);
    require (proposalDeadline(id) < e.block.number 
    && proposalDeadline(id) >= proposalSnapshot(id) + votingPeriod() 
    && proposalSnapshot(id) > e.block.number); 
    
    uint256 deadlineBefore = proposalDeadline(id);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(id);
    
    assert(deadlineAfter > deadlineBefore => latestCastVoteCall() == e.block.number && deadlineHasBeenExtended(id));
}

    // 2. cant unextend
rule deadlineCantBeUnextended(method f) filtered {f -> !f.isView /* && f.selector != propose(address[], uint256[], bytes[], string).selector*/ } {
    env e; calldataarg args; uint256 id;
    require(deadlineHasBeenExtended(id));
    f(e, args);
    assert(deadlineHasBeenExtended(id));
}

    // 3. extended => can't change deadline
        //@note if deadline changed, then it wasnt extended and castvote was called
rule canExtendDeadlineOnce(method f) filtered {f -> !f.isView /* && f.selector != propose(address[], uint256[], bytes[], string).selector*/ } {
    env e; calldataarg args;
    uint256 id;
    require(deadlineHasBeenExtended(id)); // stays true
    require (proposalDeadline(id) < e.block.number 
    && proposalDeadline(id) >= proposalSnapshot(id) + votingPeriod() 
    && proposalSnapshot(id) > e.block.number); 
    uint256 deadlineBefore = proposalDeadline(id);
    f(e, args);
    uint256 deadlineAfter = proposalDeadline(id);
    assert(deadlineBefore == deadlineAfter, "deadline can not be extended twice");
}


// RULE deadline can only extended if quorum reached w/ <= timeOfExtension left to vote
// 3 rules
    // 1. voting increases total votes
    // 2. number of votes > quorum => quorum reached
    // 3. deadline can only extended if quorum reached w/ <= timeOfExtension left to vote
rule deadlineCanOnlyBeExtenededIfQuorumReached() {
    env e; method f; calldataarg args;
    uint256 id;
    require(getExtendedDeadlineIsUnset(id));
    f(e, args);
    assert(false);
}

// RULE extendedDeadline is used iff quorum is reached w/ <= extensionTime left to vote

// RULE extendedDeadlineField is set iff quroum is reached 

// RULE if the deadline/extendedDeadline has not been reached, you can still vote (base)