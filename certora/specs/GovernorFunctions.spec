import "helpers.spec"
import "methods/IGovernor.spec"
import "Governor.helpers.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: propose effect and liveness. Includes "no double proposition"                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule propose(uint256 pId, env e) {
    require nonpayable(e);

    uint256 otherId;

    uint8   stateBefore      = state(e, pId);
    uint8   otherStateBefore = state(e, otherId);
    uint256 otherVoteStart   = proposalSnapshot(otherId);
    uint256 otherVoteEnd     = proposalDeadline(otherId);
    address otherProposer    = proposalProposer(otherId);

    address[] targets; uint256[] values; bytes[] calldatas; string reason;
    require pId == propose@withrevert(e, targets, values, calldatas, reason);
    bool success = !lastReverted;

    // liveness & double proposal
    assert success <=> stateBefore == UNSET();

    // effect
    assert success => (
        state(e, pId)         == PENDING()    &&
        proposalProposer(pId) == e.msg.sender &&
        proposalSnapshot(pId) == clock(e) + votingDelay() &&
        proposalDeadline(pId) == clock(e) + votingDelay() + votingPeriod()
    );

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
rule castVote(uint256 pId, env e, method f)
    filtered { f -> voting(f) }
{
    require nonpayable(e);

    uint8   support;
    address voter;
    address otherVoter;
    uint256 otherId;

    uint8   stateBefore             = state(e, pId);
    bool    hasVotedBefore          = hasVoted(pId, voter);
    bool    otherVotedBefore        = hasVoted(otherId, otherVoter);
    uint256 againstVotesBefore      = getAgainstVotes(pId);
    uint256 forVotesBefore          = getForVotes(pId);
    uint256 abstainVotesBefore      = getAbstainVotes(pId);
    uint256 otherAgainstVotesBefore = getAgainstVotes(otherId);
    uint256 otherForVotesBefore     = getForVotes(otherId);
    uint256 otherAbstainVotesBefore = getAbstainVotes(otherId);

    // voting weight overflow check
    uint256 voterWeight = token_getPastVotes(voter, proposalSnapshot(pId));
    require againstVotesBefore + voterWeight <= max_uint256;
    require forVotesBefore     + voterWeight <= max_uint256;
    require abstainVotesBefore + voterWeight <= max_uint256;

    uint256 weight = helperVoteWithRevert(e, f, pId, voter, support);
    bool success = !lastReverted;

    assert success <=> (
        stateBefore == ACTIVE() &&
        !hasVotedBefore &&
        (support == 0 || support == 1 || support == 2)
    );

    assert success => (
        state(e, pId)        == ACTIVE() &&
        voterWeight          == weight &&
        getAgainstVotes(pId) == againstVotesBefore + (support == 0 ? weight : 0) &&
        getForVotes(pId)     == forVotesBefore     + (support == 1 ? weight : 0) &&
        getAbstainVotes(pId) == abstainVotesBefore + (support == 2 ? weight : 0) &&
        hasVoted(pId, voter)
    );

    // no side-effect
    assert hasVoted(otherId, otherVoter) != otherVotedBefore        => (otherId == pId && otherVoter == voter);
    assert getAgainstVotes(otherId)      != otherAgainstVotesBefore => (otherId == pId);
    assert getForVotes(otherId)          != otherForVotesBefore     => (otherId == pId);
    assert getAbstainVotes(otherId)      != otherAbstainVotesBefore => (otherId == pId);
}


rule queue(uint256 pId, env e) {
    require nonpayable(e);

    uint256 otherId;

    uint8 stateBefore      = state(e, pId);
    uint8 otherStateBefore = state(e, otherId);

    address[] targets; uint256[] values; bytes[] calldatas; string reason;
    require pId == queue@withrevert(e, targets, values, calldatas, reason);
    bool success = !lastReverted;

    // liveness
    assert success <=> stateBefore == SUCCEEDED();

    // effect
    assert success => (
        state(e, pId) == QUEUED()
    );

    // no side-effect
    assert state(e, otherId) != otherStateBefore => otherId == pId;
}

rule execute(uint256 pId, env e) {
    require nonpayable(e);

    uint256 otherId;

    uint8 stateBefore      = state(e, pId);
    uint8 otherStateBefore = state(e, otherId);

    address[] targets; uint256[] values; bytes[] calldatas; string reason;
    require pId == execute@withrevert(e, targets, values, calldatas, reason);
    bool success = !lastReverted;

    // liveness: can't check full equivalence because of execution call reverts
    assert success => (stateBefore == SUCCEEDED() || stateBefore == QUEUED());

    // effect
    assert success => (
        state(e, pId) == EXECUTED()
    );

    // no side-effect
    assert state(e, otherId) != otherStateBefore => otherId == pId;
}

rule cancel(uint256 pId, env e) {
    require nonpayable(e);

    uint256 otherId;

    uint8 stateBefore      = state(e, pId);
    uint8 otherStateBefore = state(e, otherId);

    address[] targets; uint256[] values; bytes[] calldatas; string reason;
    require pId == cancel@withrevert(e, targets, values, calldatas, reason);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        stateBefore == PENDING() &&
        e.msg.sender == proposalProposer(pId)
    );

    // effect
    assert success => (
        state(e, pId) == CANCELED()
    );

    // no side-effect
    assert state(e, otherId) != otherStateBefore => otherId == pId;
}