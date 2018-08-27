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
   * @dev give multiple accounts access to this role
   */
  function addMany(Role storage _role, address[] _accounts)
    internal
  {
    for (uint256 i = 0; i < _accounts.length; ++i) {
      add(_role, _accounts[i]);
    }
  }

  /**
   * @dev remove an account's access to this role
   */
  function remove(Role storage _role, address _account)
    internal
  {
    _role.bearer[_account] = false;
  }

  function transfer(Role storage _role, address _account)
    internal
  {
    require(_account != address(0));
    require(!has(_role, _account));
    require(has(_role, msg.sender));

    remove(_role, msg.sender);
    add(_role, _account);
  }

  function renounce(Role storage _role) internal
  {
    remove(_role, msg.sender);
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
