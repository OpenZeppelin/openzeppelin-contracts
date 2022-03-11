using AccessControlHarness as AC

methods {
    getTimestamp(bytes32) returns(uint256) envfree
    _DONE_TIMESTAMP() returns(uint256) envfree
    _minDelay() returns(uint256) envfree
    getMinDelay() returns(uint256) envfree
    
    cancel(bytes32)
    schedule(address, uint256, bytes, bytes32, bytes32, uint256)
    execute(address, uint256, bytes, bytes32, bytes32)

    hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) returns(bytes32) envfree // => uniqueHashGhost(target, value, data, predecessor, salt)
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
    require data.length < 3;
    require hashOperation(target, value, data, predecessor, salt) == id;
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
    address target;
    uint256 value;
    bytes data;
    bytes32 predecessor;
    bytes32 salt;

    require data.length < 3;

    bytes32 a = hashOperation(target, value, data, predecessor, salt);
    bytes32 b = hashOperation(target, value, data, predecessor, salt);

    assert a == b, "hashes are different";
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

    assert pending(id) => f.selector == schedule(address, uint256, bytes, bytes32, bytes32, uint256).selector 
                                || f.selector == scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256).selector , "Why do we need to follow the schedule?";
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
// only TimelockController contract can change minDealy
rule minDealyOnlyChange(method f, env e){
    uint256 delayBefore = _minDelay();    

    calldataarg args;
    f(e, args);

    uint256 delayAfter = _minDelay();

    assert delayBefore != delayAfter => e.msg.sender == currentContract, "You cannot change your destiny! Only I can!";
}


// STATUS - verified
// Only proposers can schedule an operation
rule scheduleOnlyWay(method f, env e){
    uint256 delayBefore = _minDelay();    

    calldataarg args;
    f(e, args);

    uint256 delayAfter = _minDelay();

    assert delayBefore != delayAfter => e.msg.sender == currentContract, "You cannot change your destiny! Only I can!";
}


// STATUS - in progress (need working hash)
// execute() is the only way to set timestamp to 1
rule getTimestampOnlyChange(method f, env e){
    bytes32 id;
    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;

    require getTimestamp(id) != 1;
    hashIdCorrelation(id, target, value, data, predecessor, salt);

    calldataarg args;
    // write helper function with values from hashOperation() call;
    f(e, args);

    assert getTimestamp(id) == 1 => f.selector == execute(address, uint256, bytes, bytes32, bytes32).selector  
                                        || f.selector == executeBatch(address[], uint256[], bytes[], bytes32, bytes32).selector , "Did you find a way to break the system?";
}


// STATUS - in progress (need working hash)
// scheduled operation timestamp == block.timestamp + delay (kind of unit test)
rule scheduleCheck(method f, env e){
    bytes32 id;

    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;

    require getTimestamp(id) < e.block.timestamp;
    // require getMinDelay() > 0;  
    hashIdCorrelation(id, target, value, data, predecessor, salt);

    schedule(e, target, value, data, predecessor, salt, delay);

    assert getTimestamp(id) == to_uint256(e.block.timestamp + getMinDelay()), "Time doesn't obey to mortal souls";
}


// STATUS - in progress (need working hash)
// Cannot call execute on a pending (not ready) operation
rule cannotCallExecute(method f, env e){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    bytes32 id;

    hashIdCorrelation(id, target, value, data, predecessor, salt);
    require pending(id) && !ready(id, e);

    execute@withrevert(e, target, value, data, predecessor, salt);

    assert lastReverted, "you go against execution nature";
}


// STATUS - in progress (need working hash)
// in unset() execute() reverts
rule executeRevertFromUnset(method f, env e){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    bytes32 id;

    hashIdCorrelation(id, target, value, data, predecessor, salt);
    require unset(id);

    execute@withrevert(e, target, value, data, predecessor, salt);

    assert lastReverted, "you go against execution nature";
}


// STATUS - verified
// Execute reverts => state returns to pending
rule executeRevertEffectCheck(method f, env e){
    address target; uint256 value; bytes data; bytes32 predecessor; bytes32 salt;
    bytes32 id;

    hashIdCorrelation(id, target, value, data, predecessor, salt);
    require pending(id) && !ready(id, e);

    execute@withrevert(e, target, value, data, predecessor, salt);

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


// STATUS - in progress (need working hash)
// Only proposers can schedule an operation
rule onlyProposer(method f, env e){
    bytes32 id;
    bytes32 role;
    address target; uint256 value; bytes data ;bytes32 predecessor; bytes32 salt; uint256 delay;

    require unset(id);
    hashIdCorrelation(id, target, value, data, predecessor, salt);

    AC._checkRole@withrevert(e, role);

    bool isCheckRoleReverted = lastReverted;
    
    schedule@withrevert(e, target, value, data, predecessor, salt, delay);

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