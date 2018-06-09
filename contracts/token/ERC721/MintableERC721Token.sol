pragma solidity ^0.4.23;

import "../../AutoIncrementing.sol";
import "../../ownership/rbac/RBACOwnable.sol";
import "../../ownership/rbac/RBACMintable.sol";
import "./ERC721Token.sol";


/**
 * @title MintableERC721Token
 * @author Matt Condon (@shrugs)
 * @dev This is an ERC721Token than can be minted by any sender with the role
 * @dev ROLE_MINTER. It features an auto-incrementing tokenId.
 * @dev This contract is designed to be used with a *Bouncer of some sort that
 * @dev provides access control an input verification.
 */
contract MintableERC721Token is AutoIncrementing, RBACOwnable, RBACMintable, ERC721Token { // solium-disable-line max-len

  constructor(string _name, string _symbol)
    ERC721Token(_name, _symbol)
    public
  {
  }

  function mint(address _to, uint256 _tokenId, string _tokenURI)
    onlyMinter
    public
  {
    _mint(_to, _tokenId);
    _setTokenURI(_tokenId, _tokenURI);
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
