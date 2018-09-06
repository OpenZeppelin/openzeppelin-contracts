pragma solidity ^0.4.24;

import "./ERC20Mintable.sol";
import "../../access/rbac/RBAC.sol";


/**
 * @title RBACMintableToken
 * @author Vittorio Minacori (@vittominacori)
 * @dev Mintable Token, with RBAC minter permissions
 */
contract RBACMintableToken is ERC20Mintable, RBAC {
  /**
   * A constant role name for indicating minters.
   */
  string private constant _ROLE_MINTER = "minter";

  /**
   * @dev override the Mintable token modifier to add role based logic
   */
  modifier onlyMinter() {
    checkRole(msg.sender, _ROLE_MINTER);
    _;
  }

  /**
   * @return true if the account is a minter, false otherwise.
   */
  function isMinter(address account) public view returns(bool) {
    return hasRole(account, _ROLE_MINTER);
  }

  /**
   * @dev add a minter role to an address
   * @param minter address
   */
  function addMinter(address minter) public onlyOwner {
    _addRole(minter, _ROLE_MINTER);
  }

  /**
   * @dev remove a minter role from an address
   * @param minter address
   */
  function removeMinter(address minter) public onlyOwner {
    _removeRole(minter, _ROLE_MINTER);
  }
}
