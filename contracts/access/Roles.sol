pragma solidity ^0.5.2;

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev give an account access to this role
     */
    function add(Role storage role, address account) internal {
        require(account != address(0), "from OpenZeppelin's:Roles.sol:add(). account cannot be address(0)");
        require(!has(role, account), "from OpenZeppelin's:Roles.sol:add() . account already has this role.");

        role.bearer[account] = true;
    }

    /**
     * @dev remove an account's access to this role
     */
    function remove(Role storage role, address account) internal {
        require(account != address(0), "from OpenZeppelin's:Roles.sol:remove(). account cannot be address(0)");
        require(has(role, account), "from OpenZeppelin's:Roles.sol:remove(). account doesn't have this role.");

        role.bearer[account] = false;
    }

    /**
     * @dev check if an account has this role
     * @return bool
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0), "from OpenZeppelin's:Roles.sol:has(). account cannot be address(0)");
        return role.bearer[account];
    }
}
