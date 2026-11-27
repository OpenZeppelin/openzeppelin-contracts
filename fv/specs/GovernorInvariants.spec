import "helpers/Governor.helpers.spec";

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
    filtered { f -> !assumedSafe(f) }
    {
        preserved with (env e) {
            require clockSanity(e);
            require nonzerosender(e);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: votes recorded => created                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant votesImplyCreated(uint256 pId)
    (
        getAgainstVotes(pId) > 0 ||
        getForVotes(pId)     > 0 ||
        getAbstainVotes(pId) > 0
    ) => proposalCreated(pId)
    filtered { f -> !assumedSafe(f) }
    {
        preserved with (env e) {
            require clockSanity(e);
            requireInvariant proposalStateConsistency(pId);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: cancel => created                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant canceledImplyCreated(uint pId)
    isCanceled(pId) => proposalCreated(pId)
    filtered { f -> !assumedSafe(f) }
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
    filtered { f -> !assumedSafe(f) }
    {
        preserved with (env e) {
            require clockSanity(e);
            requireInvariant proposalStateConsistency(pId);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: queued => created                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant queuedImplyCreated(uint pId)
    isQueued(pId) => proposalCreated(pId)
    filtered { f -> !assumedSafe(f) }
    {
        preserved with (env e) {
            require clockSanity(e);
            requireInvariant proposalStateConsistency(pId);
        }
    }


/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: timings                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant votesImplySnapshotPassed(env e, uint256 pId)
    (
        getAgainstVotes(pId) > 0 ||
        getForVotes(pId)     > 0 ||
        getAbstainVotes(pId) > 0
    ) => proposalSnapshot(pId) < clock(e)
    filtered { f -> !assumedSafe(f) }
    {
        preserved with (env e2) {
            // In this invariant, `env e` is representing the present. And `clock(e)` the current timestamp.
            // It should hold for any transitions in the pasts
            require clock(e2) <= clock(e);
            requireInvariant proposalStateConsistency(pId);
            requireInvariant votesImplyCreated(pId);
        }
    }

invariant queuedImplyDeadlineOver(env e, uint pId)
    isQueued(pId) => proposalDeadline(pId) < clock(e)
    filtered { f -> !assumedSafe(f) }
    {
        preserved with (env e2) {
            // In this invariant, `env e` is representing the present. And `clock(e)` the current timestamp.
            // It should hold for any transitions in the pasts
            require clockSanity(e2);
            require clock(e2) <= clock(e);
            requireInvariant proposalStateConsistency(pId);
            requireInvariant queuedImplyCreated(pId);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: A proposal is not queued before the end of the vote                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// The timelockId (and the eta) can be set in states QUEUED, EXECUTED and CANCELED. However, checking the full scope of
// this results in a timeout. This is a weaker version that is still useful: a proposal is not queued before it exists,
// or before the end of the vote.
invariant noTimelockBeforeEndOfVote(env e, uint256 pId)
    (safeState(e, pId) == UNSET() || safeState(e, pId) == PENDING() || safeState(e, pId) == ACTIVE()) => (
        timelockId(pId) == to_bytes32(0) &&
        proposalEta(pId) == 0
    )
    filtered { f -> !assumedSafe(f) }
    {
        preserved with (env e2) {
            // In this invariant, `env e` is representing the present. And `clock(e)` the current timestamp.
            // It should hold for any transitions in the pasts
            require clockSanity(e2);
            require clock(e2) <= clock(e);
            requireInvariant proposalStateConsistency(pId);
            requireInvariant queuedImplyCreated(pId);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [DISABLED] Invariant: Votes start before it ends                                                                    │
│                                                                                                                     │
│ This property holds, but it is true by construction: `proposalDeadline` is computed as `voteStart + voteDuration`   │
│ (in uint256, so without overflow), which can never be smaller than `proposalSnapshot` (`voteStart`). The prover's   │
│ sanity checks flag it as trivial (`invariant_not_trivial_postcondition`), which fails the job.                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// invariant voteStartBeforeVoteEnd(uint256 pId)
//     proposalSnapshot(pId) <= proposalDeadline(pId)
//     filtered { f -> !assumedSafe(f) }
//     {
//         preserved {
//             requireInvariant proposalStateConsistency(pId);
//         }
//     }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: A proposal cannot be both executed and canceled simultaneously                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant noBothExecutedAndCanceled(uint256 pId)
    !isExecuted(pId) || !isCanceled(pId)
    filtered { f -> !assumedSafe(f) }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: the "governance call" dequeue is empty                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant governanceCallLength()
    governanceCallLength() == 0
    // Functions restricted to governance can only succeed while the queue is not empty, which only happens in the
    // middle of an `execute` call (the queue is cleared before `execute` returns).
    filtered { f -> !assumedSafe(f) && !onlyGovernance(f) }
