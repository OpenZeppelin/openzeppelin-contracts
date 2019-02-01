pragma solidity ^0.5.2;

import "../Roles.sol";

contract EnumerableRole {
    using Roles for Roles.Role;

    event RoleAdded(address indexed account);
    event RoleRemoved(address indexed account);

    address[] private users;
    mapping (address => uint256) userIndex;

    Roles.Role private _enumerable;

    constructor () internal {
        _addRole(msg.sender);
    }

    modifier onlyRole() {
        require(isRole(msg.sender));
        _;
    }

    function isRole(address account) public view returns (bool) {
        return _enumerable.has(account);
    }

    function addRole(address account) public onlyRole {
        _addRole(account);
    }

    function renounceRole() public {
        _removeRole(msg.sender);
    }

    function _addRole(address account) internal {
        _enumerable.add(account);
        addRoleToList(account);
        emit RoleAdded(account);
    }

    function _removeRole(address account) internal {
        _enumerable.remove(account);
        removeRoleFromList(account);
        emit RoleRemoved(account);
    }

    function addRoleToList(address account) internal {
        require(account != address(0));
        require(!_enumerable.has(account));
        users.push(account);
        userIndex[account] = users.length;
    }

    function removeRoleFromList(address account) internal {
        require(account != address(0));
        require(_enumerable.has(account));
        uint index = userIndex[account];
        users[index - 1] = users[users.length - 1];
        userIndex[users[index - 1]] = index;
        userIndex[account] = 0;
        users.pop();

    }
}
