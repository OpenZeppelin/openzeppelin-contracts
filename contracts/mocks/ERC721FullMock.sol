pragma solidity ^0.4.24;

import "../token/ERC721/ERC721Full.sol";
import "../token/ERC721/ERC721Mintable.sol";
import "../token/ERC721/ERC721Burnable.sol";


/**
 * @title ERC721Mock
 * This mock just provides a public mint and burn functions for testing purposes,
 * and a public setter for metadata URI
 */
contract ERC721FullMock is ERC721Full, ERC721Mintable, ERC721Burnable {
  constructor(string name, string symbol) public
    ERC721Mintable()
    ERC721Full(name, symbol)
  {}

  function exists(uint256 tokenId) public view returns (bool) {
    return _exists(tokenId);
  }

  function setTokenURI(uint256 tokenId, string uri) public {
    _setTokenURI(tokenId, uri);
  }

  function removeTokenFrom(address from, uint256 tokenId) public {
    _removeTokenFrom(from, tokenId);
  }
}
