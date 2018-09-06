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
  string private constant ROLE_MINTER = "minter";

  /**
   * @dev override the Mintable token modifier to add role based logic
   */
  modifier onlyMinter() {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }

  /**
   * @return true if the account is a minter, false otherwise.
   */
  function isMinter(address _account) public view returns(bool) {
    return hasRole(_account, ROLE_MINTER);
  }

  /**
   * @dev add a minter role to an address
   * @param _minter address
   */
  function addMinter(address _minter) public onlyOwner {
    _addRole(_minter, ROLE_MINTER);
  }

  /**
   * @dev remove a minter role from an address
   * @param _minter address
   */
  function removeMinter(address _minter) public onlyOwner {
    _removeRole(_minter, ROLE_MINTER);
  }
}
