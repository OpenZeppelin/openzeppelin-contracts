import "helpers/helpers.spec";
import "methods/IAccessControl.spec";

methods {
    function PROPOSER_ROLE()             external returns (bytes32) envfree;
    function EXECUTOR_ROLE()             external returns (bytes32) envfree;
    function CANCELLER_ROLE()            external returns (bytes32) envfree;
    function isOperation(bytes32)        external returns (bool);
    function isOperationPending(bytes32) external returns (bool);
    function isOperationReady(bytes32)   external returns (bool);
    function isOperationDone(bytes32)    external returns (bool);
    function getTimestamp(bytes32)       external returns (uint256) envfree;
    function getMinDelay()               external returns (uint256) envfree;

    function hashOperation(address, uint256, bytes, bytes32, bytes32)            external returns(bytes32) envfree;
    function hashOperationBatch(address[], uint256[], bytes[], bytes32, bytes32) external returns(bytes32) envfree;

    function schedule(address, uint256, bytes, bytes32, bytes32, uint256) external;
    function scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256) external;
    function execute(address, uint256, bytes, bytes32, bytes32) external;
    function executeBatch(address[], uint256[], bytes[], bytes32, bytes32) external;
    function cancel(bytes32) external;

    function updateDelay(uint256) external;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// Uniformly handle scheduling of batched and non-batched operations.
function helperScheduleWithRevert(env e, method f, bytes32 id, uint256 delay) {
    if (f.selector == sig:schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector) {
        address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
        require hashOperation(target, value, data, predecessor, salt) == id; // Correlation
        schedule@withrevert(e, target, value, data, predecessor, salt, delay);
    } else if (f.selector == sig:scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector) {
        address[] targets; uint256[] values; bytes[] payloads; bytes32 predecessor; bytes32 salt;
        require hashOperationBatch(targets, values, payloads, predecessor, salt) == id; // Correlation
        scheduleBatch@withrevert(e, targets, values, payloads, predecessor, salt, delay);
    } else {
        calldataarg args;
        f@withrevert(e, args);
    }
}

