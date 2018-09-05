pragma solidity ^0.4.24;


/**
 * @title Roles
 * @author Francisco Giordano (@frangio)
 * @dev Library for managing addresses assigned to a Role.
 * See RBAC.sol for example usage.
 */
library Roles {
  struct Role {
    mapping (address => bool) bearer;
  }

  /**
   * @dev give an account access to this role
   */
  function add(Role storage role, address account)
    internal
  {
    role.bearer[account] = true;
  }

  /**
   * @dev remove an account's access to this role
   */
  function remove(Role storage role, address account)
    internal
  {
    role.bearer[account] = false;
  }

  /**
   * @dev check if an account has this role
   * // reverts
   */
  function check(Role storage role, address account)
    internal
    view
  {
    require(has(role, account));
  }

  /**
   * @dev check if an account has this role
   * @return bool
   */
  function has(Role storage role, address account)
    internal
    view
    returns (bool)
  {
    return role.bearer[account];
  }
}
