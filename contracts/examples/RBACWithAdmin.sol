pragma solidity ^0.4.24;

import "../access/rbac/RBAC.sol";


/**
 * @title RBACWithAdmin
 * @author Matt Condon (@Shrugs)
 * @dev It's recommended that you define constants in the contract,
 * like ROLE_ADMIN below, to avoid typos.
 * @notice RBACWithAdmin is probably too expansive and powerful for your
 * application; an admin is actually able to change any address to any role
 * which is a very large API surface. It's recommended that you follow a strategy
 * of strictly defining the abilities of your roles
 * and the API-surface of your contract.
 * This is just an example for example's sake.
 */
contract RBACWithAdmin is RBAC {
  /**
   * A constant role name for indicating admins.
   */
  string private constant ROLE_ADMIN = "admin";

  /**
   * @dev modifier to scope access to admins
   * // reverts
   */
  modifier onlyAdmin()
  {
    checkRole(msg.sender, ROLE_ADMIN);
    _;
  }

  /**
   * @dev constructor. Sets msg.sender as admin by default
   */
  constructor()
    public
  {
    _addRole(msg.sender, ROLE_ADMIN);
  }

  /**
   * @return true if the account is admin, false otherwise.
   */
  function isAdmin(address _account) public view returns(bool) {
    return hasRole(_account, ROLE_ADMIN);
  }

  /**
   * @dev add a role to an account
   * @param _account the account that will have the role
   * @param _roleName the name of the role
   */
  function adminAddRole(address _account, string _roleName)
    public
    onlyAdmin
  {
    _addRole(_account, _roleName);
  }

  /**
   * @dev remove a role from an account
   * @param _account the account that will no longer have the role
   * @param _roleName the name of the role
   */
  function adminRemoveRole(address _account, string _roleName)
    public
    onlyAdmin
  {
    _removeRole(_account, _roleName);
  }
}
