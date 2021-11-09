//////////////////////////////////////////////////////////////////////////////
///////////////////// Governor.sol base definitions //////////////////////////
//////////////////////////////////////////////////////////////////////////////
methods {
    proposalSnapshot(uint256) returns uint256 envfree // matches proposalVoteStart
    proposalDeadline(uint256) returns uint256 envfree
    hashProposal(address[],uint256[],bytes[],bytes32) returns uint256 envfree
    isExecuted(uint256) returns bool envfree
    isCanceled(uint256) returns bool envfree
    // initialized(uint256) returns bool envfree

    hasVoted(uint256, address) returns bool

    castVote(uint256, uint8) returns uint256

    // internal functions made public in harness:
    _quorumReached(uint256) returns bool envfree
    _voteSucceeded(uint256) returns bool envfree

    // getter for checking the sums
    ghost_sum_vote_power_by_id(uint256) returns uint256 envfree
}

//////////////////////////////////////////////////////////////////////////////
///////////////////////////////// GHOSTS /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

ghost sum_all_votes_power() returns uint256 {
    init_state axiom sum_all_votes_power() == 0;
}

hook Sstore ghost_sum_vote_power_by_id[KEY uint256 pId] uint256 current_power (uint256 old_power) STORAGE{
    havoc sum_all_votes_power assuming sum_all_votes_power@new() == sum_all_votes_power@old() - old_power + current_power;
}

ghost tracked_weight(uint256) returns uint256 {
    init_state axiom forall uint256 p. tracked_weight(p) == 0;
}
ghost sum_tracked_weight() returns uint256 {
    init_state axiom sum_tracked_weight() == 0;
}

/*
function update_tracked_weights(uint256 pId, uint256 votes, uint256 old_votes) {
    havoc tracked_weight assuming forall uint256 p. (p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) && 
                                                    (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
    havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
}*/

hook Sstore _proposalVotes[KEY uint256 pId].againstVotes uint256 votes (uint256 old_votes) STORAGE {
    //update_tracked_weights(pId, votes, old_votes);
    havoc tracked_weight assuming forall uint256 p. (p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) && 
                                                    (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
    havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
}

hook Sstore _proposalVotes[KEY uint256 pId].forVotes uint256 votes (uint256 old_votes) STORAGE {
    //update_tracked_weights(pId, votes, old_votes);
    havoc tracked_weight assuming forall uint256 p. (p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) && 
                                                    (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
    havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
}

hook Sstore _proposalVotes[KEY uint256 pId].abstainVotes uint256 votes (uint256 old_votes) STORAGE {
    //update_tracked_weights(pId, votes, old_votes);
    havoc tracked_weight assuming forall uint256 p. (p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) && 
                                                    (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
    havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
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

