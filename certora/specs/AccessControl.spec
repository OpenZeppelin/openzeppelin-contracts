methods {
    grantRole(bytes32, address)
    revokeRole(bytes32, address)
    _checkRole(bytes32)
    safeTransferFrom(address, address, uint256, uint256, bytes)
    safeBatchTransferFrom(address, address, uint256[], uint256[], bytes)

    getRoleAdmin(bytes32) returns(bytes32) envfree
    hasRole(bytes32, address) returns(bool) envfree
} 


// STATUS - verified
// check onlyRole modifier for grantRole()
rule onlyRoleModifierCheckGrant(env e){
    bytes32 role; address account;

    _checkRole@withrevert(e, getRoleAdmin(role));
    bool checkRevert = lastReverted;

    grantRole@withrevert(e, role, account);
    bool grantRevert = lastReverted;

    assert checkRevert => grantRevert, "modifier goes bananas";
}


// STATUS - verified
// check onlyRole modifier for revokeRole()
rule onlyRoleModifierCheckRevoke(env e){
    bytes32 role; address account;

    _checkRole@withrevert(e, getRoleAdmin(role));
    bool checkRevert = lastReverted;

    revokeRole@withrevert(e, role, account);
    bool revokeRevert = lastReverted;

    assert checkRevert => revokeRevert, "modifier goes bananas";
}


// STATUS - verified
// grantRole() does not affect another accounts 
rule grantRoleEffect(env e){
    bytes32 role; address account; 
    bytes32 anotherRole; address nonEffectedAcc;
    require account != nonEffectedAcc;

    bool hasRoleBefore = hasRole(anotherRole, nonEffectedAcc);

    grantRole(e, role, account);

    bool hasRoleAfter = hasRole(anotherRole, nonEffectedAcc);

    assert hasRoleBefore == hasRoleAfter, "modifier goes bananas";
}


// STATUS - verified
// grantRole() does not affect another accounts 
rule revokeRoleEffect(env e){
    bytes32 role; address account; 
    bytes32 anotherRole; address nonEffectedAcc;
    require account != nonEffectedAcc;

    bool hasRoleBefore = hasRole(anotherRole, nonEffectedAcc);

    revokeRole(e, role, account);

    bool hasRoleAfter = hasRole(anotherRole, nonEffectedAcc);

    assert hasRoleBefore == hasRoleAfter, "modifier goes bananas";
}











