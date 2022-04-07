methods {
    getTimestamp(bytes32) returns(uint256) envfree
    _DONE_TIMESTAMP() returns(uint256) envfree
    PROPOSER_ROLE() returns(bytes32) envfree
    _minDelay() returns(uint256) envfree
    getMinDelay() returns(uint256) envfree
    hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) returns(bytes32) envfree
    
    cancel(bytes32)
    schedule(address, uint256, bytes32, bytes32, bytes32, uint256)
    execute(address, uint256, bytes, bytes32, bytes32)
    executeBatch(address[], uint256[], bytes[], bytes32, bytes32)
    _checkRole(bytes32) => DISPATCHER(true)
}

////////////////////////////////////////////////////////////////////////////
//                       Definitions                                      //
////////////////////////////////////////////////////////////////////////////


definition unset(bytes32 id) returns bool =
    getTimestamp(id) == 0;

definition pending(bytes32 id) returns bool =
    getTimestamp(id) > _DONE_TIMESTAMP();

definition ready(bytes32 id, env e) returns bool =
    getTimestamp(id) > _DONE_TIMESTAMP() && getTimestamp(id) <= e.block.timestamp;

definition done(bytes32 id) returns bool =
    getTimestamp(id) == _DONE_TIMESTAMP();



////////////////////////////////////////////////////////////////////////////
//                         Functions                                      //
////////////////////////////////////////////////////////////////////////////


