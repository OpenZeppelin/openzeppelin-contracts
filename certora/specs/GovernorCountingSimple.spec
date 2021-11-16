import "GovernorBase.spec"

methods {
    ghost_sum_vote_power_by_id(uint256) returns uint256 envfree
    // castVote(uint256, uint8) returns uint256
    // castVoteBySig(uint256,uint8,uint8,bytes32,bytes32) returns uint256
	
	snapshot(uint256) returns uint64 envfree
    quorum(uint256) returns uint256 envfree
    proposalVotes(uint256) returns (uint256, uint256, uint256) envfree

    quorumNumerator() returns uint256
    updateQuorumNumerator(uint256)
    _executor() returns address

    getVotes(address, uint256) returns uint256 envfree => DISPATCHER(true)
    //getVotes(address, uint256) => DISPATCHER(true)

    getPastTotalSupply(uint256) returns uint256 envfree => DISPATCHER(true)
    //getPastTotalSupply(uint256) => DISPATCHER(true)

    getPastVotes(address, uint256) returns uint256 envfree => DISPATCHER(true)
}

//////////////////////////////////////////////////////////////////////////////
///////////////////////////////// GHOSTS /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

ghost hasVoteGhost(uint256) returns uint256 {
    init_state axiom forall uint256 pId. hasVoteGhost(pId) == 0;
}

//hook Sstore _proposalVotes[KEY uint256 pId].hasVoted[KEY address user] bool current_voting_State (bool old_voting_state) STORAGE{
//    havoc hasVoteGhost assuming forall uint256 p. ((p == pId && current_voting_State && !old_voting_state) ? (hasVoteGhost@new(p) == hasVoteGhost@old(p) + 1)  :
//                                                  (hasVoteGhost@new(p) == hasVoteGhost@old(p)));
//}

ghost sum_all_votes_power() returns uint256 {
	init_state axiom sum_all_votes_power() == 0;
}

//hook Sstore ghost_sum_vote_power_by_id [KEY uint256 pId] uint256 current_power(uint256 old_power) STORAGE {
//	havoc sum_all_votes_power assuming sum_all_votes_power@new() == sum_all_votes_power@old() - old_power + current_power;
//}

ghost tracked_weight(uint256) returns uint256 {
	init_state axiom forall uint256 p. tracked_weight(p) == 0;
}
ghost sum_tracked_weight() returns uint256 {
	init_state axiom sum_tracked_weight() == 0;
}

ghost votesAgainst() returns uint256 {
    init_state axiom votesAgainst() == 0;
}

ghost votesFor() returns uint256 {
    init_state axiom votesFor() == 0;
}

ghost votesAbstain() returns uint256 {
    init_state axiom votesAbstain() == 0;
}

