import "helpers.spec"
import "methods/IGovernor.spec"
import "Governor.helpers.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: clock is consistent between the goernor and the token                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule clockMode(env e) {
    assert clock(e) == e.block.number || clock(e) == e.block.timestamp;
    assert clock(e) == token_clock(e);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Proposal is UNSET iff the proposer, the snapshot and the deadline are unset.                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant createdConsistency(env e, uint256 pId)
    safeState(e, pId) == UNSET() <=> proposalProposer(pId) == 0 &&
    safeState(e, pId) == UNSET() <=> proposalSnapshot(pId) == 0 &&
    safeState(e, pId) == UNSET() <=> proposalDeadline(pId) == 0 &&
    safeState(e, pId) == UNSET()  => !isExecuted(pId) &&
    safeState(e, pId) == UNSET()  => !isCanceled(pId)
    {
        preserved {
            require clock(e) > 0;
        }
    }

invariant createdConsistencyWeak(uint256 pId)
    proposalProposer(pId) == 0 <=> proposalSnapshot(pId) == 0 &&
    proposalProposer(pId) == 0 <=> proposalDeadline(pId) == 0
    {
        preserved with (env e) {
            require clock(e) > 0;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Votes start before it ends                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant voteStartBeforeVoteEnd(uint256 pId)
    proposalSnapshot(pId) <= proposalDeadline(pId)
    {
        preserved {
            requireInvariant createdConsistencyWeak(pId);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: A proposal cannot be both executed and canceled simultaneously                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant noBothExecutedAndCanceled(uint256 pId)
    !isExecuted(pId) || !isCanceled(pId)

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
