pragma solidity ^0.6.0;

import "./ERC721.sol";
import "../../lifecycle/Pausable.sol";

/**
 * @title ERC721 Non-Fungible Pausable token
 * @dev ERC721 modified with pausable transfers.
 */
contract ERC721Pausable is ERC721, Pausable {
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        require(!paused(), "ERC721Pausable: token transfer while paused");
    }

    function _beforeTokenApproval(address to, uint256 tokenId) internal virtual override {
        super._beforeTokenApproval(to, tokenId);

        require(!paused(), "ERC721Pausable: token approval while paused");
    }

    function _beforeOperatorApproval(address holder, address operator, bool approved) internal virtual override {
        super._beforeOperatorApproval(holder, operator, approved);

        require(!paused(), "ERC721Pausable: operator approval while paused");
    }
}
