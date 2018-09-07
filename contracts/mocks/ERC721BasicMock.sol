pragma solidity ^0.4.24;

import "../token/ERC721/ERC721Basic.sol";


/**
 * @title ERC721BasicMock
 * This mock just provides a public mint and burn functions for testing purposes
 */
contract ERC721BasicMock is ERC721Basic {
  function mint(address to, uint256 tokenId) public {
    _mint(to, tokenId);
  }

  function burn(uint256 tokenId) public {
    _burn(ownerOf(tokenId), tokenId);
  }
}
