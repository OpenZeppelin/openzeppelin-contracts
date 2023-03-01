methods {
    hasRole(bytes32, address) returns(bool) envfree
    getRoleAdmin(bytes32) returns(bytes32) envfree

    grantRole(bytes32, address)
    revokeRole(bytes32, address)
    renounceRole(bytes32, address)
}


/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only grantRole can grant a role                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyGrantCanGrant(env e, bytes32 role, address account) {
    require !hasRole(role, account);

    method f; calldataarg args;
    f(e, args);

    assert hasRole(role, account) => f.selector == grantRole(bytes32, address).selector;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only revokeRole and renounceRole can grant a role                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyRevokeAndRenounceCanRevoke(env e, bytes32 role, address account) {
    require hasRole(role, account);

    method f; calldataarg args;
    f(e, args);

    assert !hasRole(role, account) => (f.selector == revokeRole(bytes32, address).selector || f.selector == renounceRole(bytes32, address).selector);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only an account with admin role can call grantRole                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyAdminCanGrant(env e, bytes32 role, address account) {
    bool isAdmin = hasRole(getRoleAdmin(role), e.msg.sender);

    grantRole@withrevert(e, role, account);

    assert !lastReverted => isAdmin;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only an account with admin role can call revokeRole                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyAdminCanRevoke(env e, bytes32 role, address account) {
    bool isAdmin = hasRole(getRoleAdmin(role), e.msg.sender);

    revokeRole@withrevert(e, role, account);

    assert !lastReverted => isAdmin;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only the affected account can revoke                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyUserCanRenounce(env e, bytes32 role, address account) {
    renounceRole@withrevert(e, role, account);
    assert !lastReverted => account == e.msg.sender;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: grantRole only affects the specified user/role combo                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule grantRoleEffect(env e) {
    bytes32 role1; bytes32 role2;
    address account1; address account2;

    bool hasRoleBefore = hasRole(role1, account1);
    grantRole(e, role2, account2);
    bool hasRoleAfter = hasRole(role1, account1);

    assert (
        hasRoleBefore != hasRoleAfter
    ) => (
        hasRoleAfter == true && role1 == role2 && account1 == account2
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: revokeRole only affects the specified user/role combo                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule revokeRoleEffect(env e) {
    bytes32 role1; bytes32 role2;
    address account1; address account2;

    bool hasRoleBefore = hasRole(role1, account1);
    revokeRole(e, role2, account2);
    bool hasRoleAfter = hasRole(role1, account1);

    assert (
        hasRoleBefore != hasRoleAfter
    ) => (
        hasRoleAfter == false && role1 == role2 && account1 == account2
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: renounceRole only affects the specified user/role combo                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule renounceRoleEffect(env e) {
    bytes32 role1; bytes32 role2;
    address account1; address account2;

    bool hasRoleBefore = hasRole(role1, account1);
    renounceRole(e, role2, account2);
    bool hasRoleAfter = hasRole(role1, account1);

    assert (
        hasRoleBefore != hasRoleAfter
    ) => (
        hasRoleAfter == false && role1 == role2 && account1 == account2
    );
}

