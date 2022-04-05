import "GovernorBase.spec"

using ERC20VotesHarness as erc20votes

methods {
    ghost_sum_vote_power_by_id(uint256) returns uint256 envfree

    quorum(uint256) returns uint256
    proposalVotes(uint256) returns (uint256, uint256, uint256) envfree

    quorumNumerator() returns uint256
    _executor() returns address

    erc20votes._getPastVotes(address, uint256) returns uint256

    getExecutor() returns address

    timelock() returns address
}


//////////////////////////////////////////////////////////////////////////////
///////////////////////////////// GHOSTS /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


//////////// ghosts to keep track of votes counting ////////////

/*
 * the sum of voting power of those who voted
 */
ghost sum_all_votes_power() returns uint256 {
	init_state axiom sum_all_votes_power() == 0;
}

hook Sstore ghost_sum_vote_power_by_id [KEY uint256 pId] uint256 current_power(uint256 old_power) STORAGE {
	havoc sum_all_votes_power assuming sum_all_votes_power@new() == sum_all_votes_power@old() - old_power + current_power;
}

/*
 * sum of all votes casted per proposal
 */
ghost tracked_weight(uint256) returns uint256 {
	init_state axiom forall uint256 p. tracked_weight(p) == 0;
}

/*
 * sum of all votes casted
 */
ghost sum_tracked_weight() returns uint256 {
	init_state axiom sum_tracked_weight() == 0;
}

/*
 * getter for _proposalVotes.againstVotes
 */
ghost votesAgainst() returns uint256 {
    init_state axiom votesAgainst() == 0;
}

/*
 * getter for _proposalVotes.forVotes
 */
ghost votesFor() returns uint256 {
    init_state axiom votesFor() == 0;
}

/*
 * getter for _proposalVotes.abstainVotes
 */
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
* sum of all votes casted is greater or equal to the sum of voting power of those who voted at a specific proposal
*/
invariant OneIsNotMoreThanAll(uint256 pId) 
	sum_all_votes_power() >= tracked_weight(pId)


//////////////////////////////////////////////////////////////////////////////
///////////////////////////////// RULES //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


/*
 * Only sender's voting status can be changed by execution of any cast vote function
 */
// Checked for castVote only. all 3 castVote functions call _castVote, so the completeness of the verification is counted on
 // the fact that the 3 functions themselves makes no changes, but rather call an internal function to execute.
 // That means that we do not check those 3 functions directly, however for castVote & castVoteWithReason it is quite trivial
 // to understand why this is ok. For castVoteBySig we basically assume that the signature referendum is correct without checking it.
 // We could check each function separately and pass the rule, but that would have uglyfied the code with no concrete 
 // benefit, as it is evident that nothing is happening in the first 2 functions (calling a view function), and we do not desire to check the signature verification.
rule noVoteForSomeoneElse(uint256 pId, uint8 sup, method f) {
    env e; calldataarg args;

    address voter = e.msg.sender;
    address user;

    bool hasVotedBefore_User = hasVoted(e, pId, user);

    castVote@withrevert(e, pId, sup);
    require(!lastReverted);

    bool hasVotedAfter_User = hasVoted(e, pId, user);

    assert user != voter => hasVotedBefore_User == hasVotedAfter_User;
}


/*
* Total voting tally is monotonically non-decreasing in every operation 
*/
rule votingWeightMonotonicity(method f){
    uint256 votingWeightBefore = sum_tracked_weight();

    env e; 
    calldataarg args;
    f(e, args);

    uint256 votingWeightAfter = sum_tracked_weight();

    assert votingWeightBefore <= votingWeightAfter, "Voting weight was decreased somehow";
}


/*
* A change in hasVoted must be correlated with an non-decreasing of the vote supports (nondecrease because user can vote with weight 0)
*/
rule hasVotedCorrelation(uint256 pId, method f, env e, uint256 bn) {
    address acc = e.msg.sender;
    
    uint256 againstBefore = votesAgainst();
    uint256 forBefore = votesFor();
    uint256 abstainBefore = votesAbstain();

    bool hasVotedBefore = hasVoted(e, pId, acc);

    helperFunctionsWithRevert(pId, f, e);
    require(!lastReverted);

    uint256 againstAfter = votesAgainst();
    uint256 forAfter = votesFor();
    uint256 abstainAfter = votesAbstain();
    
    bool hasVotedAfter = hasVoted(e, pId, acc);

    assert (!hasVotedBefore && hasVotedAfter) => againstBefore <= againstAfter || forBefore <= forAfter || abstainBefore <= abstainAfter, "no correlation";
}


/*
* Only privileged users can execute privileged operations, e.g. change _quorumNumerator or _timelock
*/
rule privilegedOnlyNumerator(method f, uint256 newQuorumNumerator){
    env e;
    calldataarg arg;
    uint256 quorumNumBefore = quorumNumerator(e);

    f(e, arg);

    uint256 quorumNumAfter = quorumNumerator(e);
    address executorCheck = getExecutor(e);

    assert quorumNumBefore != quorumNumAfter => e.msg.sender == executorCheck, "non privileged user changed quorum numerator";
}

rule privilegedOnlyTimelock(method f, uint256 newQuorumNumerator){
    env e;
    calldataarg arg;
    uint256 timelockBefore = timelock(e);

    f(e, arg);

    uint256 timelockAfter = timelock(e);

    assert timelockBefore != timelockAfter => e.msg.sender == timelockBefore, "non privileged user changed timelock";
}
