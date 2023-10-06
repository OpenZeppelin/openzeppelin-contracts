import "helpers/helpers.spec";
import "methods/IAccessManager.spec";

methods {
    // FV
    function canCall_immediate(address,address,bytes4)        external returns (bool);
    function canCall_delay(address,address,bytes4)            external returns (uint32);
    function canCallExtended(address,address,bytes)           external returns (bool,uint32);
    function canCallExtended_immediate(address,address,bytes) external returns (bool);
    function canCallExtended_delay(address,address,bytes)     external returns (uint32);
    function getAdminRestrictions_restricted(bytes)           external returns (bool);
    function getAdminRestrictions_roleAdminId(bytes)          external returns (uint64);
    function getAdminRestrictions_executionDelay(bytes)       external returns (uint32);
    function hasRole_isMember(uint64,address)                 external returns (bool);
    function hasRole_executionDelay(uint64,address)           external returns (uint32);
    function getAccess_since(uint64,address)                  external returns (uint48);
    function getAccess_currentDelay(uint64,address)           external returns (uint32);
    function getAccess_pendingDelay(uint64,address)           external returns (uint32);
    function getAccess_effect(uint64,address)                 external returns (uint48);
    function getTargetAdminDelay_after(address target)        external returns (uint32);
    function getTargetAdminDelay_effect(address target)       external returns (uint48);
    function getRoleGrantDelay_after(uint64 roleId)           external returns (uint32);
    function getRoleGrantDelay_effect(uint64 roleId)          external returns (uint48);
    function hashExecutionId(address,bytes4)                  external returns (bytes32) envfree;
    function executionId()                                    external returns (bytes32) envfree;
    function getSelector(bytes)                               external returns (bytes4)  envfree;
    function getFirstArgumentAsAddress(bytes)                 external returns (address) envfree;
    function getFirstArgumentAsUint64(bytes)                  external returns (uint64)  envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition isOnlyAuthorized(bytes4 selector) returns bool =
    selector == to_bytes4(sig:labelRole(uint64,string).selector                      ) ||
    selector == to_bytes4(sig:setRoleAdmin(uint64,uint64).selector                   ) ||
    selector == to_bytes4(sig:setRoleGuardian(uint64,uint64).selector                ) ||
    selector == to_bytes4(sig:setGrantDelay(uint64,uint32).selector                  ) ||
    selector == to_bytes4(sig:setTargetAdminDelay(address,uint32).selector           ) ||
    selector == to_bytes4(sig:updateAuthority(address,address).selector              ) ||
    selector == to_bytes4(sig:setTargetClosed(address,bool).selector                 ) ||
    selector == to_bytes4(sig:setTargetFunctionRole(address,bytes4[],uint64).selector) ||
    selector == to_bytes4(sig:grantRole(uint64,address,uint32).selector              ) ||
    selector == to_bytes4(sig:revokeRole(uint64,address).selector                    );

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
    hasRole_isMember(e, PUBLIC_ROLE(), account)        &&
    hasRole_executionDelay(e, PUBLIC_ROLE(), account)   == 0 &&
    getAccess_since(e, PUBLIC_ROLE(), account) == 0 &&
    getAccess_currentDelay(e, PUBLIC_ROLE(), account) == 0 &&
    getAccess_pendingDelay(e, PUBLIC_ROLE(), account) == 0 &&
    getAccess_effect(e, PUBLIC_ROLE(), account) == 0;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: hasRole is consistent with getAccess                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant hasRoleGetAccessConsistency(env e, uint64 roleId, address account)
    hasRole_isMember(e, roleId, account) == (roleId == PUBLIC_ROLE() || isSetAndPast(e, getAccess_since(e, roleId, account))) &&
    hasRole_executionDelay(e, roleId, account) == getAccess_currentDelay(e, roleId, account);

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Functions: canCall, canCallExtended, getAccess, hasRole, isTargetClosed and getTargetFunctionRole do NOT revert     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noRevert(env e) {
    require nonpayable(e);
    require sanity(e);

    address caller;
    address target;
    bytes   data;
    bytes4  selector;
    uint64  roleId;

    canCall@withrevert(e, caller, target, selector);
    assert !lastReverted;

    // require data.length <= max_uint64;
    //
    // canCallExtended@withrevert(e, caller, target, data);
    // assert !lastReverted;

    getAccess@withrevert(e, roleId, caller);
    assert !lastReverted;

    hasRole@withrevert(e, roleId, caller);
    assert !lastReverted;

    isTargetClosed@withrevert(target);
    assert !lastReverted;

    getTargetFunctionRole@withrevert(target, selector);
    assert !lastReverted;

    // Not covered:
    // - getAdminRestrictions (_1, _2 & _3)
    // - getSelector
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Functions: admin restrictions are correct                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getAdminRestrictions(env e, bytes data) {
    bool   restricted = getAdminRestrictions_restricted(e, data);
    uint64 roleId     = getAdminRestrictions_roleAdminId(e, data);
    uint32 delay      = getAdminRestrictions_executionDelay(e, data);
    bytes4 selector   = getSelector(data);

    if (data.length < 4) {
        assert restricted == false;
        assert roleId     == 0;
        assert delay      == 0;
    } else {
        assert restricted ==
            isOnlyAuthorized(selector);

        assert roleId == (
            (restricted && selector == to_bytes4(sig:grantRole(uint64,address,uint32).selector)) ||
            (restricted && selector == to_bytes4(sig:revokeRole(uint64,address).selector      ))
            ? getRoleAdmin(getFirstArgumentAsUint64(data))
            : ADMIN_ROLE()
        );

        assert delay == (
            (restricted && selector == to_bytes4(sig:updateAuthority(address,address).selector              )) ||
            (restricted && selector == to_bytes4(sig:setTargetClosed(address,bool).selector                 )) ||
            (restricted && selector == to_bytes4(sig:setTargetFunctionRole(address,bytes4[],uint64).selector))
            ? getTargetAdminDelay(e, getFirstArgumentAsAddress(data))
            : 0
        );
    }
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
    bool   immediate    = canCall_immediate(e, caller, target, selector);
    uint32 delay        = canCall_delay(e, caller, target, selector);
    bool   closed       = isTargetClosed(target);
    uint64 roleId       = getTargetFunctionRole(target, selector);
    bool   isMember     = hasRole_isMember(e, roleId, caller);
    uint32 currentDelay = hasRole_executionDelay(e, roleId, caller);

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
│ Functions: canCallExtended                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule canCallExtended(env e) {
    address caller;
    address target;
    bytes   data;
    bytes4  selector = getSelector(data);

    bool   immediate      = canCallExtended_immediate(e, caller, target, data);
    uint32 delay          = canCallExtended_delay(e, caller, target, data);
    bool   enabled        = getAdminRestrictions_restricted(e, data);
    uint64 roleId         = getAdminRestrictions_roleAdminId(e, data);
    uint32 operationDelay = getAdminRestrictions_executionDelay(e, data);
    bool   inRole         = hasRole_isMember(e, roleId, caller);
    uint32 executionDelay = hasRole_executionDelay(e, roleId, caller);

    if (target == currentContract) {
        // Can only execute without delay in the specific cases:
        // - caller is the AccessManager and the executionId is set
        // or
        // - data matches an admin restricted function
        // - caller has the necessary role
        // - operation delay is not set
        // - execution delay is not set
        assert immediate <=> (
            (
                caller         == currentContract &&
                data.length    >= 4               &&
                executionId()  == hashExecutionId(target, selector)
            ) || (
                caller         != currentContract &&
                enabled                           &&
                inRole                            &&
                operationDelay == 0               &&
                executionDelay == 0
            )
        );

        // Immediate execute means no delayed execution
        // This is equivalent to "delay > 0 => !immediate"
        assert immediate => delay == 0;

        // Can only execute with delay in specific cases:
        // - caller is a third party
        // - data matches an admin restricted function
        // - caller has the necessary role
        // -operation delay or execution delay is set
        assert delay > 0 <=> (
            caller != currentContract &&
            enabled                   &&
            inRole                    &&
            (operationDelay > 0 || executionDelay > 0)
        );

        // If there is a delay, then it must be the maximum of caller's execution delay and the operation delay
        assert delay > 0 => to_mathint(delay) == max(operationDelay, executionDelay);
    } else if (data.length < 4) {
        assert immediate == false;
        assert delay     == 0;
    } else {
        // results are equivalent when targeting third party contracts
        assert immediate == canCall_immediate(e, caller, target, selector);
        assert delay     == canCall_delay(e, caller, target, selector);
    }
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
    mathint getAccess1Before = getAccess_since(e1, roleId, account);
    mathint getAccess2Before = getAccess_currentDelay(e1, roleId, account);
    mathint getAccess3Before = getAccess_pendingDelay(e1, roleId, account);
    mathint getAccess4Before = getAccess_effect(e1, roleId, account);

    // time pass: e1 → e2
    require clock(e1) <= clock(e2);

    // values after
    mathint getAccess1After  = getAccess_since(e2, roleId, account);
    mathint getAccess2After  = getAccess_currentDelay(e2, roleId, account);
    mathint getAccess3After  = getAccess_pendingDelay(e2, roleId, account);
    mathint getAccess4After  = getAccess_effect(e2, roleId, account);

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

    // sanity
    require sanity(e);

    // values before
    mathint getAccess1Before = getAccess_since(e, roleId, account);
    mathint getAccess2Before = getAccess_currentDelay(e, roleId, account);
    mathint getAccess3Before = getAccess_pendingDelay(e, roleId, account);
    mathint getAccess4Before = getAccess_effect(e, roleId, account);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values before
    mathint getAccess1After = getAccess_since(e, roleId, account);
    mathint getAccess2After = getAccess_currentDelay(e, roleId, account);
    mathint getAccess3After = getAccess_pendingDelay(e, roleId, account);
    mathint getAccess4After = getAccess_effect(e, roleId, account);

    // transitions
    assert (
        getAccess1Before != getAccess1After ||
        getAccess2Before != getAccess2After ||
        getAccess3Before != getAccess3After ||
        getAccess4Before != getAccess4After
    ) => (
        (
            f.selector == sig:grantRole(uint64,address,uint32).selector &&
            getAccess1After > 0
        ) || (
            (
                f.selector == sig:revokeRole(uint64,address).selector ||
                f.selector == sig:renounceRole(uint64,address).selector
            ) &&
            getAccess1After == 0 &&
            getAccess2After == 0 &&
            getAccess3After == 0 &&
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
    mathint delayPendingBefore = getTargetAdminDelay_after(e1, target);
    mathint delayEffectBefore  = getTargetAdminDelay_effect(e1, target);

    // time pass: e1 → e2
    require clock(e1) <= clock(e2);

    // values after
    mathint delayAfter        = getTargetAdminDelay(e2, target);
    mathint delayPendingAfter = getTargetAdminDelay_after(e2, target);
    mathint delayEffectAfter  = getTargetAdminDelay_effect(e2, target);

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
    mathint delayPendingBefore = getTargetAdminDelay_after(e, target);
    mathint delayEffectBefore  = getTargetAdminDelay_effect(e, target);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values after
    mathint delayAfter        = getTargetAdminDelay(e, target);
    mathint delayPendingAfter = getTargetAdminDelay_after(e, target);
    mathint delayEffectAfter  = getTargetAdminDelay_effect(e, target);

    // if anything changed ...
    assert (
        delayBefore        != delayAfter        ||
        delayPendingBefore != delayPendingAfter ||
        delayEffectBefore  != delayEffectAfter
    ) => (
        (
            // ... it was the consequence of a call to setTargetAdminDelay
            f.selector == sig:setTargetAdminDelay(address,uint32).selector
        ) && (
            // ... delay cannot decrease instantly
            delayAfter >= delayBefore
        ) && (
            // ... if setback is not 0, value cannot change instantly
            minSetback() > 0 => (
                delayBefore == delayAfter
            )
        ) && (
            // ... if the value did not change and there is a minSetback, there must be something scheduled in the future
            delayAfter == delayBefore && minSetback() > 0 => (
                delayEffectAfter >= clock(e) + minSetback()
            )
            // note: if there is no minSetback, and if the caller "confirms" the current value,
            // then this as immediate effect and nothing is scheduled
        ) && (
            // ... if the value changed, then no further change should be scheduled
            delayAfter != delayBefore => (
                delayPendingAfter == 0 &&
                delayEffectAfter  == 0
            )
        )
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
    mathint delayPendingBefore = getRoleGrantDelay_after(e1, roleId);
    mathint delayEffectBefore  = getRoleGrantDelay_effect(e1, roleId);

    // time pass: e1 → e2
    require clock(e1) <= clock(e2);

    // values after
    mathint delayAfter        = getRoleGrantDelay(e2, roleId);
    mathint delayPendingAfter = getRoleGrantDelay_after(e2, roleId);
    mathint delayEffectAfter  = getRoleGrantDelay_effect(e2, roleId);

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

rule getRoleGrantDelayChangeCall(uint64 roleId) {
    env e;

    // values before
    mathint delayBefore        = getRoleGrantDelay(e, roleId);
    mathint delayPendingBefore = getRoleGrantDelay_after(e, roleId);
    mathint delayEffectBefore  = getRoleGrantDelay_effect(e, roleId);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values after
    mathint delayAfter        = getRoleGrantDelay(e, roleId);
    mathint delayPendingAfter = getRoleGrantDelay_after(e, roleId);
    mathint delayEffectAfter  = getRoleGrantDelay_effect(e, roleId);

    // if anything changed ...
    assert (
        delayBefore        != delayAfter        ||
        delayPendingBefore != delayPendingAfter ||
        delayEffectBefore  != delayEffectAfter
    ) => (
        (
            // ... it was the consequence of a call to setTargetAdminDelay
            f.selector == sig:setGrantDelay(uint64,uint32).selector
        ) && (
            // ... delay cannot decrease instantly
            delayAfter >= delayBefore
        ) && (
            // ... if setback is not 0, value cannot change instantly
            minSetback() > 0 => (
                delayBefore == delayAfter
            )
        ) && (
            // ... if the value did not change and there is a minSetback, there must be something scheduled in the future
            delayAfter == delayBefore && minSetback() > 0 => (
                delayEffectAfter >= clock(e) + minSetback()
            )
            // note: if there is no minSetback, and if the caller "confirms" the current value,
            // then this as immediate effect and nothing is scheduled
        ) && (
            // ... if the value changed, then no further change should be scheduled
            delayAfter != delayBefore => (
                delayPendingAfter == 0 &&
                delayEffectAfter  == 0
            )
        )
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
        (isOnlyAuthorized(to_bytes4(f.selector))                      && scheduleAfter == 0       )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Functions: restricted functions can only be called by owner                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule restrictedFunctions(env e) {
    require nonpayable(e);
    require sanity(e);

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
        hasRole_isMember(e, ADMIN_ROLE(), e.msg.sender) || e.msg.sender == currentContract
    );
}

rule restrictedFunctionsGrantRole(env e) {
    require nonpayable(e);
    require sanity(e);

    uint64 roleId;
    address account;
    uint32 executionDelay;

    // We want to check that the caller has the admin role before we possibly grant it.
    bool hasAdminRoleBefore = hasRole_isMember(e, getRoleAdmin(roleId), e.msg.sender);

    grantRole(e, roleId, account, executionDelay);

    assert hasAdminRoleBefore || e.msg.sender == currentContract;
}

rule restrictedFunctionsRevokeRole(env e) {
    require nonpayable(e);
    require sanity(e);

    uint64 roleId;
    address account;

    // This is needed if roleId is self-administered, the `revokeRole` call could target
    // e.msg.sender and remove the very role that is necessary for authorizing the call.
    bool hasAdminRoleBefore = hasRole_isMember(e, getRoleAdmin(roleId), e.msg.sender);

    revokeRole(e, roleId, account);

    assert hasAdminRoleBefore || e.msg.sender == currentContract;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Functions: canCall delay is enforced for calls to execute (only for others target)                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// getScheduleChangeCall proves that only {schedule} can set an operation schedule to a non 0 value
rule callDelayEnforce_scheduleInTheFuture(env e) {
    address target;
    bytes   data;
    uint48  when;

    // Condition: calling a third party with a delay
    mathint delay = canCallExtended_delay(e, e.msg.sender, target, data);
    require delay > 0;

    // Schedule
    schedule(e, target, data, when);

    // Get operation schedule
    mathint timepoint = getSchedule(e, hashOperation(e.msg.sender, target, data));

    // Schedule is far enough in the future
    assert timepoint == max(clock(e) + delay, when);
}

rule callDelayEnforce_executeAfterDelay(env e) {
    address target;
    bytes   data;

    // Condition: calling a third party with a delay
    mathint delay = canCallExtended_delay(e, e.msg.sender, target, data);

    // Get operation schedule before
    mathint scheduleBefore = getSchedule(e, hashOperation(e.msg.sender, target, data));

    // Do call
    execute@withrevert(e, target, data);
    bool success = !lastReverted;

    // Get operation schedule after
    mathint scheduleAfter = getSchedule(e, hashOperation(e.msg.sender, target, data));

    // Can only execute if delay is set and has passed
    assert success => (
        delay > 0 => (
            scheduleBefore != 0 &&
            scheduleBefore <= clock(e)
        ) &&
        scheduleAfter == 0
    );
}
