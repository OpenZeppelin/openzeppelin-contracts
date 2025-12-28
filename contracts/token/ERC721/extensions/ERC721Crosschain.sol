// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {ERC721} from "../ERC721.sol";
import {BridgeERC721Core} from "../../../crosschain/bridges/BridgeERC721Core.sol";

/**
 * @dev Extension of {ERC721} that makes it natively cross-chain using the ERC-7786 based {BridgeERC721Core}.
 *
 * This extension makes the token compatible with:
 * * {ERC721Crosschain} instances on other chains,
 * * {ERC721} instances on other chains that are bridged using {BridgeERC721},
 */
// slither-disable-next-line locked-ether
abstract contract ERC721Crosschain is ERC721, BridgeERC721Core {
    /// @dev Variant of {crosschainTransferFrom} that uses `_msgSender()` for the `from` for compatibility with {BridgeERc721}
    function crosschainTransfer(bytes memory to, uint256 tokenId) public virtual returns (bytes32) {
        return crosschainTransferFrom(_msgSender(), to, tokenId);
    }

    /// @dev TransferFrom variant of {crosschainTransferFrom}, using ERC721 allowance from the sender to the caller.
    function crosschainTransferFrom(address from, bytes memory to, uint256 tokenId) public virtual returns (bytes32) {
        // operator (msg.sender) permission over `from` is checked in `_onSend`
        return _crosschainTransfer(from, to, tokenId);
    }

    /// @dev "Locking" tokens is achieved through burning
    function _onSend(address from, uint256 tokenId) internal virtual override {
        address previousOwner = _update(address(0), tokenId, _msgSender());
        if (previousOwner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        } else if (previousOwner != from) {
            revert ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }

    /// @dev "Unlocking" tokens is achieved through minting
    function _onReceive(address to, uint256 tokenId) internal virtual override {
        _mint(to, tokenId);
    }
}
