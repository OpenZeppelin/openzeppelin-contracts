methods {
    TIMELOCK_ADMIN_ROLE()       returns (bytes32) envfree
    PROPOSER_ROLE()             returns (bytes32) envfree
    EXECUTOR_ROLE()             returns (bytes32) envfree
    CANCELLER_ROLE()            returns (bytes32) envfree
    isOperation(bytes32)        returns (bool)    envfree
    isOperationPending(bytes32) returns (bool)    envfree
    isOperationReady(bytes32)   returns (bool)
    isOperationDone(bytes32)    returns (bool)    envfree
    getTimestamp(bytes32)       returns (uint256) envfree
    getMinDelay()               returns (uint256) envfree

    hashOperation(address, uint256, bytes, bytes32, bytes32)            returns(bytes32) envfree
    hashOperationBatch(address[], uint256[], bytes[], bytes32, bytes32) returns(bytes32) envfree

    schedule(address, uint256, bytes, bytes32, bytes32, uint256)
    scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256)
    execute(address, uint256, bytes, bytes32, bytes32)
    executeBatch(address[], uint256[], bytes[], bytes32, bytes32)
    cancel(bytes32)

    updateDelay(uint256)
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Functions & Definitions                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition DONE_TIMESTAMP()      returns uint256 = 1;
definition isUnset(bytes32 id)   returns bool    = !isOperation(id);
definition isPending(bytes32 id) returns bool    = isOperationPending(id);
definition isDone(bytes32 id)    returns bool    = isOperationDone(id);
definition state(bytes32 id)     returns uint8   = isUnset(id) ? 0 : isPending(id) ? 1 : 2;

function hashIdCorrelation(bytes32 id, address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) {
    // require data.length < 32;
    require hashOperation(target, value, data, predecessor, salt) == id;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariants: consistency of accessors                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant isOperationCheck(bytes32 id)
    isOperation(id) <=> getTimestamp(id) > 0
    filtered { f -> !f.isView }

invariant isOperationPendingCheck(bytes32 id)
    isOperationPending(id) <=> getTimestamp(id) > DONE_TIMESTAMP()
    filtered { f -> !f.isView }

invariant isOperationReadyCheck(env e, bytes32 id)
    isOperationReady(e, id) <=> (isOperationPending(id) && getTimestamp(id) <= e.block.timestamp)
    filtered { f -> !f.isView }

invariant isOperationDoneCheck(bytes32 id)
    isOperationDone(id) <=> getTimestamp(id) == DONE_TIMESTAMP()
    filtered { f -> !f.isView }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: a proposal id is either unset, pending or done                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant stateConsistency(bytes32 id)
    (isUnset(id)   <=> (!isPending(id) && !isDone(id)   )) &&
    (isPending(id) <=> (!isUnset(id)   && !isDone(id)   )) &&
    (isDone(id)    <=> (!isUnset(id)   && !isPending(id)))
    filtered { f -> !f.isView }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: state transition rules                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateTransition(bytes32 id, env e, method f, calldataarg args) {
    require e.block.number > 1; // Sanity

    uint8 stateBefore = state(id);
    f(e, args);
    uint8 stateAfter = state(id);

    // Cannot jump from UNSET to DONE
    assert stateBefore == 0 => stateAfter != 2;

    // UNSET → PENDING: schedule or scheduleBatch
    assert stateBefore == 0 && stateAfter == 1 => (
        f.selector == schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector ||
        f.selector == scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector
    );

    // PENDING → UNSET: cancel
    assert stateBefore == 1 && stateAfter == 0 => (
        f.selector == cancel(bytes32).selector
    );

    // PENDING → DONE: execute or executeBatch
    assert stateBefore == 1 && stateAfter == 2 => (
        f.selector == execute(address, uint256, bytes, bytes32, bytes32).selector ||
        f.selector == executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector
    );

    // DONE is final
    assert stateBefore == 2 => stateAfter == 2;
}