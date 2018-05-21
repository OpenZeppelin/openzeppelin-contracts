pragma solidity ^0.4.23;


import "./Ownable.sol";
import "./rbac/RBAC.sol";


/**
 * @title Superuser
 * @dev The Superuser contract defines a single superuser who can transfer the ownership 
 * @dev of a contract to a new address, even if he is not the owner. 
 * @dev A superuser can transfer his role to a new address. 
 */
contract Superuser is Ownable, RBAC {
  event SuperuserTransferred(address indexed previousSuperuser, address indexed newSuperuser);
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  string public constant ROLE_SUPERUSER = "superuser";

  constructor () {
    addRole(msg.sender, ROLE_SUPERUSER);
  }

  /**
   * @dev Throws if called by any account that's not a superuser.
   */
  modifier onlySuperuser() {
    checkRole(msg.sender, ROLE_SUPERUSER);
    _;
  }

    /**
   * @dev getter to determine if address has superuser role
   */
  function superuser(address addr)
    public
    view
    returns (bool)
  {
    return hasRole(addr, ROLE_SUPERUSER);
  }

  /**
   * @dev Allows the current superuser to transfer his role to a newSuperuser.
   * @param newSuperuser The address to transfer ownership to.
   */
  function transferSuperuser(address newSuperuser) 
    onlySuperuser
    public
  {
    require(newSuperuser != address(0));
    emit SuperuserTransferred(msg.sender, newSuperuser);
    removeRole(msg.sender, ROLE_SUPERUSER);
    addRole(newSuperuser, ROLE_SUPERUSER);
  }

  /**
   * @dev Allows the current superuser to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlySuperuser {
    require(newOwner != address(0));
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }
}
