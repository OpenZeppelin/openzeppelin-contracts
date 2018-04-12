pragma solidity ^0.4.18;

import "./RBAC.sol";


/**
 * @title RBACOwnable
 * @author Matt Condon (@shrugs)
 * @dev RBACOwnable re-implements the Ownable API (sans public owner() getter) using
 * @dev the RBAC library. Contracts inheriting from RBACOwnable can use
 * #dev the RBAC library to implement additional roles as well.
 */
contract RBACOwnable is RBAC {
  string public constant ROLE_OWNER = "owner";


  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


  modifier onlyValidAddress(address _addr)
  {
    require(_addr != address(0));
    _;
  }

  modifier onlyOwner()
  {
    checkRole(msg.sender, ROLE_OWNER);
    _;
  }

  function RBACOwnable()
    public
  {
    addRole(msg.sender, ROLE_OWNER);
  }

  function transferOwnership(address _owner)
    onlyOwner
    onlyValidAddress(_owner)
    public
  {
    addRole(_owner, ROLE_OWNER);
    removeRole(msg.sender, ROLE_OWNER);
    OwnershipTransferred(msg.sender, _owner);
  }
}
