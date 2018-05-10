pragma solidity ^0.4.23;

import "../../AutoIncrementing.sol";
import "../../ownership/rbac/RBACOwnable.sol";
import "../../ownership/rbac/RBACMintable.sol";
import "./ERC721Token.sol";


contract MintableERC721Token is Autoincrementing, RBACOwnable, RBACMintable, ERC721Token {
  function mint(address _to, string _tokenURI)
    onlyMinter
    public
    returns (uint256)
  {
    uint256 tokenId = nextId();
    _mint(_to, tokenId);
    _setTokenURI(tokenId, _tokenURI);
    return tokenId;
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