function hashIdCorrelation(bytes32 id, address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt){
    require data.length < 7;
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
//                           Ghosts                                       //
////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////
//                            Invariants                                  //
////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////
//                            Rules                                       //
////////////////////////////////////////////////////////////////////////////


rule keccakCheck(method f, env e){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    address targetRand; uint256 valueRand; bytes dataRand; bytes32 predecessorRand; bytes32 saltRand;

    require data.length < 7;
    // uint256 freshIndex;
    // require freshIndex <= data.length

    // require target != targetRand || value != valueRand || data[freshIndex] != dataRand[freshIndex] || predecessor != predecessorRand || salt != saltRand;

    bytes32 a = hashOperation(target, value, data, predecessor, salt);
    bytes32 b = hashOperation(target, value, data, predecessor, salt);
    // bytes32 c = hashOperation(targetRand, valueRand, dataRand, predecessorRand, saltRand);

    assert a == b, "hashes are different";
    // assert a != c, "hashes are the same";
}


/////////////////////////////////////////////////////////////
// STATE TRANSITIONS
/////////////////////////////////////////////////////////////


// STATUS - verified
// unset() -> unset() || pending() only
rule unsetPendingTransitionGeneral(method f, env e){
    bytes32 id;

    require unset(id);
    require e.block.timestamp > 1;

    calldataarg args;
    f(e, args);

    assert pending(id) || unset(id);
}


// STATUS - verified
// unset() -> pending() via schedule() and scheduleBatch() only
rule unsetPendingTransitionMethods(method f, env e){
    bytes32 id;

    require unset(id);

    calldataarg args;
    f(e, args);

    bool tmp = pending(id);

    assert pending(id) => (f.selector == schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector 
                                || f.selector == scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector), "Why do we need to follow the schedule?";
}


// STATUS - verified
// ready() -> done() via execute() and executeBatch() only
rule readyDoneTransition(method f, env e){
    bytes32 id;

    require ready(id, e);

    calldataarg args;
    f(e, args);

    assert done(id) => f.selector == execute(address, uint256, bytes, bytes32, bytes32).selector  
                                || f.selector == executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector , "It's not done yet!";
}


// STATUS - verified
// pending() -> cancelled() via cancel() only
rule pendingCancelledTransition(method f, env e){
    bytes32 id;

    require pending(id);

    calldataarg args;
    f(e, args);

    assert unset(id) => f.selector == cancel(bytes32).selector, "How you dare to cancel me?";
}


// STATUS - verified
// done() -> nowhere
rule doneToNothingTransition(method f, env e){
    bytes32 id;

    require done(id);

    calldataarg args;
    f(e, args);

    assert done(id), "Did you find a way to escape? There is no way! HA-HA-HA";
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


// STATUS - in progress 
// execute() is the only way to set timestamp to 1
rule getTimestampOnlyChange(method f, env e){
    bytes32 id;
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt; uint256 delay;
    address[] targets; uint256[] values; bytes[] datas;

    require (targets[0] == target && values[0] == value && datas[0] == data)
                || (targets[1] == target && values[1] == value && datas[1] == data)
                || (targets[2] == target && values[2] == value && datas[2] == data);

    hashIdCorrelation(id, target, value, data, predecessor, salt);

    executionsCall(f, e, target, value, data, predecessor, salt, delay, targets, values, datas);

    assert getTimestamp(id) == 1 => f.selector == execute(address, uint256, bytes, bytes32, bytes32).selector  
                                        || f.selector == executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector, "Did you find a way to break the system?";
}


// STATUS - verified
// scheduled operation timestamp == block.timestamp + delay (kind of unit test)
rule scheduleCheck(method f, env e){
    bytes32 id;

    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;

    require getTimestamp(id) < e.block.timestamp;
    hashIdCorrelation(id, target, value, data, predecessor, salt);

    schedule(e, target, value, data, predecessor, salt, delay);

    assert getTimestamp(id) == to_uint256(e.block.timestamp + delay), "Time doesn't obey to mortal souls";
}


// STATUS - verified
// Cannot call execute on a pending (not ready) operation
rule cannotCallExecute(method f, env e){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    bytes32 id;

    hashIdCorrelation(id, target, value, data, predecessor, salt);
    require pending(id) && !ready(id, e);

    execute@withrevert(e, target, value, data, predecessor, salt);

    assert lastReverted, "you go against execution nature";
}


// STATUS - verified
// in unset() execute() reverts
rule executeRevertsFromUnset(method f, env e, env e2){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    bytes32 id;

    hashIdCorrelation(id, target, value, data, predecessor, salt);
    require unset(id);

    execute@withrevert(e, target, value, data, predecessor, salt);

    assert lastReverted, "you go against execution nature";
}


// STATUS - verified
// Execute reverts => state returns to pending
rule executeRevertsEffectCheck(method f, env e){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    bytes32 id;

    hashIdCorrelation(id, target, value, data, predecessor, salt);
    require pending(id) && !ready(id, e);

    execute@withrevert(e, target, value, data, predecessor, salt);
    bool reverted = lastReverted;

    assert lastReverted => pending(id) && !ready(id, e), "you go against execution nature";
}


// STATUS - verified
// Canceled operations cannot be executed → can’t move from canceled to ready
rule cancelledNotExecuted(method f, env e){
    bytes32 id;

    require unset(id);
    require e.block.timestamp > 1;

    calldataarg args;
    f(e, args);

    assert !done(id), "The ship is not a creature of the air";
}


// STATUS - broken
// Only proposers can schedule an operation
rule onlyProposerCertorafallbackFail(method f, env e) filtered { f -> f.selector == schedule(address, uint256, bytes32, bytes32, bytes32, uint256).selector
                                                    || f.selector == scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector } {
    bytes32 id;
    bytes32 role;
    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;

    // hashIdCorrelation(id, target, value, data, predecessor, salt);

    _checkRole@withrevert(e, PROPOSER_ROLE());

    bool isCheckRoleReverted = lastReverted;
    
    // schedule@withrevert(e, target, value, data, predecessor, salt, delay);

    calldataarg args;
    f@withrevert(e, args);

    bool isScheduleReverted = lastReverted;

    assert isCheckRoleReverted => isScheduleReverted, "Enemy was detected";
}


// STATUS - verified
// Only proposers can schedule an operation
rule onlyProposer1(method f, env e){
    bytes32 id;
    bytes32 role;
    // address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;
    address[] targets; uint256[] values; bytes[] datas; bytes32 predecessor;  bytes32 salt; uint256 delay;

    // hashIdCorrelation(id, target, value, data, predecessor, salt);

    _checkRole@withrevert(e, PROPOSER_ROLE());

    bool isCheckRoleReverted = lastReverted;
    
    // schedule@withrevert(e, target, value, data, predecessor, salt, delay);
    scheduleBatch@withrevert(e, targets, values, datas, predecessor, salt, delay);

    bool isScheduleReverted = lastReverted;

    assert isCheckRoleReverted => isScheduleReverted, "Enemy was detected";
}


// STATUS - in progress
// Ready = has waited minimum period after pending 
rule cooldown(method f, env e, env e2){
    bytes32 id;

    require unset(id);

    calldataarg args;
    f(e, args);

    // e.block.timestamp - delay > time scheduled => ready()
    assert e.block.timestamp >= getTimestamp(id) => ready(id, e), "No rush! When I'm ready, I'm ready";
}