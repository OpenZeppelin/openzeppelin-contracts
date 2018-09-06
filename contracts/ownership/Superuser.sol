pragma solidity ^0.4.24;


import "./Ownable.sol";
import "../access/rbac/RBAC.sol";


/**
 * @title Superuser
 * @dev The Superuser contract defines a single superuser who can transfer the ownership
 * of a contract to a new address, even if he is not the owner.
 * A superuser can transfer his role to a new address.
 */
contract Superuser is Ownable, RBAC {
  string private constant _ROLE_SUPERUSER = "superuser";

  constructor () public {
    _addRole(msg.sender, _ROLE_SUPERUSER);
  }

  /**
   * @dev Throws if called by any account that's not a superuser.
   */
  modifier onlySuperuser() {
    checkRole(msg.sender, _ROLE_SUPERUSER);
    _;
  }

  modifier onlyOwnerOrSuperuser() {
    require(msg.sender == owner() || isSuperuser(msg.sender));
    _;
  }

  /**
   * @dev getter to determine if an account has superuser role
   */
  function isSuperuser(address account)
    public
    view
    returns (bool)
  {
    return hasRole(account, _ROLE_SUPERUSER);
  }

  /**
   * @dev Allows the current superuser to transfer his role to a newSuperuser.
   * @param newSuperuser The address to transfer ownership to.
   */
  function transferSuperuser(address newSuperuser) public onlySuperuser {
    require(newSuperuser != address(0));
    _removeRole(msg.sender, _ROLE_SUPERUSER);
    _addRole(newSuperuser, _ROLE_SUPERUSER);
  }

  /**
   * @dev Allows the current superuser or owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwnerOrSuperuser {
    _transferOwnership(newOwner);
  }
}
