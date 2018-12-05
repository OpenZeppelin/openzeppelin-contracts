pragma solidity ^0.4.24;

import "../token/ERC721/ERC721.sol";

/**
 * @title ERC721Mock
 * This mock just provides a public mint and burn functions for testing purposes
 */
contract ERC721Mock is ERC721 {
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function burn(uint256 tokenId) public {
        _burn(ownerOf(tokenId), tokenId);
    }
}
