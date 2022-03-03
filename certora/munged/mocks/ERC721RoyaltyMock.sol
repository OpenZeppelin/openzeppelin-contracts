// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/ERC721Royalty.sol";

contract ERC721RoyaltyMock is ERC721Royalty {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function setTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint96 fraction
    ) public {
        _setTokenRoyalty(tokenId, recipient, fraction);
    }

    function setDefaultRoyalty(address recipient, uint96 fraction) public {
        _setDefaultRoyalty(recipient, fraction);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

    function deleteDefaultRoyalty() public {
        _deleteDefaultRoyalty();
    }
}
