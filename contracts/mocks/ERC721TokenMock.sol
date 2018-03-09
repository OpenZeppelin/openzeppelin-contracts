pragma solidity ^0.4.18;

import "../token/ERC721/ERC721Token.sol";

/**
 * @title ERC721TokenMock
 * This mock just provides a public mint and burn functions for testing purposes,
 * and a mock metadata URI implementation
 */
contract ERC721TokenMock is ERC721Token {
  function ERC721TokenMock(string name, string symbol)
  ERC721Token(name, symbol)
  public
  { }

  function mint(address _to, uint256 _tokenId) public {
    doMint(_to, _tokenId);
  }

  function burn(uint256 _tokenId) public {
    doBurn(ownerOf(_tokenId), _tokenId);
  }

  // Mock implementation for testing.
  // Do not use this code in production!
  function tokenURI(uint256 _tokenId) public view returns (string) {
    require(exists(_tokenId));
    
    bytes memory uri = new bytes(78 + 7);
    
    uint256 i;
    uint256 value = _tokenId;
    
    uri[0] = "m";
    uri[1] = "o";
    uri[2] = "c";
    uri[3] = "k";
    uri[4] = ":";
    uri[5] = "/";
    uri[6] = "/";
    for (i = 0; i < 78; i++) {
      uri[6 + 78 - i] = byte(value % 10 + 48);
      value = value / 10;
    }

    return string(uri);
  }
}
