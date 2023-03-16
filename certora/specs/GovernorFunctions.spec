import "helpers.spec"
import "Governor.helpers.spec"

use invariant queuedImplyVoteOver

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: propose effect and liveness. Includes "no double proposition"                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule propose_liveness(uint256 pId, env e) {
    require nonpayable(e);
    require clockSanity(e);

    uint8 stateBefore = state(e, pId);

    address[] targets; uint256[] values; bytes[] calldatas; string descr;
    require pId == hashProposal(targets, values, calldatas, descr);
    //require validString(descr);

    propose@withrevert(e, targets, values, calldatas, descr);

    // liveness & double proposal
    assert !lastReverted <=> (
        stateBefore == UNSET() &&
        validProposal(targets, values, calldatas)
    );
}

rule propose_effect(uint256 pId, env e) {
    address[] targets; uint256[] values; bytes[] calldatas; string descr;
    require pId == hashProposal(targets, values, calldatas, descr);

    propose(e, targets, values, calldatas, descr);

    // effect
    assert state(e, pId)         == PENDING();
    assert proposalProposer(pId) == e.msg.sender;
    assert proposalSnapshot(pId) == clock(e) + votingDelay();
    assert proposalDeadline(pId) == clock(e) + votingDelay() + votingPeriod();
}

