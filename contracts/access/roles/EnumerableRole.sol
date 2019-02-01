pragma solidity ^0.5.2;

/**
 * @title Enumberable Roles
 * @dev Library for managing addresses assigned to a Role using iterable storage
 */
contract EnumerableRoles {

    address[] private users;
    mapping (address => uint256) userIndex;

    /**
     * @dev give an account access to this role
     */
    function add(address account) public {
        require(account != address(0));
        require(!has(account));
        users.push(account);
        userIndex[account] = users.length;
    }

    /**
     * @dev remove an account's access to this role
     */
    function remove(address account) public {
        require(account != address(0));
        require(has(account));
        uint index = userIndex[account];
        users[index - 1] = users[users.length - 1];
        userIndex[users[index - 1]] = index;
        userIndex[account] = 0;
        users.pop();

    }

    /**
     * @dev check if an account has this role
     * @return bool
     */
    function has(address account) internal view returns (bool) {
        require(account != address(0));
        return userIndex[account] != 0;
    }

}
