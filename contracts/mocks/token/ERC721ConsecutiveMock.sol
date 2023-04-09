// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC721/extensions/ERC721Consecutive.sol";
import "../../token/ERC721/extensions/ERC721Enumerable.sol";
import "../../token/ERC721/extensions/ERC721Pausable.sol";

/**
 * @title ERC721ConsecutiveMock
 */
contract ERC721ConsecutiveMock is ERC721Consecutive, ERC721Pausable {
    constructor(
        string memory name,
        string memory symbol,
        address[] memory receivers,
        uint96[] memory amounts
    ) ERC721(name, symbol) {
        for (uint256 i = 0; i < receivers.length; ++i) {
            _mintConsecutive(receivers[i], amounts[i]);
        }
    }
    function _update(
        address from,
        address to,
        uint256 tokenId,
        bool safe,
        bytes memory data
    ) internal virtual override(ERC721Consecutive, ERC721Pausable) {
        super._update(from, to, tokenId, safe, data);
    }

    function _ownerOf(uint256 tokenId) internal view virtual override(ERC721, ERC721Consecutive) returns (address) {
        return super._ownerOf(tokenId);
    }

    function _mint(address to, uint256 tokenId) internal virtual override(ERC721, ERC721Consecutive) {
        super._mint(to, tokenId);
    }
}

contract ERC721ConsecutiveNoConstructorMintMock is ERC721Consecutive {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _mint(msg.sender, 0);
    }
}
