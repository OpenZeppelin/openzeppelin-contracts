import "helpers.spec"
import "Governor.helpers.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: clock is consistent between the goernor and the token                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule clockMode(env e) {
    require clockSanity(e);

    assert clock(e) == e.block.number || clock(e) == e.block.timestamp;
    assert clock(e) == token_clock(e);

    /// This causes a failure in the prover
    // assert CLOCK_MODE(e) == token_CLOCK_MODE(e);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Votes start and end are either initialized (non zero) or uninitialized (zero) simultaneously             │
│                                                                                                                     │
│ This invariant assumes that the block number cannot be 0 at any stage of the contract cycle                         │
│ This is very safe assumption as usually the 0 block is genesis block which is uploaded with data                    │
│ by the developers and will not be valid to raise proposals (at the current way that block chain is functioning)     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant proposalStateConsistency(uint256 pId)
    (proposalProposer(pId) == 0 <=> proposalSnapshot(pId) == 0) &&
    (proposalProposer(pId) == 0 <=> proposalDeadline(pId) == 0)
    {
        preserved with (env e) {
            require clockSanity(e);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: votes recorded => proposal snapshot is in the past                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant votesImplySnapshotPassed(env e, uint256 pId)
    (getAgainstVotes(pId) > 0 => proposalSnapshot(pId) <= clock(e)) &&
    (getForVotes(pId)     > 0 => proposalSnapshot(pId) <= clock(e)) &&
    (getAbstainVotes(pId) > 0 => proposalSnapshot(pId) <= clock(e))
    {
        preserved {
            require clockSanity(e);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: cancel => created                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant canceledImplyCreated(uint pId)
    isCanceled(pId) => proposalCreated(pId)
    {
        preserved with (env e) {
            require clockSanity(e);
            requireInvariant proposalStateConsistency(pId);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: executed => created                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant executedImplyCreated(uint pId)
    isExecuted(pId) => proposalCreated(pId)
    {
        preserved with (env e) {
            require clockSanity(e);
            requireInvariant proposalStateConsistency(pId);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: queued => created                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant queuedImplyCreated(uint pId)
    isQueued(pId) => proposalCreated(pId)
    {
        preserved with (env e) {
            require clockSanity(e);
            requireInvariant proposalStateConsistency(pId);
        }
    }

invariant queuedImplyVoteOver(env e, uint pId)
    isQueued(pId) => proposalDeadline(pId) < clock(e)
    {
        preserved {
            require clockSanity(e);
            requireInvariant proposalStateConsistency(pId);
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
            requireInvariant proposalStateConsistency(pId);
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
│ Invariant: the "governance call" dequeue is empty                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant governanceCallLength()
    governanceCallLength() == 0
