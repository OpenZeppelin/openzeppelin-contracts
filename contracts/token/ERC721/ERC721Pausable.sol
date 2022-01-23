pragma solidity ^0.5.0;

import "./ERC721.sol";
import "../../lifecycle/Pausable.sol";

/**
 * @title ERC721 Non-Fungible Pausable token
 * @dev ERC721 modified with pausable transfers.
 */
contract ERC721Pausable is ERC721, Pausable {
    function approve(address to, uint256 tokenId) public whenNotPaused {
        super.approve(to, tokenId);
    }

    function setApprovalForAll(address to, bool approved) public whenNotPaused {
        super.setApprovalForAll(to, approved);
    }

    function _transferFrom(address from, address to, uint256 tokenId) internal whenNotPaused {
        super._transferFrom(from, to, tokenId);
    }
}
