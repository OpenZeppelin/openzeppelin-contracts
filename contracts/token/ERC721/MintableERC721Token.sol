pragma solidity ^0.4.24;

import "../../ownership/rbac/RBACOwnable.sol";
import "../../ownership/rbac/RBACMintable.sol";
import "./ERC721Token.sol";


/**
 * @title MintableERC721Token
 * @author Matt Condon (@shrugs), Vittorio Minacori (@vittominacori)
 * @dev This is an ERC721Token than can be minted by any sender with the role
 * ROLE_MINTER. This contract is designed to be used either directly by an Ethereum account
 * or with some other access control and input verification like a Bouncer.
 */
contract MintableERC721Token is RBACOwnable, RBACMintable, ERC721Token {

  event MintFinished();
  bool public mintingFinished = false;

  modifier onlyMinterOrOwner() {
    require(
      hasRole(msg.sender, ROLE_MINTER) ||
      hasRole(msg.sender, ROLE_OWNER)
    );
    _;
  }

  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  function mint(address _to, uint256 _tokenId, string _tokenURI)
    canMint
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

  /**
   * @dev Enforce that no more tokens can be minted, callable by any minter
   */
  function finishMinting()
    canMint
    onlyMinterOrOwner
    public
    returns (bool)
  {
    mintingFinished = true;
    emit MintFinished();
    return true;
  }
}
