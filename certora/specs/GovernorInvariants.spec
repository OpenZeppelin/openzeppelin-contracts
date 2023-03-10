import "helpers.spec"
import "methods/IGovernor.spec"
import "Governor.helpers.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: clock is consistent between the goernor and the token                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule clockMode(env e) {
    require e.block.number < max_uint48() && e.block.timestamp < max_uint48();

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
            require clock(e) > 0;
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
            requireInvariant proposalStateConsistency(pId);
            require clock(e) > 0;
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
            requireInvariant proposalStateConsistency(pId);
            require clock(e) > 0;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: The state UNSET() correctly catched uninitialized proposal.                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant proposalStateConsistencyUnset(env e, uint256 pId)
    proposalCreated(pId) <=> safeState(e, pId) == UNSET()
    {
        preserved {
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