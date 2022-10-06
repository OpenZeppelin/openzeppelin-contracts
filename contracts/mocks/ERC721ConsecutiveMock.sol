// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/ERC721Burnable.sol";
import "../token/ERC721/extensions/ERC721Consecutive.sol";
import "../token/ERC721/extensions/ERC721Enumerable.sol";
import "../token/ERC721/extensions/ERC721Pausable.sol";
import "../token/ERC721/extensions/ERC721Votes.sol";

/**
 * @title ERC721ConsecutiveMock
 */
contract ERC721ConsecutiveMock is ERC721Burnable, ERC721Consecutive, ERC721Pausable, ERC721Votes {
    constructor(
        string memory name,
        string memory symbol,
        address[] memory delegates,
        address[] memory receivers,
        uint96[] memory amounts
    ) ERC721(name, symbol) EIP712(name, "1") {
        for (uint256 i = 0; i < delegates.length; ++i) {
            _delegate(delegates[i], delegates[i]);
        }

        for (uint256 i = 0; i < receivers.length; ++i) {
            _mintConsecutive(receivers[i], amounts[i]);
        }
    }

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

    function mintConsecutive(address to, uint96 amount) public {
        _mintConsecutive(to, amount);
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function _ownerOf(uint256 tokenId) internal view virtual override(ERC721, ERC721Consecutive) returns (address) {
        return super._ownerOf(tokenId);
    }

    function _mint(address to, uint256 tokenId) internal virtual override(ERC721, ERC721Consecutive) {
        super._mint(to, tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Votes, ERC721Consecutive) {
        super._afterTokenTransfer(from, to, firstTokenId, batchSize);
    }
}

contract ERC721ConsecutiveNoConstructorMintMock is ERC721Consecutive {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _mint(msg.sender, 0);
    }
}
