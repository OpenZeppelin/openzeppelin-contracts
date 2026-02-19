// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {ERC1155} from "../ERC1155.sol";
import {BridgeMultiToken} from "../../../crosschain/bridges/abstract/BridgeMultiToken.sol";

/**
 * @dev Extension of {ERC1155} that makes it natively cross-chain using the ERC-7786 based {BridgeMultiToken}.
 *
 * This extension makes the token compatible with:
 * * {ERC1155Crosschain} instances on other chains,
 * * {ERC1155} instances on other chains that are bridged using {BridgeERC1155},
 */
// slither-disable-next-line locked-ether
abstract contract ERC1155Crosschain is ERC1155, BridgeMultiToken {
    /// @dev TransferFrom variant of {crosschainTransferFrom}, using ERC1155 allowance from the sender to the caller.
    function crosschainTransferFrom(
        address from,
        bytes memory to,
        uint256 id,
        uint256 value
    ) public virtual returns (bytes32) {
        _checkAuthorized(_msgSender(), from);

        uint256[] memory ids = new uint256[](1);
        uint256[] memory values = new uint256[](1);
        ids[0] = id;
        values[0] = value;
        return _crosschainTransfer(from, to, ids, values);
    }

    /// @dev TransferFrom variant of {crosschainTransferFrom}, using ERC1155 allowance from the sender to the caller.
    function crosschainTransferFrom(
        address from,
        bytes memory to,
        uint256[] memory ids,
        uint256[] memory values
    ) public virtual returns (bytes32) {
        _checkAuthorized(_msgSender(), from);
        return _crosschainTransfer(from, to, ids, values);
    }

    /// @dev "Locking" tokens is achieved through burning
    function _onSend(address from, uint256[] memory ids, uint256[] memory values) internal virtual override {
        _burnBatch(from, ids, values);
    }

    /// @dev "Unlocking" tokens is achieved through minting
    function _onReceive(address to, uint256[] memory ids, uint256[] memory values) internal virtual override {
        _mintBatch(to, ids, values, "");
    }
}
