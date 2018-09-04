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

  function mint(address _to, uint256 _tokenId) public {
    _mint(_to, _tokenId);
  }

  function burn(uint256 _tokenId) public {
    _burn(ownerOf(_tokenId), _tokenId);
  }

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
