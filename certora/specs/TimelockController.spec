methods {
    getTimestamp(bytes32) returns(uint256) envfree
    _DONE_TIMESTAMP() returns(uint256) envfree
    PROPOSER_ROLE() returns(bytes32) envfree
    _minDelay() returns(uint256) envfree
    getMinDelay() returns(uint256) envfree
    hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) returns(bytes32) envfree
    isOperation(bytes32) returns(bool) envfree
    isOperationPending(bytes32) returns(bool) envfree
    isOperationDone(bytes32) returns(bool) envfree

    isOperationReady(bytes32) returns(bool)
    cancel(bytes32)
    schedule(address, uint256, bytes32, bytes32, bytes32, uint256)
    execute(address, uint256, bytes, bytes32, bytes32)
    executeBatch(address[], uint256[], bytes[], bytes32, bytes32)
    _checkRole(bytes32) => DISPATCHER(true)
}



////////////////////////////////////////////////////////////////////////////
//                         Functions                                      //
////////////////////////////////////////////////////////////////////////////


function hashIdCorrelation(bytes32 id, address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt){
    require data.length < 32;
    require hashOperation(target, value, data, predecessor, salt) == id;
}


function executionsCall(method f, env e, address target, uint256 value, bytes data, 
                                    bytes32 predecessor, bytes32 salt, uint256 delay, 
                                    address[] targets, uint256[] values, bytes[] datas) {
    if  (f.selector == execute(address, uint256, bytes, bytes32, bytes32).selector) {
        execute(e, target, value, data, predecessor, salt);
	} else if (f.selector == executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector) {
        executeBatch(e, targets, values, datas, predecessor, salt);
	} else {
        calldataarg args;
        f(e, args);
    }
}



////////////////////////////////////////////////////////////////////////////
//                         Invariants                                     //
////////////////////////////////////////////////////////////////////////////


// STATUS - verified
// `isOperation()` correctness check
invariant operationCheck(bytes32 id)
    getTimestamp(id) > 0 <=> isOperation(id)


// STATUS - verified
// `isOperationPending()` correctness check
invariant pendingCheck(bytes32 id)
    getTimestamp(id) > _DONE_TIMESTAMP() <=> isOperationPending(id)


// STATUS - verified
// `isOperationReady()` correctness check
invariant readyCheck(env e, bytes32 id)
    (e.block.timestamp >= getTimestamp(id) && getTimestamp(id) > 1) <=> isOperationReady(e, id)


// STATUS - verified
// `isOperationDone()` correctness check
invariant doneCheck(bytes32 id)
    getTimestamp(id) == _DONE_TIMESTAMP() <=> isOperationDone(id)



////////////////////////////////////////////////////////////////////////////
//                            Rules                                       //
////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////
// STATE TRANSITIONS
/////////////////////////////////////////////////////////////


// STATUS - verified
// Possible transitions: form `!isOperation()` to `!isOperation()` or `isOperationPending()` only
rule unsetPendingTransitionGeneral(method f, env e){
    bytes32 id;

    require !isOperation(id);
    require e.block.timestamp > 1;

    calldataarg args;
    f(e, args);

    assert isOperationPending(id) || !isOperation(id);
}


// STATUS - verified
// Possible transitions: form `!isOperation()` to `isOperationPending()` via `schedule()` and `scheduleBatch()` only
rule unsetPendingTransitionMethods(method f, env e){
    bytes32 id;

    require !isOperation(id);

    calldataarg args;
    f(e, args);

    assert isOperationPending(id) => (f.selector == schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector 
                                || f.selector == scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector), "Why do we need to follow the schedule?";
}


// STATUS - verified
// Possible transitions: form `ready()` to `isOperationDone()` via `execute()` and `executeBatch()` only
rule readyDoneTransition(method f, env e){
    bytes32 id;

    require isOperationReady(e, id);

    calldataarg args;
    f(e, args);

    assert isOperationDone(id) => f.selector == execute(address, uint256, bytes, bytes32, bytes32).selector  
                                || f.selector == executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector , "It's not isOperationDone yet!";
}


// STATUS - verified
// isOperationPending() -> cancelled() via cancel() only
rule pendingCancelledTransition(method f, env e){
    bytes32 id;

    require isOperationPending(id);

    calldataarg args;
    f(e, args);

    assert !isOperation(id) => f.selector == cancel(bytes32).selector, "How you dare to cancel me?";
}


// STATUS - verified
// isOperationDone() -> nowhere
rule doneToNothingTransition(method f, env e){
    bytes32 id;

    require isOperationDone(id);

    calldataarg args;
    f(e, args);

    assert isOperationDone(id), "Did you find a way to escape? There is no way! HA-HA-HA";
}



/////////////////////////////////////////////////////////////
// THE REST
/////////////////////////////////////////////////////////////


