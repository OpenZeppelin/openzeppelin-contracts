pragma solidity ^0.4.24;

import "./RBAC.sol";


/**
 * @title RBACOwnable
 * @author Matt Condon (@shrugs)
 * @dev Ownable logic using RBAC.
 * @dev Use RBACOwnable if you could have many different owners and you're ok with
 * @dev the security profile of any owner being able to add another owner.
 * @dev Only difference from Ownable.sol is that the owners are not stored as public variables.
 */
contract RBACOwnable is RBAC {
  string public constant ROLE_OWNER = "owner";

  constructor()
    public
  {
    addRole(msg.sender, ROLE_OWNER);
  }

  modifier onlyOwners() {
    checkRole(msg.sender, ROLE_OWNER);
    _;
  }

  function addOwner(address _owner)
    onlyOwners
    public
  {
    addRole(_owner, ROLE_OWNER);
  }

  function removeOwner(address _owner)
    onlyOwners
    public
  {
    removeRole(_owner, ROLE_OWNER);
  }
}
