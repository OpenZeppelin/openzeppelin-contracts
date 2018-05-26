pragma solidity ^0.4.23;

import "./MintableERC721Token.sol";
import "../../ownership/rbac/RBAC.sol";


/**
 * @title RBACMintableERC721Token
 * @author Vittorio Minacori (@vittominacori)
 * @dev Mintable ERC721 Token, with RBAC minter permissions
 */
contract RBACMintableERC721Token is MintableERC721Token, RBAC {
  /**
   * A constant role name for indicating minters.
   */
  string public constant ROLE_MINTER = "minter";

  /**
   * @dev override the Mintable ERC721 token modifier to add role based logic
   */
  modifier hasMintPermission() {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }

  constructor(string _name, string _symbol) public
  MintableERC721Token(_name, _symbol)
  { }

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
