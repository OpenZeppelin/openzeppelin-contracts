pragma solidity ^0.4.18;

import "./ERC721BasicTokenMock.sol";
import "../token/ERC721/ERC721Token.sol";

/**
 * @title ERC721TokenMock
 * This mock just provides a public mint and burn functions for testing purposes,
 * and a mock metadata URI implementation
 */
contract ERC721TokenMock is ERC721Token, ERC721BasicTokenMock {
  function ERC721TokenMock(string name, string symbol)
  ERC721BasicTokenMock()
  ERC721Token(name, symbol)
  public
  { }

  // Mock implementation for testing.
  // Do not use this code in production!
  function tokenURI(uint256 _tokenId) public view returns (string) {
    require(exists(_tokenId));
    
    bytes memory uri = new bytes(78);
    
    uint256 i;
    uint256 value = _tokenId;
    
    for (i = 0; i < 78; i++) {
      uri[7 + 78 - i] = byte(value % 10 + 48);
      value = value / 10;
    }

    return string(uri);
  }
}
