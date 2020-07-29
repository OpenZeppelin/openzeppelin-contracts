// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../token/ERC721/ERC721Burnable.sol";

contract ERC721BurnableMock is ERC721Burnable {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) { }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
