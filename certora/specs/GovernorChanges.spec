import "helpers.spec"
import "methods/IGovernor.spec"
import "Governor.helpers.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Proposal can be switched state only by specific functions                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule changes(uint256 pId, env e) {
    require nonpayable(e);
    require clockSanity(e);

    address user;

    bool isExecutedBefore = isExecuted(pId);
    bool isCanceledBefore = isCanceled(pId);
    bool isQueuedBefore   = isQueued(pId);
    bool hasVotedBefore   = hasVoted(pId, user);

    method f; calldataarg args; f(e, args);

    assert isExecuted(pId)     != isExecutedBefore => (!isExecutedBefore && f.selector == execute(address[],uint256[],bytes[],bytes32).selector);
    assert isCanceled(pId)     != isCanceledBefore => (!isCanceledBefore && f.selector == cancel(address[],uint256[],bytes[],bytes32).selector);
    assert hasVoted(pId, user) != hasVotedBefore   => (!hasVotedBefore   && votingAll(f));

    // queue is cleared on cancel
    assert isQueued(pId) != isQueuedBefore => (
        (!isQueuedBefore && f.selector == queue(address[],uint256[],bytes[],bytes32).selector) ||
        (isQueuedBefore  && f.selector == cancel(address[],uint256[],bytes[],bytes32).selector)
    );
}
