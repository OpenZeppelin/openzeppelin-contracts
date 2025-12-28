// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {IERC721} from "../../interfaces/IERC721.sol";
import {IERC721Receiver} from "../../interfaces/IERC721Receiver.sol";
import {BridgeERC721Core} from "./BridgeERC721Core.sol";

/**
 * @dev This is a variant of {BridgeERC721Core} that implements the bridge logic for ERC-721 tokens that do not expose
 * a crosschain mint and burn mechanism. Instead, it takes custody of bridged assets.
 */
// slither-disable-next-line locked-ether
abstract contract BridgeERC721 is IERC721Receiver, BridgeERC721Core {
    IERC721 private immutable _token;

    constructor(IERC721 token_) {
        _token = token_;
    }

    /// @dev Return the address of the ERC721 token this bridge operates on.
    function token() public view virtual returns (IERC721) {
        return _token;
    }

    /**
     * @dev Transfer `amount` tokens to a crosschain receiver.
     *
     * Note: The `to` parameter is the full InteroperableAddress (chain ref + address).
     */
    function crosschainTransfer(bytes memory to, uint256 tokenId) public virtual returns (bytes32) {
        // Note: do not use safeTransferFrom here! Using it would trigger the `onERC721Received` which we don't want.
        token().transferFrom(msg.sender, address(this), tokenId);
        return _crosschainTransfer(msg.sender, to, tokenId);
    }

    /**
     * @dev Transfer a token received using an ERC-721 safeTransferFrom
     *
     * Note: The `data` must contain the `to` as a full InteroperableAddress (chain ref + address).
     */
    function onERC721Received(
        address /*operator*/,
        address from,
        uint256 tokenId,
        bytes calldata data // this is the to
    ) public virtual override returns (bytes4) {
        require(msg.sender == address(_token)); // TODO
        _crosschainTransfer(from, data, tokenId);
        return IERC721Receiver.onERC721Received.selector;
    }

    /// @dev "Locking" tokens is done by taking custody
    function _onSend(address from, uint256 tokenId) internal virtual override {
        // Do nothing, token movement is handled by `crosschainTransfer` and `onERC721Received`
    }

    /**
     * @dev "Unlocking" tokens is done by releasing custody
     *
     * NOTE: `safeTransferFrom` will revert if the receiver is a contract that doesn't implement {IERC721Receiver}
     * This can be retried by at the ERC-7786 gateway level.
     */
    function _onReceive(address to, uint256 tokenId) internal virtual override {
        token().safeTransferFrom(address(this), to, tokenId);
    }
}
