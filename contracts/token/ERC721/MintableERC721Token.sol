pragma solidity ^0.4.21;

import "./ERC721Token.sol";
import "../../ownership/Ownable.sol";

/**
 * @title Mintable ERC721 Token
 */
contract MintableERC721Token is Ownable, ERC721Token {
  function mint(address _to, uint256 _tokenId) onlyOwner public {
    _mint(_to, _tokenId);
  }
}