// Uniformly handle execution of batched and non-batched operations.
function helperExecuteWithRevert(env e, method f, bytes32 id, bytes32 predecessor) {
    if (f.selector == sig:execute(address, uint256, bytes, bytes32, bytes32).selector) {
        address target; uint256 value; bytes data; bytes32 salt;
        require hashOperation(target, value, data, predecessor, salt) == id; // Correlation
        execute@withrevert(e, target, value, data, predecessor, salt);
    } else if (f.selector == sig:executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector) {
        address[] targets; uint256[] values; bytes[] payloads; bytes32 salt;
        require hashOperationBatch(targets, values, payloads, predecessor, salt) == id; // Correlation
        executeBatch@withrevert(e, targets, values, payloads, predecessor, salt);
    } else {
        calldataarg args;
        f@withrevert(e, args);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Definitions                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition DONE_TIMESTAMP()      returns uint256 = 1;
definition UNSET()               returns uint8   = 0x1;
definition PENDING()             returns uint8   = 0x2;
definition DONE()                returns uint8   = 0x4;

definition isUnset(env e, bytes32 id)   returns bool  = !isOperation(e, id);
definition isPending(env e, bytes32 id) returns bool  = isOperationPending(e, id);
definition isDone(env e, bytes32 id)    returns bool  = isOperationDone(e, id);
definition state(env e, bytes32 id)     returns uint8 = (isUnset(e, id) ? UNSET() : 0) | (isPending(e, id) ? PENDING() : 0) | (isDone(e, id) ? DONE() : 0);

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariants: consistency of accessors                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant isOperationCheck(env e, bytes32 id)
    isOperation(e, id) <=> getTimestamp(id) > 0
    filtered { f -> !f.isView }

invariant isOperationPendingCheck(env e, bytes32 id)
    isOperationPending(e, id) <=> getTimestamp(id) > DONE_TIMESTAMP()
    filtered { f -> !f.isView }

invariant isOperationDoneCheck(env e, bytes32 id)
    isOperationDone(e, id) <=> getTimestamp(id) == DONE_TIMESTAMP()
    filtered { f -> !f.isView }

invariant isOperationReadyCheck(env e, bytes32 id)
    isOperationReady(e, id) <=> (isOperationPending(e, id) && getTimestamp(id) <= e.block.timestamp)
    filtered { f -> !f.isView }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: a proposal id is either unset, pending or done                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant stateConsistency(bytes32 id, env e)
    // Check states are mutually exclusive
    (isUnset(e, id)   <=> (!isPending(e, id) && !isDone(e, id)   )) &&
    (isPending(e, id) <=> (!isUnset(e, id)   && !isDone(e, id)   )) &&
    (isDone(e, id)    <=> (!isUnset(e, id)   && !isPending(e, id))) &&
    // Check that the state helper behaves as expected:
    (isUnset(e, id)   <=> state(e, id) == UNSET()              ) &&
    (isPending(e, id) <=> state(e, id) == PENDING()            ) &&
    (isDone(e, id)    <=> state(e, id) == DONE()               ) &&
    // Check substate
    isOperationReady(e, id) => isPending(e, id)
    filtered { f -> !f.isView }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: state transition rules                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateTransition(bytes32 id, env e, method f, calldataarg args) {
    require e.block.timestamp > 1; // Sanity

    uint8 stateBefore = state(e, id);
    f(e, args);
    uint8 stateAfter = state(e, id);

    // Cannot jump from UNSET to DONE
    assert stateBefore == UNSET() => stateAfter != DONE();

    // UNSET → PENDING: schedule or scheduleBatch
    assert stateBefore == UNSET() && stateAfter == PENDING() => (
        f.selector == sig:schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector ||
        f.selector == sig:scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector
    );

    // PENDING → UNSET: cancel
    assert stateBefore == PENDING() && stateAfter == UNSET() => (
        f.selector == sig:cancel(bytes32).selector
    );

    // PENDING → DONE: execute or executeBatch
    assert stateBefore == PENDING() && stateAfter == DONE() => (
        f.selector == sig:execute(address, uint256, bytes, bytes32, bytes32).selector ||
        f.selector == sig:executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector
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

    assert delayBefore != getMinDelay() => (e.msg.sender == currentContract && f.selector == sig:updateDelay(uint256).selector), "Unauthorized delay update";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: schedule liveness and effects                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule schedule(env e, method f, bytes32 id, uint256 delay) filtered { f ->
    f.selector == sig:schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector ||
    f.selector == sig:scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector
} {
    require nonpayable(e);

    // Basic timestamp assumptions
    require e.block.timestamp > 1;
    require e.block.timestamp + delay < max_uint256;
    require e.block.timestamp + getMinDelay() < max_uint256;

    bytes32 otherId; uint256 otherTimestamp = getTimestamp(otherId);

    uint8 stateBefore       = state(e, id);
    bool  isDelaySufficient = delay >= getMinDelay();
    bool  isProposerBefore  = hasRole(PROPOSER_ROLE(), e.msg.sender);

    helperScheduleWithRevert(e, f, id, delay);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        stateBefore == UNSET() &&
        isDelaySufficient &&
        isProposerBefore
    );

    // effect
    assert success => state(e, id) == PENDING(), "State transition violation";
    assert success => getTimestamp(id) == require_uint256(e.block.timestamp + delay), "Proposal timestamp not correctly set";

    // no side effect
    assert otherTimestamp != getTimestamp(otherId) => id == otherId, "Other proposal affected";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: execute liveness and effects                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule execute(env e, method f, bytes32 id, bytes32 predecessor) filtered { f ->
    f.selector == sig:execute(address, uint256, bytes, bytes32, bytes32).selector ||
    f.selector == sig:executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector
} {
    bytes32 otherId; uint256 otherTimestamp = getTimestamp(otherId);

    uint8 stateBefore            = state(e, id);
    bool  isOperationReadyBefore = isOperationReady(e, id);
    bool  isExecutorOrOpen       = hasRole(EXECUTOR_ROLE(), e.msg.sender) || hasRole(EXECUTOR_ROLE(), 0);
    bool  predecessorDependency  = predecessor == to_bytes32(0) || isDone(e, predecessor);

    helperExecuteWithRevert(e, f, id, predecessor);
    bool success = !lastReverted;

    // The underlying transaction can revert, and that would cause the execution to revert. We can check that all non
    // reverting calls meet the requirements in terms of proposal readiness, access control and predecessor dependency.
    // We can't however guarantee that these requirements being meet ensure liveness of the proposal, because the
    // proposal can revert for reasons beyond our control.

    // liveness, should be `<=>` but can only check `=>` (see comment above)
    assert success => (
        stateBefore == PENDING() &&
        isOperationReadyBefore &&
        predecessorDependency &&
        isExecutorOrOpen
    );

    // effect
    assert success => state(e, id) == DONE(), "State transition violation";

    // no side effect
    assert otherTimestamp != getTimestamp(otherId) => id == otherId, "Other proposal affected";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: cancel liveness and effects                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cancel(env e, bytes32 id) {
    require nonpayable(e);

    bytes32 otherId; uint256 otherTimestamp = getTimestamp(otherId);

    uint8 stateBefore = state(e, id);
    bool  isCanceller = hasRole(CANCELLER_ROLE(), e.msg.sender);

    cancel@withrevert(e, id);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        stateBefore == PENDING() &&
        isCanceller
    );

    // effect
    assert success => state(e, id) == UNSET(), "State transition violation";

    // no side effect
    assert otherTimestamp != getTimestamp(otherId) => id == otherId, "Other proposal affected";
}
