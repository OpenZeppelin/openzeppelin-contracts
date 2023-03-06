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

    bytes32 role1; bytes32 role2;
    address account1; address account2;

    bool isCallerAdmin = hasRole(getRoleAdmin(role2), e.msg.sender);
    bool hasRoleBefore = hasRole(role1, account1);

    grantRole@withrevert(e, role2, account2);
    assert !lastReverted <=> isCallerAdmin;

    bool hasRoleAfter = hasRole(role1, account1);

    assert (
        hasRoleBefore != hasRoleAfter
    ) => (
        hasRoleAfter == true && role1 == role2 && account1 == account2
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: revokeRole only affects the specified user/role combo                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule revokeRoleEffect(env e) {
    require nonpayable(e);

    bytes32 role1; bytes32 role2;
    address account1; address account2;

    bool isCallerAdmin = hasRole(getRoleAdmin(role2), e.msg.sender);
    bool hasRoleBefore = hasRole(role1, account1);

    revokeRole@withrevert(e, role2, account2);
    assert !lastReverted <=> isCallerAdmin;

    bool hasRoleAfter = hasRole(role1, account1);

    assert (
        hasRoleBefore != hasRoleAfter
    ) => (
        hasRoleAfter == false && role1 == role2 && account1 == account2
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: renounceRole only affects the specified user/role combo                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule renounceRoleEffect(env e) {
    require nonpayable(e);

    bytes32 role1; bytes32 role2;
    address account1; address account2;

    bool hasRoleBefore = hasRole(role1, account1);

    renounceRole@withrevert(e, role2, account2);
    assert !lastReverted <=> account2 == e.msg.sender;

    bool hasRoleAfter = hasRole(role1, account1);

    assert (
        hasRoleBefore != hasRoleAfter
    ) => (
        hasRoleAfter == false && role1 == role2 && account1 == account2
    );
}