// STATUS - verified
// only TimelockController contract can change minDelay
rule minDelayOnlyChange(method f, env e){
    uint256 delayBefore = _minDelay();    

    calldataarg args;
    f(e, args);

    uint256 delayAfter = _minDelay();

    assert delayBefore != delayAfter => e.msg.sender == currentContract, "You cannot change your destiny! Only I can!";
}


// STATUS - verified
// scheduled operation timestamp == block.timestamp + delay (kind of unit test)
rule scheduleCheck(method f, env e){
    bytes32 id;

    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;

    hashIdCorrelation(id, target, value, data, predecessor, salt);

    schedule(e, target, value, data, predecessor, salt, delay);

    assert getTimestamp(id) == to_uint256(e.block.timestamp + delay), "Time doesn't obey to mortal souls";
}


// STATUS - verified
// Cannot call `execute()` on a isOperationPending (not ready) operation
rule cannotCallExecute(method f, env e){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    bytes32 id;

    hashIdCorrelation(id, target, value, data, predecessor, salt);
    require isOperationPending(id) && !isOperationReady(e, id);

    execute@withrevert(e, target, value, data, predecessor, salt);

    assert lastReverted, "you go against execution nature";
}


// STATUS - verified
// Cannot call `execute()` on a !isOperation operation
rule executeRevertsFromUnset(method f, env e, env e2){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    bytes32 id;

    hashIdCorrelation(id, target, value, data, predecessor, salt);
    require !isOperation(id);

    execute@withrevert(e, target, value, data, predecessor, salt);

    assert lastReverted, "you go against execution nature";
}


// STATUS - verified
// Execute reverts => state returns to isOperationPending
rule executeRevertsEffectCheck(method f, env e){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    bytes32 id;

    hashIdCorrelation(id, target, value, data, predecessor, salt);
    require isOperationPending(id) && !isOperationReady(e, id);

    execute@withrevert(e, target, value, data, predecessor, salt);
    bool reverted = lastReverted;

    assert lastReverted => isOperationPending(id) && !isOperationReady(e, id), "you go against execution nature";
}


// STATUS - verified
// Canceled operations cannot be executed → can’t move from canceled to isOperationDone
rule cancelledNotExecuted(method f, env e){
    bytes32 id;

    require !isOperation(id);
    require e.block.timestamp > 1;

    calldataarg args;
    f(e, args);

    assert !isOperationDone(id), "The ship is not a creature of the air";
}


// STATUS - verified
// Only proposers can schedule
rule onlyProposer(method f, env e) filtered { f -> f.selector == schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector
                                                    || f.selector == scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector } {
    bytes32 id;
    bytes32 role;
    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;

    _checkRole@withrevert(e, PROPOSER_ROLE());

    bool isCheckRoleReverted = lastReverted;

    calldataarg args;
    f@withrevert(e, args);

    bool isScheduleReverted = lastReverted;

    assert isCheckRoleReverted => isScheduleReverted, "Enemy was detected";
}


// STATUS - verified
// if `ready` then has waited minimum period after isOperationPending() 
rule cooldown(method f, env e, env e2){
    bytes32 id;
    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;
    uint256 minDelay = getMinDelay();

    hashIdCorrelation(id, target, value, data, predecessor, salt);

    schedule(e, target, value, data, predecessor, salt, delay);

    calldataarg args;
    f(e, args);

    assert isOperationReady(e2, id) => (e2.block.timestamp - e.block.timestamp >= minDelay), "No rush! When I'm ready, I'm ready";
}


// STATUS - verified
// `schedule()` should change only one id's timestamp
rule scheduleChange(env e){
    bytes32 id;  bytes32 otherId; 
    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;

    uint256 otherIdTimestampBefore = getTimestamp(otherId);

    hashIdCorrelation(id, target, value, data, predecessor, salt);

    schedule(e, target, value, data, predecessor, salt, delay);

    assert id != otherId => otherIdTimestampBefore == getTimestamp(otherId), "Master of puppets, I'm pulling your strings";
}


// STATUS - verified
// `execute()` should change only one id's timestamp
rule executeChange(env e){
    bytes32 id;  bytes32 otherId; 
    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt;
    uint256 otherIdTimestampBefore = getTimestamp(otherId);

    hashIdCorrelation(id, target, value, data, predecessor, salt);

    execute(e, target, value, data, predecessor, salt);

    assert id != otherId => otherIdTimestampBefore == getTimestamp(otherId), "Master of puppets, I'm pulling your strings";
}


// STATUS - verified
// `cancel()` should change only one id's timestamp
rule cancelChange(env e){
    bytes32 id;  bytes32 otherId; 

    uint256 otherIdTimestampBefore = getTimestamp(otherId);

    cancel(e, id);

    assert id != otherId => otherIdTimestampBefore == getTimestamp(otherId), "Master of puppets, I'm pulling your strings";
}
