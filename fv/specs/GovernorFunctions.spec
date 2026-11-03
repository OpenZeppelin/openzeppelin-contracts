import "helpers/Governor.helpers.spec";
import "GovernorInvariants.spec";

use invariant proposalStateConsistency;
use invariant queuedImplyDeadlineOver;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: propose effect and liveness. Includes "no double proposition"                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule propose_liveness(uint256 pId, env e) {
    require nonpayable(e);
    require clockSanity(e);

    uint8 stateBefore = safeState(e, pId);

    address[] targets; uint256[] values; bytes[] calldatas; string descr;
    require pId == hashProposal(targets, values, calldatas, descr);

    propose@withrevert(e, targets, values, calldatas, descr);

    // liveness & double proposal
    assert !lastReverted <=> (
        stateBefore == UNSET() &&
        validProposal(targets, values, calldatas)
    );
}

rule propose_effect(uint256 pId, env e) {
    requireInvariant canceledImplyCreated(pId);
    requireInvariant executedImplyCreated(pId);

    address[] targets; uint256[] values; bytes[] calldatas; string descr;
    require pId == hashProposal(targets, values, calldatas, descr);

    propose(e, targets, values, calldatas, descr);

    // effect
    assert stateOf(e, pId)       == PENDING();
    assert proposalProposer(pId) == e.msg.sender;
    assert proposalSnapshot(pId) == clock(e) + votingDelay();
    assert proposalDeadline(pId) == clock(e) + votingDelay() + votingPeriod();
}

rule propose_sideeffect(uint256 pId, env e, uint256 otherId) {
    requireInvariant canceledImplyCreated(otherId);
    requireInvariant executedImplyCreated(otherId);

    uint8   otherStateBefore = stateOf(e, otherId);
    uint256 otherVoteStart   = proposalSnapshot(otherId);
    uint256 otherVoteEnd     = proposalDeadline(otherId);
    address otherProposer    = proposalProposer(otherId);

    address[] targets; uint256[] values; bytes[] calldatas; string descr;
    require pId == hashProposal(targets, values, calldatas, descr);

    propose(e, targets, values, calldatas, descr);

    // no side-effect
    assert stateOf(e, otherId)       != otherStateBefore => otherId == pId;
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

    uint8   stateBefore    = stateOf(e, pId);
    bool    hasVotedBefore = hasVoted(pId, voter);
    uint256 voterWeight    = token_getPastVotes(e, voter, proposalSnapshot(pId));

    // voting weight overflow check
    require getAgainstVotes(pId) + voterWeight <= max_uint256;
    require getForVotes(pId)     + voterWeight <= max_uint256;
    require getAbstainVotes(pId) + voterWeight <= max_uint256;

    bool success = helperVoteWithRevert(e, f, pId, voter, support);

    assert success <=> (
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
    uint256 voterWeight        = token_getPastVotes(e, voter, proposalSnapshot(pId));

    uint256 weight = helperVote(e, f, pId, voter, support);

    assert stateOf(e, pId)      == ACTIVE();
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

    helperVote(e, f, pId, voter, support);

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

    uint8 stateBefore = stateOf(e, pId);

    address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
    require pId == hashProposal(targets, values, calldatas, descrHash);

    // Timelock configuration: the governor can schedule operations, the operation is not already scheduled, and the
    // eta (timestamp + delay) does not overflow. Only well-formed proposals can be created.
    require hasTimelockProposerRole();
    require !isTimelockOperation(targets, values, calldatas, descrHash);
    require e.block.timestamp + timelockMinDelay() < max_uint48;
    require validProposal(targets, values, calldatas);

    queue@withrevert(e, targets, values, calldatas, descrHash);

    // liveness
    assert !lastReverted <=> stateBefore == SUCCEEDED();
}

/// [DISABLED] This rule times out.
// rule queue_effect(uint256 pId, env e) {
//     uint8 stateBefore = stateOf(e, pId);
//     bool  queuedBefore = isQueued(pId);
//
//     address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
//     require pId == hashProposal(targets, values, calldatas, descrHash);
//
//     queue(e, targets, values, calldatas, descrHash);
//
//     assert stateOf(e, pId) == QUEUED();
//     assert isQueued(pId);
//     assert !queuedBefore;
// }

/// [DISABLED] This rule times out.
// rule queue_sideeffect(uint256 pId, env e, uint256 otherId) {
//     requireInvariant canceledImplyCreated(otherId);
//     requireInvariant executedImplyCreated(otherId);
//
//     uint8   otherStateBefore = stateOf(e, otherId);
//     bool  otherQueuedBefore = isQueued(otherId);
//
//     address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
//     require pId == hashProposal(targets, values, calldatas, descrHash);
//
//     queue(e, targets, values, calldatas, descrHash);
//
//     // no side-effect
//     assert stateOf(e, otherId) != otherStateBefore  => otherId == pId;
//     assert isQueued(otherId) != otherQueuedBefore => otherId == pId;
// }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: execute effect and liveness.                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule execute_liveness(uint256 pId, env e) {
    require nonpayable(e);
    require clockSanity(e);

    uint8 stateBefore = stateOf(e, pId);

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
    assert stateOf(e, pId) == EXECUTED();
}

/// [DISABLED] This rule times out.
// rule execute_sideeffect(uint256 pId, env e, uint256 otherId) {
//     requireInvariant canceledImplyCreated(otherId);
//     requireInvariant executedImplyCreated(otherId);
//
//     uint8   otherStateBefore = stateOf(e, otherId);
//
//     address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
//     require pId == hashProposal(targets, values, calldatas, descrHash);
//
//     execute(e, targets, values, calldatas, descrHash);
//
//     // no side-effect
//     assert stateOf(e, otherId) != otherStateBefore => otherId == pId;
// }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: cancel (public) effect and liveness.                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cancel_liveness(uint256 pId, env e) {
    require nonpayable(e);
    require clockSanity(e);
    requireInvariant queuedImplyDeadlineOver(e, pId);

    uint8 stateBefore = stateOf(e, pId);

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
    assert stateOf(e, pId) == CANCELED();
    assert !isQueued(pId); // cancel resets timelockId
}

/// [DISABLED] This rule times out.
// rule cancel_sideeffect(uint256 pId, env e, uint256 otherId) {
//     requireInvariant canceledImplyCreated(otherId);
//     requireInvariant executedImplyCreated(otherId);
//     // A pending proposal (the only one that can be canceled) has no timelock operation that could be shared with otherId
//     requireInvariant noTimelockBeforeEndOfVote(e, pId);
//
//     uint8   otherStateBefore = stateOf(e, otherId);
//     bool  otherQueuedBefore = isQueued(otherId);
//
//     address[] targets; uint256[] values; bytes[] calldatas; bytes32 descrHash;
//     require pId == hashProposal(targets, values, calldatas, descrHash);
//
//     cancel(e, targets, values, calldatas, descrHash);
//
//     // no side-effect
//     assert stateOf(e, otherId) != otherStateBefore  => otherId == pId;
//     assert isQueued(otherId) != otherQueuedBefore => otherId == pId;
// }
