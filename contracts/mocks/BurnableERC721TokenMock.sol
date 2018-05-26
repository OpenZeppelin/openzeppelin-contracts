pragma solidity ^0.4.23;

import "../token/ERC721/BurnableERC721Token.sol";


/**
 * @title BurnableERC721TokenMock
 * This mock just provides a public setter for metadata URI
 */
contract BurnableERC721TokenMock is BurnableERC721Token {
  constructor(string name, string symbol) public
  BurnableERC721Token(name, symbol)
  { }

  function mint(address _to, uint256 _tokenId) public {
    super._mint(_to, _tokenId);
  }
}
