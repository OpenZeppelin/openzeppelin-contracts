pragma solidity ^0.4.21;

import "./ERC721Token.sol";
import "../../ownership/Ownable.sol";


/**
 * @title Mintable ERC721 Token
 */
contract MintableERC721Token is Migratable, Ownable, ERC721Token {
  function initialize(address _sender, string _name, string _symbol) isInitializer("MintableERC721Token", "1.9.0")  public {
    Ownable.initialize(_sender);
    ERC721Token.initialize(_name, _symbol);
  }

  function mint(address _to, uint256 _tokenId) onlyOwner public {
    _mint(_to, _tokenId);
  }
}