hook Sstore _proposalVotes [KEY uint256 pId].againstVotes uint256 votes(uint256 old_votes) STORAGE {
	havoc tracked_weight assuming forall uint256 p.(p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) &&
	                                            (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
	havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
    havoc votesAgainst assuming votesAgainst@new() == votesAgainst@old() - old_votes + votes;
}

hook Sstore _proposalVotes [KEY uint256 pId].forVotes uint256 votes(uint256 old_votes) STORAGE {
	havoc tracked_weight assuming forall uint256 p.(p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) &&
	                                            (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
	havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
    havoc votesFor assuming votesFor@new() == votesFor@old() - old_votes + votes;
}

hook Sstore _proposalVotes [KEY uint256 pId].abstainVotes uint256 votes(uint256 old_votes) STORAGE {
	havoc tracked_weight assuming forall uint256 p.(p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) &&
	                                            (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
	havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
    havoc votesAbstain assuming votesAbstain@new() == votesAbstain@old() - old_votes + votes;
}


ghost totalVotesPossible(uint256) returns uint256 {
	init_state axiom forall uint256 bn. totalVotesPossible(bn) == 0;
}

// Was done with _getVotes by mistake. Should check GovernorBasicHarness but _getVotes is from GovernorHarness
//hook Sstore _getVotes[KEY address uId][KEY uint256 blockNumber] uint256 voteWeight(uint256 old_voteWeight) STORAGE {
//	havoc totalVotesPossible assuming forall uint256 bn.
//	                                (bn == blockNumber => totalVotesPossible@new(bn) == totalVotesPossible@old(bn) - old_voteWeight + voteWeight)
//	                                && (bn != blockNumber => totalVotesPossible@new(bn) == totalVotesPossible@old(bn));
//    
//}



//////////////////////////////////////////////////////////////////////////////
////////////////////////////// INVARIANTS ////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


/*
 * sum of all votes casted is equal to the sum of voting power of those who voted, per each proposal
 */
invariant SumOfVotesCastEqualSumOfPowerOfVotedPerProposal(uint256 pId) 
	tracked_weight(pId) == ghost_sum_vote_power_by_id(pId)
		
/*
 * sum of all votes casted is equal to the sum of voting power of those who voted
 */
invariant SumOfVotesCastEqualSumOfPowerOfVoted() 
	sum_tracked_weight() == sum_all_votes_power()
		
/*
* totalVoted >= vote(id)
*/
invariant OneIsNotMoreThanAll(uint256 pId) 
	sum_all_votes_power() >= tracked_weight(pId)


//NEED GHOST FIX	
/*
* totalVotesPossible >= votePower(id)
*/
//invariant possibleTotalVotes(uint256 pId) 
//	tracked_weight(pId) <= totalVotesPossible(snapshot(pId))

/*
* totalVotesPossible >= votePower(id)
*/
// invariant possibleTotalVotes(uint pId)
//invariant trackedVsTotal(uint256 pId) 
//	tracked_weight(pId) <= possibleMaxOfVoters(pId)


/*
rule someOtherRuleToRemoveLater(uint256 num){
    env e; calldataarg args; method f;
    uint256 x = hasVoteGhost(num);
    f(e, args);
    assert(false);
}
*/

/*
 * Checks that only one user is updated in the system when calling cast vote functions (assuming hasVoted is changing correctly, false->true, with every vote cast)
 */
rule oneUserVotesInCast(uint256 pId, method f) filtered { f -> ((f.selector == castVote(uint256, uint8).selector) || 
                                                                f.selector == castVoteBySig(uint256, uint8, uint8, bytes32, bytes32).selector) }{
    env e; calldataarg args;
    uint256 ghost_Before = hasVoteGhost(pId);
    f(e, args);
    uint256 ghost_After = hasVoteGhost(pId);
    assert(ghost_After == ghost_Before + 1, "Raised by more than 1");
}

/*
 * Checks that in any call to cast vote functions only the sender's value is updated
 */
 /*
rule noVoteForSomeoneElse(uint256 pId, uint8 support){
    env e;
    address voter = e.msg.sender;
    bool hasVotedBefore = hasVoted(pId, voter);
    require(!hasVotedBefore);
    castVote(e, pId, support);
    bool hasVotedAfter = hasVoted(pId, voter);
    assert(hasVotedBefore != hasVotedAfter => forall address user. user != voter);
}
*/

// ok
rule votingWeightMonotonicity(method f){
    uint256 votingWeightBefore = sum_tracked_weight();

    env e; 
    calldataarg args;
    f(e, args);

    uint256 votingWeightAfter = sum_tracked_weight();

    assert votingWeightBefore <= votingWeightAfter, "Voting weight was decreased somehow";
}

// ok with this branch: thomas/bool-hook-values
// can't use link because contracts are abstract, they don't have bytecode/constructor
// add implementation harness
rule quorumMonotonicity(method f, uint256 blockNumber){
    uint256 quorumBefore = quorum(blockNumber);

    env e; 
    calldataarg args;
    f(e, args);

    uint256 quorumAfter = quorum(blockNumber);

    assert quorumBefore <= quorumAfter, "Quorum was decreased somehow";
}


function callFunctionWithParams(method f, uint256 proposalId, env e) {
    address[] targets;
    uint256[] values;
    bytes[] calldatas;
    bytes32 descriptionHash;
    uint8 support;
    uint8 v; bytes32 r; bytes32 s;
	if (f.selector == callPropose(address[], uint256[], bytes[]).selector) {
		uint256 result = callPropose(e, targets, values, calldatas);
        require result == proposalId;
	} else if (f.selector == execute(address[], uint256[], bytes[], bytes32).selector) {
        uint256 result = execute(e, targets, values, calldatas, descriptionHash);
        require result == proposalId;
	} else if (f.selector == castVote(uint256, uint8).selector) {
		castVote(e, proposalId, support);
	//} else if  (f.selector == castVoteWithReason(uint256, uint8, string).selector) {
	//	castVoteWithReason(e, proposalId, support, reason);
	} else if (f.selector == castVoteBySig(uint256, uint8,uint8, bytes32, bytes32).selector) {
		castVoteBySig(e, proposalId, support, v, r, s);
	} else {
		calldataarg args;
		f(e,args);
	}
}


// getVotes() returns different results.
// how to ensure that the same acc is used in getVotes() in uint256 votesBefore = getVotes(acc, bn);/uint256 votesAfter = getVotes(acc, bn); and in callFunctionWithParams
// votesBefore and votesAfter give different results but shoudn't

// are we assuming that a person with 0 votes can vote? are we assuming that a person may have 0 votes
// it seems like a weight can be 0. At least there is no check for it
// If it can be 0 then < should be changed to <= but it gives less coverage

// run on ALex's branch to avoid tiomeouts: --staging alex/external-timeout-for-solvers
// --staging shelly/forSasha
// implement ERC20Votes as a harness
rule hasVotedCorrelation(uint256 pId, method f, env e, uint256 bn) filtered {f -> f.selector != 0x7d5e81e2}{
    uint256 againstBefore = votesAgainst();
    uint256 forBefore = votesFor();
    uint256 abstainBefore = votesAbstain();
    //againstBefore, forBefore, abstainBefore = proposalVotes(pId);

    address acc = e.msg.sender;

    bool hasVotedBefore = hasVoted(e, pId, acc);
    uint256 votesBefore = getVotes(acc, bn);
    require votesBefore > 0;

    //calldataarg args;
    //f(e, args);
    callFunctionWithParams(f, pId, e);

    uint256 againstAfter = votesAgainst();
    uint256 forAfter = votesFor();
    uint256 abstainAfter = votesAbstain();
    //againstAfter, forAfter, abstainAfter = proposalVotes(pId);

    uint256 votesAfter = getVotes(acc, bn);
    bool hasVotedAfter = hasVoted(e, pId, acc);

    assert hasVotedBefore != hasVotedAfter => againstBefore < againstAfter || forBefore < forAfter || abstainBefore < abstainAfter, "no correlation";
}


/*
* Check privileged operations
*/
// NO NEED FOR SPECIFIC CHANGES
// how to check executor()?
// to make it public instead of internal is not best idea, I think.
// currentContract gives a violation in 
rule privilegedOnly(method f){
    env e;
    calldataarg arg;
    uint256 quorumNumBefore = quorumNumerator(e);

    f(e, arg);

    uint256 quorumNumAfter = quorumNumerator(e);

    address executorCheck = currentContract;
    // address executorCheck = _executor(e);

    assert quorumNumBefore != quorumNumAfter => e.msg.sender == executorCheck, "non priveleged user changed quorum numerator";
}