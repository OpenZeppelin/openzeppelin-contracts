pragma solidity ^0.6.0;

import "../utils/EnumerableSet.sol";

abstract contract AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Role {
        EnumerableSet.AddressSet members;
        bytes32 admin;
    }

    mapping (bytes32 => Role) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    // Returns true if an account has a role
    function hasRole(bytes32 roleId, address account) public view returns (bool) {
        return _roles[roleId].members.contains(account);
    }

    // Returns the number of accounts with a role
    function getRoleMembersCount(bytes32 roleId) public view returns (uint256) {
        return _roles[roleId].members.length();
    }

    // Returns an account with a role at index
    function getRoleMember(bytes32 roleId, uint256 index) public view returns (address) {
        return _roles[roleId].members.get(index);
    }

    // Returns a role's admin role
    function getRoleAdmin(bytes32 roleId) external view returns (bytes32) {
        return _roles[roleId].admin;
    }

    // Gives a role to an account. Caller must have its admin role
    function grantRole(bytes32 roleId, address account) external virtual {
        require(hasRole(_roles[roleId].admin, msg.sender), "AccessControl: sender must be an admin to grant");

        _grantRole(roleId, account);
    }

    // Revokes a role from an account. Caller must have its admin role
    function revokeRole(bytes32 roleId, address account) external virtual {
        require(hasRole(_roles[roleId].admin, msg.sender), "AccessControl: sender must be an admin to revoke");

        _revokeRole(roleId, account);
    }

    // Renounces a role. Caller must be `account`
    function renounceRole(bytes32 roleId, address account) external virtual {
        require(account == msg.sender, "AccessControl: can only renounce roles for self");

        _revokeRole(roleId, account);
    }

    function _grantRole(bytes32 roleId, address account) internal virtual {
        bool added = _roles[roleId].members.add(account);
        require(added, "AccessControl: account already has granted role");
    }

    function _revokeRole(bytes32 roleId, address account) internal virtual {
        bool removed = _roles[roleId].members.remove(account);
        require(removed, "AccessControl: account does not have revoked role");
    }

    function _setRoleAdmin(bytes32 roleId, bytes32 adminRoleId) internal virtual {
        _roles[roleId].admin = adminRoleId;
    }
}
