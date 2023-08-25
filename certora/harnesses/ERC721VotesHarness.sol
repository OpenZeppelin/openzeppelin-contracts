// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../patched/token/ERC721/extensions/ERC721Votes.sol";

contract ERC721VotesHarness is ERC721Votes {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) EIP712(name, symbol) {}

    function mint(address account, uint256 tokenID) public {
        _mint(account, tokenID);
    }

    function burn(uint256 tokenID) public {
        _burn(tokenID);
    }
}
