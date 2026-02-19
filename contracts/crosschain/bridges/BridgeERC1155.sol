// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {IERC1155} from "../../interfaces/IERC1155.sol";
import {IERC1155Receiver} from "../../interfaces/IERC1155Receiver.sol";
import {IERC1155Errors} from "../../interfaces/draft-IERC6093.sol";
import {ERC1155Holder} from "../../token/ERC1155/utils/ERC1155Holder.sol";
import {BridgeMultiToken} from "./abstract/BridgeMultiToken.sol";

/**
 * @dev This is a variant of {BridgeMultiToken} that implements the bridge logic for ERC-1155 tokens that do not expose
 * a crosschain mint and burn mechanism. Instead, it takes custody of bridged assets.
 */
// slither-disable-next-line locked-ether
abstract contract BridgeERC1155 is BridgeMultiToken, ERC1155Holder {
    IERC1155 private immutable _token;

    constructor(IERC1155 token_) {
        _token = token_;
    }

    /// @dev Return the address of the ERC1155 token this bridge operates on.
    function token() public view virtual returns (IERC1155) {
        return _token;
    }

    /**
     * @dev Transfer `amount` tokens to a crosschain receiver.
     *
     * Note: The `to` parameter is the full InteroperableAddress (chain ref + address).
     */
    function crosschainTransferFrom(address from, bytes memory to, uint256 id, uint256 value) public returns (bytes32) {
        uint256[] memory ids = new uint256[](1);
        uint256[] memory values = new uint256[](1);
        ids[0] = id;
        values[0] = value;

        return crosschainTransferFrom(from, to, ids, values);
    }

    /**
     * @dev Transfer `amount` tokens to a crosschain receiver.
     *
     * Note: The `to` parameter is the full InteroperableAddress (chain ref + address).
     */
    function crosschainTransferFrom(
        address from,
        bytes memory to,
        uint256[] memory ids,
        uint256[] memory values
    ) public virtual returns (bytes32) {
        // Permission is handled using the ERC1155's allowance system. This check replicates `ERC1155._checkAuthorized`.
        address spender = _msgSender();
        require(
            from == spender || token().isApprovedForAll(from, spender),
            IERC1155Errors.ERC1155MissingApprovalForAll(spender, from)
        );

        // Perform the crosschain transfer and return the handler
        return _crosschainTransfer(from, to, ids, values);
    }

    /// @dev "Locking" tokens is done by taking custody
    function _onSend(address from, uint256[] memory ids, uint256[] memory values) internal virtual override {
        token().safeBatchTransferFrom(from, address(this), ids, values, "");
    }

    /// @dev "Unlocking" tokens is done by releasing custody
    function _onReceive(address to, uint256[] memory ids, uint256[] memory values) internal virtual override {
        token().safeBatchTransferFrom(address(this), to, ids, values, "");
    }

    /// @dev Support receiving tokens only if the transfer was initiated by the bridge itself.
    function onERC1155Received(
        address operator,
        address /* from */,
        uint256 /* id */,
        uint256 /* value */,
        bytes memory /* data */
    ) public virtual override returns (bytes4) {
        return
            msg.sender == address(_token) && operator == address(this)
                ? IERC1155Receiver.onERC1155Received.selector
                : bytes4(0);
    }

    /// @dev Support receiving tokens only if the transfer was initiated by the bridge itself.
    function onERC1155BatchReceived(
        address operator,
        address /* from */,
        uint256[] memory /* ids */,
        uint256[] memory /* values */,
        bytes memory /* data */
    ) public virtual override returns (bytes4) {
        return
            msg.sender == address(_token) && operator == address(this)
                ? IERC1155Receiver.onERC1155BatchReceived.selector
                : bytes4(0);
    }
}
