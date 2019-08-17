pragma solidity ^0.5.0;

import "./Roles.sol";
import "../drafts/Counters.sol";

/**
 * @title RoleChecker
 * @dev Stores and provides setters and getters for roles using automatically generated ids.
 * Supports unlimited numbers of roles and addresses.
 * Role IDs are created with a hash of an integer (autoincremented by Counter) and the contract's address
 */

contract RoleChecker {
    using Roles for Roles.Role;
    using Counters for Counters.Counter;

    mapping (uint256 => Roles.Role) private roles;
    Counters.Counter counter;

    event RoleAdded(address indexed account, uint256 roleId);
    event RoleRemoved(address indexed account, uint256 roleId);

    modifier onlyRole(uint256 _roleId) {
        require(hasRole(msg.sender, _roleId), "Caller does not have the permissions to call this function");
        _;
    }

    function roleExists(uint256 _roleId) internal view returns (bool) { return roles[_roleId].exists; }

    function newRole() internal returns (uint256) {
        counter.increment();
        uint256 newRoleId = uint256(keccak256(abi.encode(address(this), counter.current())));
        roles[newRoleId].exists = true;
        return newRoleId;
    }

    /**
    * @dev add a role to an address
    * @param _account address to be granted the role
    * @param _roleId the id of the role
    */
    function addRole(address _account, uint256 _roleId) internal {
        roles[_roleId].add(_account);
        emit RoleAdded(_account, _roleId);
    }

    /**
    * @dev remove a role from an address
    * @param _account address to be removed from the role
    * @param _roleId the id of the role
    */
    function removeRole(address _account, uint256 _roleId) internal {
        roles[_roleId].remove(_account);
        emit RoleRemoved(_account, _roleId);
    }

    /**
    * @dev determine if account has role
    * @param _account address to be removed from the role
    * @param _roleId the id of the role
    */
    function hasRole(address _account, uint256 _roleId) public view returns (bool) {
        return roles[_roleId].has(_account);
    }

}
