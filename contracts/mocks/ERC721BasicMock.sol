pragma solidity ^0.4.24;

import "../token/ERC721/ERC721Basic.sol";


/**
 * @title ERC721BasicMock
 * This mock just provides a public mint and burn functions for testing purposes
 */
contract ERC721BasicMock is ERC721Basic {
  function mint(address _to, uint256 _tokenId) public {
    super._mint(_to, _tokenId);
  }

  function burn(uint256 _tokenId) public {
    super._burn(ownerOf(_tokenId), _tokenId);
  }
}
