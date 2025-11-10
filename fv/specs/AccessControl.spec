import "helpers/helpers.spec";
import "methods/IAccessControl.spec";

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Identify entrypoints: only grantRole, revokeRole and renounceRole can alter permissions                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyGrantCanGrant(env e, method f, bytes32 role, address account) {
    calldataarg args;

    bool hasRoleBefore = hasRole(role, account);
    f(e, args);
    bool hasRoleAfter = hasRole(role, account);

    assert (
        !hasRoleBefore &&
        hasRoleAfter
    ) => (
        f.selector == sig:grantRole(bytes32, address).selector
    );

    assert (
        hasRoleBefore &&
        !hasRoleAfter
    ) => (
        f.selector == sig:revokeRole(bytes32, address).selector ||
        f.selector == sig:renounceRole(bytes32, address).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: grantRole only affects the specified user/role combo                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule grantRoleEffect(env e, bytes32 role) {
    require nonpayable(e);

    bytes32 otherRole;
    address account;
    address otherAccount;

    bool isCallerAdmin = hasRole(getRoleAdmin(role), e.msg.sender);
    bool hasOtherRoleBefore = hasRole(otherRole, otherAccount);

    grantRole@withrevert(e, role, account);
    bool success = !lastReverted;

    bool hasOtherRoleAfter = hasRole(otherRole, otherAccount);

    // liveness
    assert success <=> isCallerAdmin;

    // effect
    assert success => hasRole(role, account);

    // no side effect
    assert hasOtherRoleBefore != hasOtherRoleAfter => (role == otherRole && account == otherAccount);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: revokeRole only affects the specified user/role combo                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule revokeRoleEffect(env e, bytes32 role) {
    require nonpayable(e);

    bytes32 otherRole;
    address account;
    address otherAccount;

    bool isCallerAdmin = hasRole(getRoleAdmin(role), e.msg.sender);
    bool hasOtherRoleBefore = hasRole(otherRole, otherAccount);

    revokeRole@withrevert(e, role, account);
    bool success = !lastReverted;

    bool hasOtherRoleAfter = hasRole(otherRole, otherAccount);

    // liveness
    assert success <=> isCallerAdmin;

    // effect
    assert success => !hasRole(role, account);

    // no side effect
    assert hasOtherRoleBefore != hasOtherRoleAfter => (role == otherRole && account == otherAccount);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: renounceRole only affects the specified user/role combo                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule renounceRoleEffect(env e, bytes32 role) {
    require nonpayable(e);

    bytes32 otherRole;
    address account;
    address otherAccount;

    bool hasOtherRoleBefore = hasRole(otherRole, otherAccount);

    renounceRole@withrevert(e, role, account);
    bool success = !lastReverted;

    bool hasOtherRoleAfter = hasRole(otherRole, otherAccount);

    // liveness
    assert success <=> account == e.msg.sender;

    // effect
    assert success => !hasRole(role, account);

    // no side effect
    assert hasOtherRoleBefore != hasOtherRoleAfter => (role == otherRole && account == otherAccount);
}