rule propose_sideeffect(uint256 pId, env e, uint256 otherId) {
    uint8   otherStateBefore = state(e, otherId);
    uint256 otherVoteStart   = proposalSnapshot(otherId);
    uint256 otherVoteEnd     = proposalDeadline(otherId);
    address otherProposer    = proposalProposer(otherId);

    address[] targets; uint256[] values; bytes[] calldatas; string descr;
    require pId == hashProposal(targets, values, calldatas, descr);

    propose(e, targets, values, calldatas, descr);

    // no side-effect
    assert state(e, otherId)         != otherStateBefore => otherId == pId;
    assert proposalSnapshot(otherId) == otherVoteStart;
    assert proposalDeadline(otherId) == otherVoteEnd;
    assert proposalProposer(otherId) == otherProposer;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: votes effect and liveness. Includes "A user cannot vote twice"                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule castVote_liveness(uint256 pId, env e, method f)
    filtered { f -> voting(f) }
{
    require nonpayable(e);
    require clockSanity(e);

    uint8   support;
    address voter;

    uint8   stateBefore    = state(e, pId);
    bool    hasVotedBefore = hasVoted(pId, voter);
    uint256 voterWeight    = token_getPastVotes(voter, proposalSnapshot(pId));

    // voting weight overflow check
    require getAgainstVotes(pId) + voterWeight <= max_uint256;
    require getForVotes(pId)     + voterWeight <= max_uint256;
    require getAbstainVotes(pId) + voterWeight <= max_uint256;

    helperVoteWithRevert(e, f, pId, voter, support);

    assert !lastReverted <=> (
        stateBefore == ACTIVE() &&
        !hasVotedBefore &&
        (support == 0 || support == 1 || support == 2)
    );
}

rule castVote_effect(uint256 pId, env e, method f)
    filtered { f -> voting(f) }
{
    uint8   support;
    address voter;

    uint256 againstVotesBefore = getAgainstVotes(pId);
    uint256 forVotesBefore     = getForVotes(pId);
    uint256 abstainVotesBefore = getAbstainVotes(pId);
    uint256 voterWeight        = token_getPastVotes(voter, proposalSnapshot(pId));

    uint256 weight = helperVoteWithRevert(e, f, pId, voter, support);
    require !lastReverted;

    assert state(e, pId)        == ACTIVE();
    assert voterWeight          == weight;
    assert getAgainstVotes(pId) == againstVotesBefore + (support == 0 ? weight : 0);
    assert getForVotes(pId)     == forVotesBefore     + (support == 1 ? weight : 0);
    assert getAbstainVotes(pId) == abstainVotesBefore + (support == 2 ? weight : 0);
    assert hasVoted(pId, voter);
}

rule castVote_sideeffect(uint256 pId, env e, method f)
    filtered { f -> voting(f) }
{
    uint8   support;
    address voter;
    address otherVoter;
    uint256 otherId;

    bool    otherVotedBefore        = hasVoted(otherId, otherVoter);
    uint256 otherAgainstVotesBefore = getAgainstVotes(otherId);
    uint256 otherForVotesBefore     = getForVotes(otherId);
    uint256 otherAbstainVotesBefore = getAbstainVotes(otherId);

    helperVoteWithRevert(e, f, pId, voter, support);
    require !lastReverted;

    // no side-effect
    assert hasVoted(otherId, otherVoter) != otherVotedBefore        => (otherId == pId && otherVoter == voter);
    assert getAgainstVotes(otherId)      != otherAgainstVotesBefore => (otherId == pId);
    assert getForVotes(otherId)          != otherForVotesBefore     => (otherId == pId);
    assert getAbstainVotes(otherId)      != otherAbstainVotesBefore => (otherId == pId);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: queue effect and liveness.                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule queue_liveness(uint256 pId, env e) {
    require nonpayable(e);
    require clockSanity(e);

    uint8 stateBefore = state(e, pId);

    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    queue@withrevert(e, targets, values, calldatas, descrHash);

    // liveness
    assert !lastReverted <=> stateBefore == SUCCEEDED();
}

rule queue_effect(uint256 pId, env e) {
    uint8 stateBefore  = state(e, pId);
    bool  queuedBefore = isQueued(pId);

    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    queue(e, targets, values, calldatas, descrHash);

    assert state(e, pId) == QUEUED();
    assert isQueued(pId);
    assert !queuedBefore;
}

rule queue_sideeffect(uint256 pId, env e, uint256 otherId) {
    uint8 otherStateBefore  = state(e, otherId);
    bool  otherQueuedBefore = isQueued(otherId);

    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    queue(e, targets, values, calldatas, descrHash);

    // no side-effect
    assert state(e, otherId) != otherStateBefore  => otherId == pId;
    assert isQueued(otherId) != otherQueuedBefore => otherId == pId;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: execute effect and liveness.                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule execute_liveness(uint256 pId, env e) {
    require nonpayable(e);
    require clockSanity(e);

    uint8 stateBefore = state(e, pId);

    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    execute@withrevert(e, targets, values, calldatas, descrHash);

    // liveness: can't check full equivalence because of execution call reverts
    assert !lastReverted => (stateBefore == SUCCEEDED() || stateBefore == QUEUED());
}

rule execute_effect(uint256 pId, env e) {
    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    execute(e, targets, values, calldatas, descrHash);

    // effect
    assert state(e, pId) == EXECUTED();
}

rule execute_sideeffect(uint256 pId, env e, uint256 otherId) {
    uint8 otherStateBefore = state(e, otherId);

    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    execute(e, targets, values, calldatas, descrHash);

    // no side-effect
    assert state(e, otherId) != otherStateBefore => otherId == pId;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: cancel (public) effect and liveness.                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cancel_liveness(uint256 pId, env e) {
    require nonpayable(e);
    require clockSanity(e);
    requireInvariant queuedImplyVoteOver(pId);

    uint8 stateBefore = state(e, pId);

    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    cancel@withrevert(e, targets, values, calldatas, descrHash);

    // liveness
    assert !lastReverted <=> (
        stateBefore == PENDING() &&
        e.msg.sender == proposalProposer(pId)
    );
}

rule cancel_effect(uint256 pId, env e) {
    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    cancel(e, targets, values, calldatas, descrHash);

    // effect
    assert state(e, pId) == CANCELED();
    assert !isQueued(pId); // cancel resets timelockId
}

rule cancel_sideeffect(uint256 pId, env e, uint256 otherId) {
    uint8 otherStateBefore  = state(e, otherId);
    bool  otherQueuedBefore = isQueued(otherId);

    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    cancel(e, targets, values, calldatas, descrHash);

    // no side-effect
    assert state(e, otherId) != otherStateBefore  => otherId == pId;
    assert isQueued(otherId) != otherQueuedBefore => otherId == pId;
}
