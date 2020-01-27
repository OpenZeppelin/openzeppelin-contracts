pragma solidity ^0.6.0;

import "./ERC721.sol";
import "../../lifecycle/Pausable.sol";

/**
 * @title ERC721 Non-Fungible Pausable token
 * @dev ERC721 modified with pausable transfers.
 */
contract ERC721Pausable is ERC721, Pausable {
    function approve(address to, uint256 tokenId) public whenNotPaused virtual override {
        super.approve(to, tokenId);
    }

    function setApprovalForAll(address to, bool approved) public whenNotPaused virtual override {
        super.setApprovalForAll(to, approved);
    }

    function _transferFrom(address from, address to, uint256 tokenId) internal whenNotPaused virtual override {
        super._transferFrom(from, to, tokenId);
    }
}
