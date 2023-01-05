// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/ERC721Pausable.sol";

/**
 * @title ERC721PausableMock
 * This mock just provides a public mint, burn and exists functions for testing purposes
 */
contract ERC721PausableMock is ERC721Pausable {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        _safeMint(to, tokenId, _data);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }
}
