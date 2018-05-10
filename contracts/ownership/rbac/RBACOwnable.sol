pragma solidity ^0.4.23;

import "./RBAC.sol";


/**
 * @title RBACOwnable
 * @author Matt Condon (@shrugs)
 * @dev Ownable logic using RBAC
 */
contract RBACOwnable is RBAC {
  string public constant ROLE_OWNER = "owner";

  constructor()
    public
  {
    addRole(msg.sender, ROLE_OWNER);
  }

  modifier onlyOwner() {
    checkRole(msg.sender, ROLE_OWNER);
    _;
  }

  function addOwner(address _owner)
    onlyOwner
    public
  {
    addRole(_owner, ROLE_OWNER);
  }

  function removeOwner(address _owner)
    onlyOwner
    public
  {
    removeRole(_owner, ROLE_OWNER);
  }
}
