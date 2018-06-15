pragma solidity ^0.4.24;

import "./MintableToken.sol";
import "../../ownership/rbac/RBAC.sol";


/**
 * @title RBACMintableToken
 * @author Vittorio Minacori (@vittominacori)
 * @dev Mintable Token, with RBAC minter permissions
 */
contract RBACMintableToken is MintableToken, RBAC {
  /**
   * A constant role name for indicating minters.
   */
  string public constant ROLE_MINTER = "minter";

  /**
   * @dev override the Mintable token modifier to add role based logic
   */
  modifier hasMintPermission() {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }

  /**
   * @dev add a minter role to an address
   * @param minter address
   */
  function addMinter(address minter) onlyOwner public {
    addRole(minter, ROLE_MINTER);
  }

  /**
   * @dev remove a minter role from an address
   * @param minter address
   */
  function removeMinter(address minter) onlyOwner public {
    removeRole(minter, ROLE_MINTER);
  }
}
