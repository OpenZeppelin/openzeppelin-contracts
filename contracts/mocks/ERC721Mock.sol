pragma solidity ^0.4.24;

import "../token/ERC721/ERC721.sol";
import "../token/ERC721/ERC721Mintable.sol";
import "../token/ERC721/ERC721Burnable.sol";


/**
 * @title ERC721Mock
 * This mock just provides a public mint and burn functions for testing purposes,
 * and a public setter for metadata URI
 */
contract ERC721Mock is ERC721, ERC721Mintable, ERC721Burnable {
  constructor(string _name, string _symbol) public
    ERC721Mintable()
    ERC721(_name, _symbol)
  {}

  function exists(uint256 _tokenId) public view returns (bool) {
    return _exists(_tokenId);
  }

  function setTokenURI(uint256 _tokenId, string _uri) public {
    _setTokenURI(_tokenId, _uri);
  }

  function removeTokenFrom(address _from, uint256 _tokenId) public {
    _removeTokenFrom(_from, _tokenId);
  }
}
