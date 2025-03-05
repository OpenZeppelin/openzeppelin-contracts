// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "../../token/ERC721/ERC721.sol";

/**
 * @title MockERC721
 * @dev Implementation of the ERC721 token standard for testing purposes.
 * This contract allows anyone to mint and burn tokens, making it suitable for testing.
 */
contract MockERC721 is ERC721 {
    /**
     * @dev Constructor that sets the name and symbol of the token.
     * @param name The name of the token
     * @param symbol The symbol of the token
     */
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    /**
     * @dev Mints a new token to the specified address.
     * @param to The address that will own the minted token
     * @param tokenId The ID of the token to mint
     */
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    /**
     * @dev Safely mints a new token to the specified address.
     * @param to The address that will own the minted token
     * @param tokenId The ID of the token to mint
     * @param data Additional data with no specified format, sent in call to `to`
     */
    function safeMint(address to, uint256 tokenId, bytes memory data) external {
        _safeMint(to, tokenId, data);
    }

    /**
     * @dev Safely mints a new token to the specified address.
     * @param to The address that will own the minted token
     * @param tokenId The ID of the token to mint
     */
    function safeMint(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
    }

    /**
     * @dev Burns a specific token.
     * @param tokenId The ID of the token to burn
     */
    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }
}
