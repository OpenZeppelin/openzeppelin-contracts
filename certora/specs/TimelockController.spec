import "methods/IAccessControl.spec"

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
definition UNSET()               returns uint8   = 0;
definition PENDING()             returns uint8   = 1;
definition DONE()                returns uint8   = 2;

definition isUnset(bytes32 id)   returns bool    = !isOperation(id);
definition isPending(bytes32 id) returns bool    = isOperationPending(id);
definition isDone(bytes32 id)    returns bool    = isOperationDone(id);
definition state(bytes32 id)     returns uint8   = isUnset(id) ? UNSET() : isPending(id) ? PENDING() : DONE();

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

invariant isOperationDoneCheck(bytes32 id)
    isOperationDone(id) <=> getTimestamp(id) == DONE_TIMESTAMP()
    filtered { f -> !f.isView }

invariant isOperationReadyCheck(env e, bytes32 id)
    isOperationReady(e, id) <=> (isOperationPending(id) && getTimestamp(id) <= e.block.timestamp)
    filtered { f -> !f.isView }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: a proposal id is either unset, pending or done                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant stateConsistency(bytes32 id, env e)
    (isUnset(id)   <=> (!isPending(id) && !isDone(id)   )) &&
    (isPending(id) <=> (!isUnset(id)   && !isDone(id)   )) &&
    (isDone(id)    <=> (!isUnset(id)   && !isPending(id))) &&
    // Check that the state helper behaves as expected:
    (isUnset(id)   <=> state(id) == UNSET()              ) &&
    (isPending(id) <=> state(id) == PENDING()            ) &&
    (isDone(id)    <=> state(id) == DONE()               ) &&
    isOperationReady(e, id) => isPending(id)
    filtered { f -> !f.isView }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: state transition rules                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateTransition(bytes32 id, env e, method f, calldataarg args) {
    require e.block.timestamp > 1; // Sanity

    uint8 stateBefore = state(id);
    f(e, args);
    uint8 stateAfter = state(id);

    // Cannot jump from UNSET to DONE
    assert stateBefore == UNSET() => stateAfter != DONE();

    // UNSET → PENDING: schedule or scheduleBatch
    assert stateBefore == UNSET() && stateAfter == PENDING() => (
        f.selector == schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector ||
        f.selector == scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector
    );

    // PENDING → UNSET: cancel
    assert stateBefore == PENDING() && stateAfter == UNSET() => (
        f.selector == cancel(bytes32).selector
    );

    // PENDING → DONE: execute or executeBatch
    assert stateBefore == PENDING() && stateAfter == DONE() => (
        f.selector == execute(address, uint256, bytes, bytes32, bytes32).selector ||
        f.selector == executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector
    );

    // DONE is final
    assert stateBefore == DONE() => stateAfter == DONE();
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: minimum delay can only be updated through a timelock execution                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule minDelayOnlyChange(env e) {
    uint256 delayBefore = getMinDelay();

    method f; calldataarg args;
    f(e, args);

    assert delayBefore != getMinDelay() => (e.msg.sender == currentContract && f.selector == updateDelay(uint256).selector), "Unauthorized delay update";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: schedule correctly updates the state                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule schedule(env e, bytes32 id) {
    require e.block.timestamp > 1; // Sanity

    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt; uint256 delay;
    require hashOperation(target, value, data, predecessor, salt) == id; // Correlation

    bytes32 otherId;
    uint256 otherTimestamp = getTimestamp(otherId);

    uint8 stateBefore = state(id);
    schedule(e, target, value, data, predecessor, salt, delay);
    uint8 stateAfter = state(id);

    assert stateBefore == UNSET() && stateAfter == PENDING(), "State transition violation";
    assert getTimestamp(id) == to_uint256(e.block.timestamp + delay), "Proposal timestamp not correctly set";
    assert delay >= getMinDelay(), "Minimum delay violation";
    assert otherTimestamp != getTimestamp(otherId) => id == otherId, "Other proposal affected";
}

rule scheduleBatch(env e, bytes32 id) {
    require e.block.timestamp > 1; // Sanity

    address[] targets; uint256[] values; bytes[] payloads; bytes32 predecessor; bytes32 salt; uint256 delay;
    require hashOperationBatch(targets, values, payloads, predecessor, salt) == id; // Correlation

    bytes32 otherId;
    uint256 otherTimestamp = getTimestamp(otherId);

    uint8 stateBefore = state(id);
    scheduleBatch(e, targets, values, payloads, predecessor, salt, delay);
    uint8 stateAfter = state(id);

    assert stateBefore == UNSET() && stateAfter == PENDING(), "State transition violation";
    assert getTimestamp(id) == to_uint256(e.block.timestamp + delay), "Proposal timestamp not correctly set";
    assert delay >= getMinDelay(), "Minimum delay violation";
    assert otherTimestamp != getTimestamp(otherId) => id == otherId, "Other proposal affected";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: execute correctly updates the state                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule execute(env e, bytes32 id) {
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt; uint256 delay;
    require hashOperation(target, value, data, predecessor, salt) == id; // Correlation

    bool isOperationReadyBefore = isOperationReady(e, id);

    bytes32 otherId;
    uint256 otherTimestamp = getTimestamp(otherId);

    uint8 stateBefore = state(id);
    execute(e, target, value, data, predecessor, salt);
    uint8 stateAfter = state(id);

    assert stateBefore == PENDING() && stateAfter == DONE(), "State transition violation";
    assert isOperationReadyBefore, "Execute before ready";
    assert otherTimestamp != getTimestamp(otherId) => id == otherId, "Other proposal affected";
}

rule executeBatch(env e, bytes32 id) {
    address[] targets; uint256[] values; bytes[] payloads; bytes32 predecessor; bytes32 salt; uint256 delay;
    require hashOperationBatch(targets, values, payloads, predecessor, salt) == id; // Correlation

    bool isOperationReadyBefore = isOperationReady(e, id);

    bytes32 otherId;
    uint256 otherTimestamp = getTimestamp(otherId);

    uint8 stateBefore = state(id);
    executeBatch(e, targets, values, payloads, predecessor, salt);
    uint8 stateAfter = state(id);

    assert stateBefore == PENDING() && stateAfter == DONE(), "State transition violation";
    assert isOperationReadyBefore, "Execute before ready";
    assert otherTimestamp != getTimestamp(otherId) => id == otherId, "Other proposal affected";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: cancel correctly updates the state                                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cancel(env e, bytes32 id) {
    bytes32 otherId;
    uint256 otherTimestamp = getTimestamp(otherId);

    uint8 stateBefore = state(id);
    cancel(e, id);
    uint8 stateAfter = state(id);

    assert stateBefore == PENDING() && stateAfter == UNSET(), "State transition violation";
    assert otherTimestamp != getTimestamp(otherId) => id == otherId, "Other proposal affected";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Access control: only users with the PROPOSER_ROLE can call schedule or scheduleBatch                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyProposer(env e, bytes32 id, method f) filtered { f ->
    f.selector == schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector ||
    f.selector == scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector
} {
    bool isProposer = hasRole(PROPOSER_ROLE(), e.msg.sender);

    calldataarg args;
    f@withrevert(e, args);

    assert !isProposer => lastReverted, "Only proposer can propose";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Access control: only users with the EXECUTOR_ROLE can call execute or executeBatch                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyExecutor(env e, bytes32 id, method f) filtered { f ->
    f.selector == execute(address, uint256, bytes, bytes32, bytes32).selector ||
    f.selector == executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector
} {
    bool isExecutorOrOpen = hasRole(EXECUTOR_ROLE(), e.msg.sender) || hasRole(EXECUTOR_ROLE(), 0);

    calldataarg args;
    f@withrevert(e, args);

    assert !isExecutorOrOpen => lastReverted, "Only executor can execute";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Access control: only users with the CANCELLER_ROLE can call cancel                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyCanceler(env e, bytes32 id, method f) filtered { f ->
    f.selector == cancel(bytes32).selector
} {
    bool isCanceler = hasRole(CANCELLER_ROLE(), e.msg.sender);

    calldataarg args;
    f@withrevert(e, args);

    assert !isCanceler => lastReverted, "Only canceler can cancel";
}
