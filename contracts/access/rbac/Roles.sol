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
  function add(Role storage _role, address _account)
    internal
  {
    _role.bearer[_account] = true;
  }

  /**
   * @dev remove an account's access to this role
   */
  function remove(Role storage _role, address _account)
    internal
  {
    _role.bearer[_account] = false;
  }

  /**
   * @dev check if an account has this role
   * // reverts
   */
  function check(Role storage _role, address _account)
    internal
    view
  {
    require(has(_role, _account));
  }

  /**
   * @dev check if an account has this role
   * @return bool
   */
  function has(Role storage _role, address _account)
    internal
    view
    returns (bool)
  {
    return _role.bearer[_account];
  }
}
