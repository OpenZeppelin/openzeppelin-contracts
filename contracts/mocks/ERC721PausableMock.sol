pragma solidity ^0.4.24;

import "../token/ERC721/ERC721Pausable.sol";


/**
 * @title ERC721PausableMock
 * This mock just provides a public mint, burn and exists functions for testing purposes
 */
contract ERC721PausableMock is ERC721Pausable {
  function mint(address _to, uint256 _tokenId) public {
    super._mint(_to, _tokenId);
  }

  function burn(uint256 _tokenId) public {
    super._burn(ownerOf(_tokenId), _tokenId);
  }

  function exists(uint256 _tokenId) public view returns (bool) {
    return super._exists(_tokenId);
  }
}
