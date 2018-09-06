pragma solidity ^0.4.24;

import "../token/ERC721/ERC721.sol";


/**
 * @title ERC721Mock
 * This mock just provides a public mint and burn functions for testing purposes,
 * and a public setter for metadata URI
 */
contract ERC721Mock is ERC721 {
  constructor(string name, string symbol) public
    ERC721(name, symbol)
  { }

  function mint(address to, uint256 tokenId) public {
    _mint(to, tokenId);
  }

  function burn(uint256 tokenId) public {
    _burn(ownerOf(tokenId), tokenId);
  }

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
