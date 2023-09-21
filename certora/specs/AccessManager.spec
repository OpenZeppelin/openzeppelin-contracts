import "helpers/helpers.spec";
import "methods/IAccessManager.spec";

methods {
    // FV
    function canCall_1(address,address,bytes4)     external returns (bool);
    function canCall_2(address,address,bytes4)     external returns (uint32);
    function hasRole_1(uint64,address)             external returns (bool);
    function hasRole_2(uint64,address)             external returns (uint32);
    function getAccess_1(uint64,address)           external returns (uint48);
    function getAccess_2(uint64,address)           external returns (uint32);
    function getAccess_3(uint64,address)           external returns (uint32);
    function getAccess_4(uint64,address)           external returns (uint48);
    function getTargetAdminDelay_1(address target) external returns (uint32);
    function getTargetAdminDelay_2(address target) external returns (uint32);
    function getTargetAdminDelay_3(address target) external returns (uint48);
    function getRoleGrantDelay_2(uint64 roleId)    external returns (uint32);
    function getRoleGrantDelay_3(uint64 roleId)    external returns (uint48);
    function hashExecutionId(address,bytes4)       external returns (bytes32) envfree;
    function executionId()                         external returns (bytes32) envfree;
    function getSelector(bytes)                    external returns (bytes4)  envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition clock(env e) returns mathint =
    to_mathint(e.block.timestamp);

definition envsanity(env e) returns bool =
    clock(e) <= max_uint48;

definition isSetAndPast(env e, uint48 timepoint) returns bool =
    timepoint != 0 && to_mathint(timepoint) <= clock(e);

definition isOnlyAuthorized(method f) returns bool =
    f.selector == sig:labelRole(uint64,string).selector                       ||
    f.selector == sig:setRoleAdmin(uint64,uint64).selector                    ||
    f.selector == sig:setRoleGuardian(uint64,uint64).selector                 ||
    f.selector == sig:setGrantDelay(uint64,uint32).selector                   ||
    f.selector == sig:setTargetAdminDelay(address,uint32).selector            ||
    f.selector == sig:updateAuthority(address,address).selector               ||
    f.selector == sig:setTargetClosed(address,bool).selector                  ||
    f.selector == sig:setTargetFunctionRole(address,bytes4[],uint64).selector ||
    f.selector == sig:grantRole(uint64,address,uint32).selector               ||
    f.selector == sig:revokeRole(uint64,address).selector;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: executionId must be clean when not in the middle of a call                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant cleanExecutionId()
    executionId() == to_bytes32(0);

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: public role                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant publicRole(env e, address account)
    hasRole_1(e, PUBLIC_ROLE(), account)        &&
    hasRole_2(e, PUBLIC_ROLE(), account)   == 0 &&
    getAccess_1(e, PUBLIC_ROLE(), account) == 0 &&
    getAccess_2(e, PUBLIC_ROLE(), account) == 0 &&
    getAccess_3(e, PUBLIC_ROLE(), account) == 0 &&
    getAccess_4(e, PUBLIC_ROLE(), account) == 0;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: hasRole is consistent with getAccess                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant hasRoleGetAccessConsistency(env e, uint64 roleId, address account)
    hasRole_1(e, roleId, account) == (roleId == PUBLIC_ROLE() || isSetAndPast(e, getAccess_1(e, roleId, account))) &&
    hasRole_2(e, roleId, account) == getAccess_2(e, roleId, account);

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Functions: canCall, getAccess and hasRole do NOT revert                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noRevert(env e) {
    require nonpayable(e);
    require envsanity(e);

    address caller;
    address target;
    bytes4 selector;
    uint64 roleId;

    canCall@withrevert(e, caller, target, selector);
    assert !lastReverted;

    getAccess@withrevert(e, roleId, caller);
    assert !lastReverted;

    hasRole@withrevert(e, roleId, caller);
    assert !lastReverted;

    isTargetClosed@withrevert(target);
    assert !lastReverted;

    getTargetFunctionRole@withrevert(target, selector);
    assert !lastReverted;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Functions: canCall                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule canCall(env e) {
    address caller;
    address target;
    bytes4 selector;

    // Get relevant values
    bool   immediate    = canCall_1(e, caller, target, selector);
    uint32 delay        = canCall_2(e, caller, target, selector);
    bool   closed       = isTargetClosed(target);
    uint64 roleId       = getTargetFunctionRole(target, selector);
    bool   isMember     = hasRole_1(e, roleId, caller);
    uint32 currentDelay = hasRole_2(e, roleId, caller);

    // Can only execute without delay in specific cases:
    // - target not closed
    // - if self-execution: `executionId` must match
    // - if third party execution: must be member with no delay
    assert immediate <=> (
        !closed &&
        (
            (caller == currentContract && executionId() == hashExecutionId(target, selector))
            ||
            (caller != currentContract && isMember && currentDelay == 0)
        )
    );

    // Can only execute with delay in specific cases:
    // - target not closed
    // - third party execution
    // - caller is a member and has an execution delay
    assert delay > 0 <=> (
        !closed &&
        caller != currentContract &&
        isMember &&
        currentDelay > 0
    );

    // If there is a delay, then it must be the caller's execution delay
    assert delay > 0 => delay == currentDelay;

    // Immediate execute means no delayed execution
    assert immediate => delay == 0;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ State transitions: getAccess                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getAccessChangeTime(uint64 roleId, address account) {
    env e1;
    env e2;

    // values before
    mathint getAccess1Before = getAccess_1(e1, roleId, account);
    mathint getAccess2Before = getAccess_2(e1, roleId, account);
    mathint getAccess3Before = getAccess_3(e1, roleId, account);
    mathint getAccess4Before = getAccess_4(e1, roleId, account);

    // time pass: e1 → e2
    require clock(e1) <= clock(e2);

    // values after
    mathint getAccess1After  = getAccess_1(e2, roleId, account);
    mathint getAccess2After  = getAccess_2(e2, roleId, account);
    mathint getAccess3After  = getAccess_3(e2, roleId, account);
    mathint getAccess4After  = getAccess_4(e2, roleId, account);

    // member "since" cannot change as a consequence of time passing
    assert getAccess1Before == getAccess1After;

    // any change of any other value should be a consequence of the effect timepoint being reached
    assert (
        getAccess2Before != getAccess2After ||
        getAccess3Before != getAccess3After ||
        getAccess4Before != getAccess4After
    ) => (
        getAccess4Before != 0 &&
        getAccess4Before >  clock(e1) &&
        getAccess4Before <= clock(e2) &&
        getAccess2After  == getAccess3Before &&
        getAccess3After  == 0 &&
        getAccess4After  == 0
    );
}

rule getAccessChangeCall(uint64 roleId, address account) {
    env e;

    // values before
    mathint getAccess1Before = getAccess_1(e, roleId, account);
    mathint getAccess2Before = getAccess_2(e, roleId, account);
    mathint getAccess3Before = getAccess_3(e, roleId, account);
    mathint getAccess4Before = getAccess_4(e, roleId, account);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values before
    mathint getAccess1After = getAccess_1(e, roleId, account);
    mathint getAccess2After = getAccess_2(e, roleId, account);
    mathint getAccess3After = getAccess_3(e, roleId, account);
    mathint getAccess4After = getAccess_4(e, roleId, account);

    // transitions
    assert (
        getAccess1Before != getAccess1After ||
        getAccess2Before != getAccess2After ||
        getAccess3Before != getAccess3After ||
        getAccess4Before != getAccess4After
    ) => (
        (
            f.selector == sig:grantRole(uint64,address,uint32).selector &&
            getAccess1After != 0
        ) || (
            f.selector == sig:revokeRole(uint64,address).selector       &&
            getAccess1After != 0
        ) || (
            f.selector == sig:renounceRole(uint64,address).selector     &&
            getAccess1After == 0                                        &&
            getAccess2After == 0                                        &&
            getAccess3After == 0                                        &&
            getAccess4After == 0
        )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ State transitions: isTargetClosed                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule isTargetClosedChangeTime(address target) {
    env e1;
    env e2;

    // values before
    bool isClosedBefore = isTargetClosed(e1, target);

    // time pass: e1 → e2
    require clock(e1) <= clock(e2);

    // values after
    bool isClosedAfter = isTargetClosed(e2, target);

    // transitions
    assert isClosedBefore == isClosedAfter;
}

rule isTargetClosedChangeCall(address target) {
    env e;

    // values before
    bool isClosedBefore = isTargetClosed(e, target);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values after
    bool isClosedAfter = isTargetClosed(e, target);

    // transitions
    assert isClosedBefore != isClosedAfter => (
        f.selector == sig:setTargetClosed(address,bool).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ State transitions: getTargetFunctionRole                                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getTargetFunctionRoleChangeTime(address target, bytes4 selector) {
    env e1;
    env e2;

    // values before
    mathint roleIdBefore = getTargetFunctionRole(e1, target, selector);

    // time pass: e1 → e2
    require clock(e1) <= clock(e2);

    // values after
    mathint roleIdAfter = getTargetFunctionRole(e2, target, selector);

    // transitions
    assert roleIdBefore == roleIdAfter;
}

rule getTargetFunctionRoleChangeCall(address target, bytes4 selector) {
    env e;

    // values before
    mathint roleIdBefore = getTargetFunctionRole(e, target, selector);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values after
    mathint roleIdAfter = getTargetFunctionRole(e, target, selector);

    // transitions
    assert roleIdBefore != roleIdAfter => (
        f.selector == sig:setTargetFunctionRole(address,bytes4[],uint64).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ State transitions: getTargetAdminDelay                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getTargetAdminDelayChangeTime(address target) {
    env e1;
    env e2;

    // values before
    mathint delayBefore        = getTargetAdminDelay(e1, target);
    mathint delayPendingBefore = getTargetAdminDelay_2(e1, target);
    mathint delayEffectBefore  = getTargetAdminDelay_3(e1, target);

    // time pass: e1 → e2
    require clock(e1) <= clock(e2);

    // values after
    mathint delayAfter        = getTargetAdminDelay(e2, target);
    mathint delayPendingAfter = getTargetAdminDelay_2(e2, target);
    mathint delayEffectAfter  = getTargetAdminDelay_3(e2, target);

    assert (
        delayBefore        != delayAfter        ||
        delayPendingBefore != delayPendingAfter ||
        delayEffectBefore  != delayEffectAfter
    ) => (
        delayEffectBefore >  clock(e1)          &&
        delayEffectBefore <= clock(e2)          &&
        delayAfter        == delayPendingBefore &&
        delayPendingAfter == 0                  &&
        delayEffectAfter  == 0
    );
}

rule getTargetAdminDelayChangeCall(address target) {
    env e;

    // values before
    mathint delayBefore        = getTargetAdminDelay(e, target);
    mathint delayPendingBefore = getTargetAdminDelay_2(e, target);
    mathint delayEffectBefore  = getTargetAdminDelay_3(e, target);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values after
    mathint delayAfter        = getTargetAdminDelay(e, target);
    mathint delayPendingAfter = getTargetAdminDelay_2(e, target);
    mathint delayEffectAfter  = getTargetAdminDelay_3(e, target);

    // transitions
    assert (
        delayBefore        != delayAfter        ||
        delayPendingBefore != delayPendingAfter ||
        delayEffectBefore  != delayEffectAfter
    ) => (
        f.selector       == sig:setTargetAdminDelay(address,uint32).selector &&
        delayAfter       >= delayBefore &&
        delayEffectAfter >= clock(e)
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ State transitions: getRoleGrantDelay                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getRoleGrantDelayChangeTime(uint64 roleId) {
    env e1;
    env e2;

    // values before
    mathint delayBefore        = getRoleGrantDelay(e1, roleId);
    mathint delayPendingBefore = getRoleGrantDelay_2(e1, roleId);
    mathint delayEffectBefore  = getRoleGrantDelay_3(e1, roleId);

    // time pass: e1 → e2
    require clock(e1) <= clock(e2);

    // values after
    mathint delayAfter        = getRoleGrantDelay(e2, roleId);
    mathint delayPendingAfter = getRoleGrantDelay_2(e2, roleId);
    mathint delayEffectAfter  = getRoleGrantDelay_3(e2, roleId);

    assert (
        delayBefore        != delayAfter        ||
        delayPendingBefore != delayPendingAfter ||
        delayEffectBefore  != delayEffectAfter
    ) => (
        delayEffectBefore >  clock(e1) &&
        delayEffectBefore <= clock(e2) &&
        delayAfter        == delayPendingBefore     &&
        delayPendingAfter == 0                      &&
        delayEffectAfter  == 0
    );
}

rule getRoleGrantDelayChangeCall(uint64 roleId) {
    env e;

    // values before
    mathint delayBefore        = getRoleGrantDelay(e, roleId);
    mathint delayPendingBefore = getRoleGrantDelay_2(e, roleId);
    mathint delayEffectBefore  = getRoleGrantDelay_3(e, roleId);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values after
    mathint delayAfter        = getRoleGrantDelay(e, roleId);
    mathint delayPendingAfter = getRoleGrantDelay_2(e, roleId);
    mathint delayEffectAfter  = getRoleGrantDelay_3(e, roleId);

    // transitions
    assert (
        delayBefore        != delayAfter        ||
        delayPendingBefore != delayPendingAfter ||
        delayEffectBefore  != delayEffectAfter
    ) => (
        f.selector       == sig:setGrantDelay(uint64,uint32).selector &&
        delayAfter       >= delayBefore &&
        delayEffectAfter >= clock(e)
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ State transitions: getRoleAdmin & getRoleGuardian                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getRoleAdminChangeCall(uint64 roleId) {
    // values before
    mathint adminIdBefore = getRoleAdmin(roleId);

    // arbitrary function call
    env e; method f; calldataarg args; f(e, args);

    // values after
    mathint adminIdAfter = getRoleAdmin(roleId);

    // transitions
    assert adminIdBefore != adminIdAfter => f.selector == sig:setRoleAdmin(uint64,uint64).selector;
}

rule getRoleGuardianChangeCall(uint64 roleId) {
    // values before
    mathint guardianIdBefore = getRoleGuardian(roleId);

    // arbitrary function call
    env e; method f; calldataarg args; f(e, args);

    // values after
    mathint guardianIdAfter = getRoleGuardian(roleId);

    // transitions
    assert guardianIdBefore != guardianIdAfter => (
        f.selector == sig:setRoleGuardian(uint64,uint64).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ State transitions: getNonce                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getNonceChangeCall(bytes32 operationId) {
    // values before
    mathint nonceBefore = getNonce(operationId);

    // reasonable assumption
    require nonceBefore < max_uint32;

    // arbitrary function call
    env e; method f; calldataarg args; f(e, args);

    // values after
    mathint nonceAfter = getNonce(operationId);

    // transitions
    assert nonceBefore != nonceAfter => (
        f.selector == sig:schedule(address,bytes,uint48).selector &&
        nonceAfter == nonceBefore + 1
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ State transitions: getSchedule                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getScheduleChangeTime(bytes32 operationId) {
    env e1;
    env e2;

    // values before
    mathint scheduleBefore = getSchedule(e1, operationId);

    // time pass: e1 → e2
    require clock(e1) <= clock(e2);

    // values after
    mathint scheduleAfter = getSchedule(e2, operationId);

    // transition
    assert scheduleBefore != scheduleAfter => (
        scheduleBefore + expiration() >  clock(e1) &&
        scheduleBefore + expiration() <= clock(e2) &&
        scheduleAfter == 0
    );
}

rule getScheduleChangeCall(bytes32 operationId) {
    env e;

    // values before
    mathint scheduleBefore = getSchedule(e, operationId);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values after
    mathint scheduleAfter = getSchedule(e, operationId);

    // transitions
    assert scheduleBefore != scheduleAfter => (
        (f.selector == sig:schedule(address,bytes,uint48).selector    && scheduleAfter >= clock(e)) ||
        (f.selector == sig:execute(address,bytes).selector            && scheduleAfter == 0       ) ||
        (f.selector == sig:cancel(address,address,bytes).selector     && scheduleAfter == 0       ) ||
        (f.selector == sig:consumeScheduledOp(address,bytes).selector && scheduleAfter == 0       ) ||
        (isOnlyAuthorized(f)                                          && scheduleAfter == 0       )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Functions: restricted functions can only be called by owner                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule restrictedFunctions(env e) {
    require nonpayable(e);
    require envsanity(e);

    method f;
    calldataarg args;

    f(e,args);

    assert (
        f.selector == sig:labelRole(uint64,string).selector ||
        f.selector == sig:setRoleAdmin(uint64,uint64).selector ||
        f.selector == sig:setRoleGuardian(uint64,uint64).selector ||
        f.selector == sig:setGrantDelay(uint64,uint32).selector ||
        f.selector == sig:setTargetAdminDelay(address,uint32).selector ||
        f.selector == sig:updateAuthority(address,address).selector ||
        f.selector == sig:setTargetClosed(address,bool).selector ||
        f.selector == sig:setTargetFunctionRole(address,bytes4[],uint64).selector
    ) => (
        hasRole_1(e, ADMIN_ROLE(), e.msg.sender) || e.msg.sender == currentContract
    );
}

rule restrictedFunctionsGrantRole(env e) {
    require nonpayable(e);
    require envsanity(e);

    uint64 roleId;
    address account;
    uint32 executionDelay;

    // We want to check that the caller has the admin role before we possibly grant it.
    bool hasAdminRoleBefore = hasRole_1(e, getRoleAdmin(roleId), e.msg.sender);

    grantRole(e, roleId, account, executionDelay);

    assert hasAdminRoleBefore || e.msg.sender == currentContract;
}

rule restrictedFunctionsRevokeRole(env e) {
    require nonpayable(e);
    require envsanity(e);

    uint64 roleId;
    address account;

    // This is needed if roleId is self-administered, the `revokeRole` call could target
    // e.msg.sender and remove the bery role that is necessary authorizing the call.
    bool hasAdminRoleBefore = hasRole_1(e, getRoleAdmin(roleId), e.msg.sender);

    revokeRole(e, roleId, account);

    assert hasAdminRoleBefore || e.msg.sender == currentContract;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Functions: canCall delay is enforced for calls to execute (only for others target)                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// getScheduleChangeCall proves that only {schedule} can set the delay to a non 0 value
rule callDelayEnforce_scheduleInTheFuture(env e) {
    address target;
    bytes   data;
    uint48  when;

    // Condition: calling a third party with a delay
    mathint delay = canCall_2(e, e.msg.sender, target, getSelector(data));
    require target != currentContract && delay > 0;

    // Schedule
    schedule(e, target, data, when);

    // Get operation schedule
    mathint schedule = getSchedule(e, hashOperation(e.msg.sender, target, data));

    // Schedule is far enough in the future
    assert schedule >= clock(e) + delay;
}

rule callDelayEnforce_executeAfterDelay(env e) {
    address target;
    bytes   data;

    // Condition: calling a third party with a delay
    mathint delay = canCall_2(e, e.msg.sender, target, getSelector(data));
    require target != currentContract && delay > 0;

    // Get operation schedule
    mathint schedule = getSchedule(e, hashOperation(e.msg.sender, target, data));

    // Do call
    execute@withrevert(e, target, data);

    // Can only execute is delay is set and has passed
    assert !lastReverted => (schedule != 0 && schedule <= clock(e));
}