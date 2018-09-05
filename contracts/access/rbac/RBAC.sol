pragma solidity ^0.4.24;

import "./Roles.sol";


/**
 * @title RBAC (Role-Based Access Control)
 * @author Matt Condon (@Shrugs)
 * @dev Stores and provides setters and getters for roles and addresses.
 * Supports unlimited numbers of roles and addresses.
 * See //contracts/mocks/RBACMock.sol for an example of usage.
 * This RBAC method uses strings to key roles. It may be beneficial
 * for you to write your own implementation of this interface using Enums or similar.
 */
contract RBAC {
  using Roles for Roles.Role;

  mapping (string => Roles.Role) private _roles;

  event RoleAdded(address indexed operator, string role);
  event RoleRemoved(address indexed operator, string role);

  /**
   * @dev reverts if addr does not have role
   * @param operator address
   * @param role the name of the role
   * // reverts
   */
  function checkRole(address operator, string role)
    public
    view
  {
    _roles[role].check(operator);
  }

  /**
   * @dev determine if addr has role
   * @param operator address
   * @param role the name of the role
   * @return bool
   */
  function hasRole(address operator, string role)
    public
    view
    returns (bool)
  {
    return _roles[role].has(operator);
  }

  /**
   * @dev add a role to an address
   * @param operator address
   * @param role the name of the role
   */
  function _addRole(address operator, string role)
    internal
  {
    _roles[role].add(operator);
    emit RoleAdded(operator, role);
  }

  /**
   * @dev remove a role from an address
   * @param operator address
   * @param role the name of the role
   */
  function _removeRole(address operator, string role)
    internal
  {
    _roles[role].remove(operator);
    emit RoleRemoved(operator, role);
  }

  /**
   * @dev modifier to scope access to a single role (uses msg.sender as addr)
   * @param role the name of the role
   * // reverts
   */
  modifier onlyRole(string role)
  {
    checkRole(msg.sender, role);
    _;
  }

  /**
   * @dev modifier to scope access to a set of roles (uses msg.sender as addr)
   * @param roles the names of the roles to scope access to
   * // reverts
   *
   * @TODO - when solidity supports dynamic arrays as arguments to modifiers, provide this
   *  see: https://github.com/ethereum/solidity/issues/2467
   */
  // modifier onlyRoles(string[] roles) {
  //     bool hasAnyRole = false;
  //     for (uint8 i = 0; i < _roles.length; i++) {
  //         if (hasRole(msg.sender, _roles[i])) {
  //             hasAnyRole = true;
  //             break;
  //         }
  //     }

  //     require(hasAnyRole);

  //     _;
  // }
}
