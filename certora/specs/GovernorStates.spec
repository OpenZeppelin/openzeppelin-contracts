import "helpers.spec"
import "methods/IGovernor.spec"
import "Governor.helpers.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: state returns one of the value in the enumeration                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateConsistency(env e, uint256 pId) {
    uint8 result = state(e, pId);
    assert (
        result == PENDING()   ||
        result == ACTIVE()    ||
        result == CANCELED()  ||
        result == DEFEATED()  ||
        result == SUCCEEDED() ||
        result == QUEUED()    ||
        result == EXECUTED()
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: State transition                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateTransitionFn(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> !skip(f) }
{
    require clock(e) > 0; // Sanity

    uint8 stateBefore = state(e, pId);
    f(e, args);
    uint8 stateAfter  = state(e, pId);

    assert (stateBefore != stateAfter) => (
        stateBefore == UNSET() => (
            stateAfter == PENDING() && f.selector == propose(address[],uint256[],bytes[],string).selector
        ) &&
        stateBefore == PENDING() => (
            (stateAfter == CANCELED() && f.selector == cancel(address[],uint256[],bytes[],bytes32).selector)
        ) &&
        stateBefore == SUCCEEDED() => (
            (stateAfter == QUEUED()   && f.selector == queue(address[],uint256[],bytes[],bytes32).selector) ||
            (stateAfter == EXECUTED() && f.selector == execute(address[],uint256[],bytes[],bytes32).selector)
        ) &&
        stateBefore == QUEUED() => (
            (stateAfter == EXECUTED() && f.selector == execute(address[],uint256[],bytes[],bytes32).selector)
        ) &&
        stateBefore == ACTIVE()    => false &&
        stateBefore == CANCELED()  => false &&
        stateBefore == DEFEATED()  => false &&
        stateBefore == EXECUTED()  => false
    );
}

rule stateTransitionWait(uint256 pId, env e1, env e2) {
    require clock(e1) > 0; // Sanity
    require clock(e2) > clock(e1);

    uint8 stateBefore = state(e1, pId);
    uint8 stateAfter  = state(e2, pId);

    assert (stateBefore != stateAfter) => (
        stateBefore == PENDING() => (
            stateAfter == ACTIVE()
        ) &&
        stateBefore == ACTIVE() => (
            stateAfter == SUCCEEDED() ||
            stateAfter == DEFEATED()
        ) &&
        stateBefore == UNSET() => false &&
        stateBefore == SUCCEEDED() => false &&
        stateBefore == QUEUED()    => false &&
        stateBefore == CANCELED()  => false &&
        stateBefore == DEFEATED()  => false &&
        stateBefore == EXECUTED()  => false
    );
}






/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Once a proposal is created, voteStart, voteEnd and proposer are immutable                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule immutableFieldsAfterProposalCreation(uint256 pId, env e, method f, calldataarg arg)
    filtered { f -> !skip(f) }
{
    require state(e, pId) != UNSET();

    uint256 voteStart = proposalSnapshot(pId);
    uint256 voteEnd   = proposalDeadline(pId);
    address proposer  = proposalProposer(pId);

    f(e, arg);

    assert voteStart == proposalSnapshot(pId), "Start date was changed";
    assert voteEnd   == proposalDeadline(pId), "End date was changed";
    assert proposer  == proposalProposer(pId), "Proposer was changed";
}













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
