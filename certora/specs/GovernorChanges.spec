import "helpers.spec"
import "Governor.helpers.spec"
import "GovernorInvariants.spec"

use invariant proposalStateConsistency

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Proposal can be switched state only by specific functions                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule changes(uint256 pId, env e, method f, calldataarg args)
    filtered { f -> !skip(f) }
{
    require clockSanity(e);
    requireInvariant proposalStateConsistency(pId);

    address user;

    bool    existBefore        = proposalCreated(pId);
    bool    isExecutedBefore   = isExecuted(pId);
    bool    isCanceledBefore   = isCanceled(pId);
    bool    isQueuedBefore     = isQueued(pId);
    bool    hasVotedBefore     = hasVoted(pId, user);
    uint256 votesAgainstBefore = getAgainstVotes(pId);
    uint256 votesForBefore     = getForVotes(pId);
    uint256 votesAbstainBefore = getAbstainVotes(pId);

    f(e, args);

    bool    existAfter        = proposalCreated(pId);
    bool    isExecutedAfter   = isExecuted(pId);
    bool    isCanceledAfter   = isCanceled(pId);
    bool    isQueuedAfter     = isQueued(pId);
    bool    hasVotedAfter     = hasVoted(pId, user);
    uint256 votesAgainstAfter = getAgainstVotes(pId);
    uint256 votesForAfter     = getForVotes(pId);
    uint256 votesAbstainAfter = getAbstainVotes(pId);

    // propose, execute, cancel
    assert existAfter      != existBefore      => (!existBefore      && f.selector == propose(address[],uint256[],bytes[],string).selector);
    assert isExecutedAfter != isExecutedBefore => (!isExecutedBefore && f.selector == execute(address[],uint256[],bytes[],bytes32).selector);
    assert isCanceledAfter != isCanceledBefore => (!isCanceledBefore && f.selector == cancel(address[],uint256[],bytes[],bytes32).selector);

    // queue is cleared on cancel
    assert isQueuedAfter != isQueuedBefore => (
        (!isQueuedBefore && f.selector == queue(address[],uint256[],bytes[],bytes32).selector) ||
        (isQueuedBefore  && f.selector == cancel(address[],uint256[],bytes[],bytes32).selector)
    );

    // votes
    assert hasVotedAfter     != hasVotedBefore     => (!hasVotedBefore                        && votingAll(f));
    assert votesAgainstAfter != votesAgainstBefore => (votesAgainstAfter > votesAgainstBefore && votingAll(f));
    assert votesForAfter     != votesForBefore     => (votesForAfter     > votesForBefore     && votingAll(f));
    assert votesAbstainAfter != votesAbstainBefore => (votesAbstainAfter > votesAbstainBefore && votingAll(f));
}
