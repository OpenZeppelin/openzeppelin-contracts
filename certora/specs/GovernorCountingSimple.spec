import "GovernorBase.spec"

methods {
    ghost_sum_vote_power_by_id(uint256) returns uint256 envfree
    // castVote(uint256, uint8) returns uint256
    // castVoteBySig(uint256,uint8,uint8,bytes32,bytes32) returns uint256
    //_getVotes(address, uint256) returns uint256
}

//////////////////////////////////////////////////////////////////////////////
///////////////////////////////// GHOSTS /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

ghost hasVoteGhost(uint256) returns uint256 {
    init_state axiom forall uint256 pId. hasVoteGhost(pId) == 0;
}

hook Sstore _proposalVotes[KEY uint256 pId].hasVoted[KEY address user] bool current_voting_State (bool old_voting_state) STORAGE{
    havoc hasVoteGhost assuming forall uint256 p. ((p == pId && current_voting_State && !old_voting_state) ? (hasVoteGhost@new(p) == hasVoteGhost@old(p) + 1)  :
                                                  (hasVoteGhost@new(p) == hasVoteGhost@old(p)));
}

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

hook Sstore _proposalVotes[KEY uint256 pId].againstVotes uint256 votes (uint256 old_votes) STORAGE {
    havoc tracked_weight assuming forall uint256 p. (p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) && 
                                                    (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
    havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
}

hook Sstore _proposalVotes[KEY uint256 pId].forVotes uint256 votes (uint256 old_votes) STORAGE {
    havoc tracked_weight assuming forall uint256 p. (p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) && 
                                                    (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
    havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
}

hook Sstore _proposalVotes[KEY uint256 pId].abstainVotes uint256 votes (uint256 old_votes) STORAGE {
    havoc tracked_weight assuming forall uint256 p. (p == pId => tracked_weight@new(p) == tracked_weight@old(p) - old_votes + votes) && 
                                                    (p != pId => tracked_weight@new(p) == tracked_weight@old(p));
    havoc sum_tracked_weight assuming sum_tracked_weight@new() == sum_tracked_weight@old() - old_votes + votes;
}

/*
ghost totalVotesPossible() returns uint256{
    init_state axiom totalVotesPossible() == 0;
}

hook Sstore _getVotes[KEY address pId][KEY uint256 blockNumber] uint256 voteWeight (uint old_voteWeight) STORAGE
*/
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
// invariant SumOfVotesCastEqualSumOfPowerOfVoted()
//         sum_tracked_weight() == sum_all_votes_power()

/*
* totalVoted >= vote(id)
*/
invariant OneIsNotMoreThanAll(uint256 pId)
        sum_all_votes_power() >= tracked_weight(pId)

/*
* totalVotesPossible (supply/weight) >= votePower(id)
*/
// invariant possibleTotalVotes(uint pId)

/*
rule someOtherRuleToRemoveLater(uint256 num){
    env e; calldataarg args; method f;
    uint256 x = hasVoteGhost(num);
    f(e, args);
    assert(false);
}
*/


rule oneUserVotesInCast(uint256 pId, method f) filtered { f -> ((f.selector == castVote(uint256, uint8).selector) || 
                                                                f.selector == castVoteBySig(uint256, uint8, uint8, bytes32, bytes32).selector) }{
    env e; calldataarg args;
    uint256 ghost_Before = hasVoteGhost(pId);
    f(e, args);
    uint256 ghost_After = hasVoteGhost(pId);
    assert(ghost_After == ghost_Before + 1, "Raised by more than 1");
}


rule noVoteForSomeoneElse(uint256 pId, uint8 support){
    env e;
    uint256 voter = e.msg.sender;
    castVote(e, pId, support);

}