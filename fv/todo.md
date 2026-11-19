# Formal verification: disabled rules and invariants

Rules and invariants that are present in the specs but commented out, and why. Entries marked _(CVL2 port)_ were disabled
when porting the specs to CVL2 and the current version of the contracts; the others were already disabled before.

## `GovernorInvariants.spec`

### `voteStartBeforeVoteEnd` _(CVL2 port)_

`proposalSnapshot(pId) <= proposalDeadline(pId)`

The property holds, but it is true by construction: `proposalDeadline` is computed as `voteStart + voteDuration` (in `uint256`, so without overflow), which can never be smaller than `proposalSnapshot`. The prover's sanity check flags it as trivial (`invariant_not_trivial_postcondition`), which fails the job.

## `GovernorStates.spec`

### `stateTransitionFn`

Proposal state transitions caused by function calls (`propose`, `cancel`, `queue`, `execute`). Times out.

### `stateTransitionFn_UNSET`, `_PENDING`, `_ACTIVE`, `_CANCELED`, `_DEFEATED`, `_SUCCEEDED`, `_QUEUED`, `_EXECUTED`

Same property as `stateTransitionFn`, split by starting state (through `stateTransitionFnHelper`). Causes a lot of timeouts.

### `stateTransitionWait` _(CVL2 port)_

Proposal state transitions caused by time passing (only `PENDING → ACTIVE`, `PENDING → DEFEATED`, `ACTIVE → SUCCEEDED` and `ACTIVE → DEFEATED` are possible). Times out, both with `safeState` and with the reverting `state`. The invariant it relies on, `noTimelockBeforeEndOfVote`, is enabled and verified.

### `onlyVoteCanChangeQuorumReached`

Only votes can change whether the quorum of a proposal is reached (in particular, not `updateQuorumNumerator`). Too slow: `quorumReached` goes through the token's and the governor's checkpoint lookups. It also needs a proof that the checkpoints have strictly increasing keys.

### `quorumUpdateDoesntAffectPastProposals`

`updateQuorumNumerator` does not change whether the quorum of an active proposal is reached. Needs a proof that the checkpoints have strictly increasing keys. Without it, the prover finds histories such as `[12, 12, 13, 13, 12]` where the lookup returns the wrong value.

## `GovernorFunctions.spec`

### `execute_sideeffect` _(CVL2 port)_

Executing a proposal does not change the state of any other proposal. Times out, even when assuming `canceledImplyCreated` and `executedImplyCreated` for the other proposal: both reads of its state go through the quorum and checkpoint lookups, on top of the timelock execution.

### `queue_effect` _(CVL2 port)_

Queuing a proposal moves it to the `QUEUED` state and sets its timelock id. Times out.

### `queue_sideeffect` _(CVL2 port)_

Queuing a proposal does not change the state (or the queued status) of any other proposal. Times out, even when assuming `canceledImplyCreated` and `executedImplyCreated` for the other proposal.

### `cancel_sideeffect` _(CVL2 port)_

Canceling a proposal does not change the state (or the queued status) of any other proposal. Hits the job's global time limit, even when assuming `canceledImplyCreated`, `executedImplyCreated` (for the other proposal) and `noTimelockBeforeEndOfVote` (for the canceled one).

## `GovernorPreventLateQuorum.spec`

### `deadlineExtendedEquivQuorumReached`

`getExtendedDeadline(pId) > 0 <=> (quorumReached(e, pId) && !isCanceled(pId))`

Not (easily) provable as an invariant: the prover considers that the token's total supply checkpoints can change arbitrarily, which changes `quorum()`.
