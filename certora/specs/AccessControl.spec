import "helpers.spec"

methods {
    hasRole(bytes32, address) returns(bool) envfree
    getRoleAdmin(bytes32) returns(bytes32) envfree
    grantRole(bytes32, address)
    revokeRole(bytes32, address)
    renounceRole(bytes32, address)
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Identify entrypoints: only grantRole, revokeRole and renounceRole can alter permissions                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyGrantCanGrant(env e, bytes32 role, address account) {
    method f; calldataarg args;

    bool hasRoleBefore = hasRole(role, account);
    f(e, args);
    bool hasRoleAfter = hasRole(role, account);

    assert (
        !hasRoleBefore &&
        hasRoleAfter
    ) => (
        f.selector == grantRole(bytes32, address).selector
    );

    assert (
        hasRoleBefore &&
        !hasRoleAfter
    ) => (
        f.selector == revokeRole(bytes32, address).selector ||
        f.selector == renounceRole(bytes32, address).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: grantRole only affects the specified user/role combo                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule grantRoleEffect(env e) {
    require nonpayable(e);

    bytes32 role;
    bytes32 otherRole;
    address account;
    address otherAccount;

    bool isCallerAdmin = hasRole(getRoleAdmin(role), e.msg.sender);
    bool hasRoleBefore = hasRole(otherRole, otherAccount);

    grantRole@withrevert(e, role, account);
    bool success = !lastReverted;

    // liveness
    assert success <=> isCallerAdmin;

    // effect
    assert success => hasRole(role, account);

    // no side effect
    assert hasRoleBefore != hasRole(otherRole, otherAccount) => (otherRole == role && otherAccount == account);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: revokeRole only affects the specified user/role combo                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule revokeRoleEffect(env e) {
    require nonpayable(e);

    bytes32 role;
    bytes32 otherRole;
    address account;
    address otherAccount;

    bool isCallerAdmin = hasRole(getRoleAdmin(role), e.msg.sender);
    bool hasRoleBefore = hasRole(otherRole, otherAccount);

    revokeRole@withrevert(e, role, account);
    bool success = !lastReverted;

    // liveness
    assert success <=> isCallerAdmin;

    // effect
    assert success => !hasRole(role, account);

    // no side effect
    assert hasRoleBefore != hasRole(otherRole, otherAccount) => (otherRole == role && otherAccount == account);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: renounceRole only affects the specified user/role combo                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule renounceRoleEffect(env e) {
    require nonpayable(e);

    bytes32 role;
    bytes32 otherRole;
    address account;
    address otherAccount;

    bool hasRoleBefore = hasRole(otherRole, otherAccount);

    renounceRole@withrevert(e, role, account);
    bool success = !lastReverted;

    // liveness
    assert success <=> account == e.msg.sender;

    // effect
    assert success => !hasRole(role, account);

    // no side effect
    assert hasRoleBefore != hasRole(otherRole, otherAccount) => (otherRole == role && otherAccount == account);
}
