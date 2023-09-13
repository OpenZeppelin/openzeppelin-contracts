import "helpers/helpers.spec";
import "methods/IAccessManager.spec";

methods {
    // FV
    function canCall_1(address,address,bytes4) external returns (bool);
    function canCall_2(address,address,bytes4) external returns (uint32);
    function hasRole_1(uint64,address)         external returns (bool);
    function hasRole_2(uint64,address)         external returns (uint32);
    function getAccess_1(uint64,address)       external returns (uint48);
    function getAccess_2(uint64,address)       external returns (uint32);
    function getAccess_3(uint64,address)       external returns (uint32);
    function getAccess_4(uint64,address)       external returns (uint48);
    function hashExecutionId(address,bytes4)   external returns (bytes32) envfree;
    function executionId()                     external returns (bytes32) envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition envsanity(env e) returns bool =
    e.block.timestamp <= max_uint48;

definition isSetAndPast(env e, uint48 timepoint) returns bool =
    timepoint != 0 && to_mathint(timepoint) <= to_mathint(e.block.timestamp);

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
│ State transition: access can change as a result of time passing or through a function call                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getAccessChangeWait() {
    env e1;
    env e2;
    uint64 roleId;
    address account;

    // values before
    uint48 getAccess1Before = getAccess_1(e1, roleId, account);
    uint32 getAccess2Before = getAccess_2(e1, roleId, account);
    uint32 getAccess3Before = getAccess_3(e1, roleId, account);
    uint48 getAccess4Before = getAccess_4(e1, roleId, account);

    // time pass: e1 → e2
    require e1.block.timestamp <= e2.block.timestamp;

    // values after
    uint48 getAccess1After  = getAccess_1(e2, roleId, account);
    uint32 getAccess2After  = getAccess_2(e2, roleId, account);
    uint32 getAccess3After  = getAccess_3(e2, roleId, account);
    uint48 getAccess4After  = getAccess_4(e2, roleId, account);

    // member "since" cannot change as a consequence of time passing
    assert getAccess1Before == getAccess1After;

    // any change of any other value should be a consequence of the effect timepoint being reached
    assert (
        getAccess2Before != getAccess2After ||
        getAccess3Before != getAccess3After ||
        getAccess4Before != getAccess4After
    ) => (
        getAccess4Before != 0 &&
        to_mathint(getAccess4Before) > to_mathint(e1.block.timestamp) &&
        to_mathint(getAccess4Before) <= to_mathint(e2.block.timestamp) &&
        getAccess2After == getAccess3Before &&
        getAccess3After == 0 &&
        getAccess4After == 0
    );
}

rule getAccessChangeCall() {
    env e;
    address account;
    uint64 roleId;

    // values before
    uint48 getAccess1Before = getAccess_1(e, roleId, account);
    uint32 getAccess2Before = getAccess_2(e, roleId, account);
    uint32 getAccess3Before = getAccess_3(e, roleId, account);
    uint48 getAccess4Before = getAccess_4(e, roleId, account);

    // arbitrary function call
    method f; calldataarg args; f(e, args);

    // values before
    uint48 getAccess1After = getAccess_1(e, roleId, account);
    uint32 getAccess2After = getAccess_2(e, roleId, account);
    uint32 getAccess3After = getAccess_3(e, roleId, account);
    uint48 getAccess4After = getAccess_4(e, roleId, account);

    // transitions
    assert (
        getAccess1Before != getAccess1After ||
        getAccess2Before != getAccess2After ||
        getAccess3Before != getAccess3After ||
        getAccess4Before != getAccess4After
    ) => (
        f.selector == sig:grantRole(uint64,address,uint32).selector ||
        f.selector == sig:revokeRole(uint64,address).selector       ||
        f.selector == sig:renounceRole(uint64,address).selector
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

    f@withrevert(e,args);
    bool success = !lastReverted;

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
        !success || hasRole_1(e, ADMIN_ROLE(), e.msg.sender)
    );
}

rule restrictedFunctionsGrantRole(env e) {
    require nonpayable(e);
    require envsanity(e);

    uint64 roleId;
    address account;
    uint32 executionDelay;

    grantRole@withrevert(e, roleId, account, executionDelay);
    bool success = !lastReverted;

    assert !success || hasRole_1(e, getRoleAdmin(roleId), e.msg.sender);
}

rule restrictedFunctionsRevokeRole(env e) {
    require nonpayable(e);
    require envsanity(e);

    uint64 roleId;
    address account;

    revokeRole@withrevert(e, roleId, account);
    bool success = !lastReverted;

    assert !success || hasRole_1(e, getRoleAdmin(roleId), e.msg.sender);
}












// target open/closed
// target function role change

// schedule
// execute
// cancel
// nonce