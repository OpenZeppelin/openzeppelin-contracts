pragma solidity ^0.6.0;

import "./IAccessControl.sol";
import "../utils/EnumerableSet.sol";

abstract contract AccessControl is IAccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Role {
        EnumerableSet.AddressSet members;
        bytes32 admin;
    }

    mapping (bytes32 => Role) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    function hasRole(bytes32 roleId, address account) public view override returns (bool) {
        return _roles[roleId].members.contains(account);
    }

    function getRoleMembersCount(bytes32 roleId) public view override returns (uint256) {
        return _roles[roleId].members.length();
    }

    function getRoleMember(bytes32 roleId, uint256 index) public view override returns (address) {
        return _roles[roleId].members.get(index);
    }

    function getRoleAdmin(bytes32 roleId) external view override returns (bytes32) {
        return _roles[roleId].admin;
    }

    function grantRole(bytes32 roleId, address account) external virtual override {
        require(hasRole(_roles[roleId].admin, msg.sender), "AccessControl: sender must be an admin to grant");

        _grantRole(roleId, account);
    }

    function revokeRole(bytes32 roleId, address account) external virtual override {
        require(hasRole(_roles[roleId].admin, msg.sender), "AccessControl: sender must be an admin to revoke");

        _revokeRole(roleId, account);
    }

    function renounceRole(bytes32 roleId, address account) external virtual override {
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
