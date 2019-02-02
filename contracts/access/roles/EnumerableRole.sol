pragma solidity ^0.5.2;

import "../Roles.sol";

contract EnumerableRole {
    using Roles for Roles.Role;

    event EnumerableAdded(address indexed account);
    event EnumerableRemoved(address indexed account);

    address[] private users;
    mapping (address => uint256) userIndex;

    Roles.Role private _enumerables;

    constructor () internal {
        _addEnumerable(msg.sender);
    }

    modifier onlyEnumerable() {
        require(isEnumerable(msg.sender));
        _;
    }

    function isEnumerable(address account) public view returns (bool) {
        return _enumerables.has(account);
    }

    function addEnumerable(address account) public onlyEnumerable {
        _addEnumerable(account);
    }

    function renounceEnumerable() public {
        _removeEnumerable(msg.sender);
    }

    function _addEnumerable(address account) internal {
        _enumerables.add(account);
        emit EnumerableAdded(account);
        addToList(account);
    }

    function _removeEnumerable(address account) internal {
        _enumerables.remove(account);
        emit EnumerableRemoved(account);
        removeFromList(account);
    }

    function addToList(address account) internal {
        users.push(account);
        userIndex[account] = users.length;
    }

    function removeFromList(address account) internal {
        uint index = userIndex[account];
        users[index - 1] = users[users.length - 1];
        userIndex[users[index - 1]] = index;
        userIndex[account] = 0;
        users.pop();
    }
}
