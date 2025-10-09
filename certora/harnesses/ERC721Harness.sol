// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC721} from "../patched/token/ERC721/ERC721.sol";

contract ERC721Harness is ERC721 {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address account, uint256 tokenId) external {
        _mint(account, tokenId);
    }

    function safeMint(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
    }

    function safeMint(address to, uint256 tokenId, bytes memory data) external {
        _safeMint(to, tokenId, data);
    }

    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }

    function unsafeBalanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function unsafeOwnerOf(uint256 tokenId) external view returns (address) {
        return _ownerOf(tokenId);
    }

    function unsafeGetApproved(uint256 tokenId) external view returns (address) {
        return _getApproved(tokenId);
    }
}
