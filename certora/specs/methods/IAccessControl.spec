methods {
    hasRole(bytes32, address) returns(bool) envfree
    getRoleAdmin(bytes32) returns(bytes32) envfree
    grantRole(bytes32, address)
    revokeRole(bytes32, address)
    renounceRole(bytes32, address)
}
