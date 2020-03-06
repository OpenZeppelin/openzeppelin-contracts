pragma solidity ^0.6.0;

interface IAccessControl {
    // Queries

    // Returns true if an account has a role
    function hasRole(bytes32 roleId, address account) external view returns (bool);

    // Returns the number of accounts with a role
    function getRoleMembersCount(bytes32 roleId) external view returns (uint256);

    // Returns an account with a role at index
    function getRoleMember(bytes32 roleId, uint256 index) external view returns (address);

    // Returns a role's admin role
    function getRoleAdmin(bytes32 roleId) external view returns (bytes32);

    // Operations

    // Gives a role to an account. Caller must have its admin role
    function grantRole(bytes32 roleId, address account) external;

    // Revokes a role from an account. Caller must have its admin role
    function revokeRole(bytes32 roleId, address account) external;

    // Renounces a role. Caller must be `account`
    function renounceRole(bytes32 roleId, address account) external;
}
