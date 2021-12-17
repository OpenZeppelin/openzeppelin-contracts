//////////////////////////////////////////////////////////////////////////////
////////////// THIS SPEC IS A RESERVE FOR NOT IN PROGRESS //////////////
//////////////////////////////////////////////////////////////////////////////

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



//////////////////////////////////////////////////////////////////////////////
///////////////////////////////// RULES //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


//NOT FINISHED
/*
* the sum of voting power of those who voted is less or equal to the maximum possible votes, per each proposal
*/
rule possibleTotalVotes(uint256 pId, uint8 sup, env e, method f) {

    // add requireinvariant  for all i, j. i = i - 1 && i < j => checkpointlookup[i] < checkpointlookup[j];
    require tracked_weight(pId) <= erc20votes.getPastTotalSupply(e, proposalSnapshot(pId));

    uint256 againstB;
    uint256 forB;
    uint256 absatinB;
    againstB, forB, absatinB = proposalVotes(pId);

    calldataarg args;
    //f(e, args);

    castVote(e, pId, sup);

    uint256 against;
    uint256 for;
    uint256 absatin;
    against, for, absatin = proposalVotes(pId);

    uint256 ps = proposalSnapshot(pId);

    assert tracked_weight(pId) <= erc20votes.getPastTotalSupply(e, proposalSnapshot(pId)), "bla bla bla";
}