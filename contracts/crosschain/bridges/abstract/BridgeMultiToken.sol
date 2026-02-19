// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {InteroperableAddress} from "../../../utils/draft-InteroperableAddress.sol";
import {Context} from "../../../utils/Context.sol";
import {ERC7786Recipient} from "../../ERC7786Recipient.sol";
import {CrosschainLinked} from "../../CrosschainLinked.sol";

/**
 * @dev Base contract for bridging ERC-1155 between chains using an ERC-7786 gateway.
 *
 * In order to use this contract, two functions must be implemented to link it to the token:
 * * {_onSend}: called when a crosschain transfer is going out. Must take the sender tokens or revert.
 * * {_onReceive}: called when a crosschain transfer is coming in. Must give tokens to the receiver.
 *
 * This base contract is used by the {BridgeERC1155}, which interfaces with legacy ERC-1155 tokens. It is also used by
 * the {ERC1155Crosschain} extension, which embeds the bridge logic directly in the token contract.
 *
 * This base contract implements the crosschain transfer operation though internal functions. It is for the the "child
 * contracts" that inherit from this to implement the external interfaces and make this functions accessible.
 */
abstract contract BridgeMultiToken is Context, CrosschainLinked {
    using InteroperableAddress for bytes;

    event CrosschainMultiTokenTransferSent(
        bytes32 indexed sendId,
        address indexed from,
        bytes to,
        uint256[] ids,
        uint256[] values
    );
    event CrosschainMultiTokenTransferReceived(
        bytes32 indexed receiveId,
        bytes from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    /**
     * @dev Internal crosschain transfer function.
     *
     * Note: The `to` parameter is the full InteroperableAddress (chain ref + address).
     */
    function _crosschainTransfer(
        address from,
        bytes memory to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual returns (bytes32) {
        _onSend(from, ids, values);

        (bytes2 chainType, bytes memory chainReference, bytes memory addr) = to.parseV1();
        bytes memory chain = InteroperableAddress.formatV1(chainType, chainReference, hex"");

        bytes32 sendId = _sendMessageToCounterpart(
            chain,
            abi.encode(InteroperableAddress.formatEvmV1(block.chainid, from), addr, ids, values),
            new bytes[](0)
        );

        emit CrosschainMultiTokenTransferSent(sendId, from, to, ids, values);
        return sendId;
    }

    /// @inheritdoc ERC7786Recipient
    function _processMessage(
        address /*gateway*/,
        bytes32 receiveId,
        bytes calldata /*sender*/,
        bytes calldata payload
    ) internal virtual override {
        // NOTE: Gateway is validated by {_isAuthorizedGateway} (implemented in {CrosschainLinked}). No need to check here.

        // split payload
        (bytes memory from, bytes memory toEvm, uint256[] memory ids, uint256[] memory values) = abi.decode(
            payload,
            (bytes, bytes, uint256[], uint256[])
        );
        address to = address(bytes20(toEvm));

        _onReceive(to, ids, values);

        emit CrosschainMultiTokenTransferReceived(receiveId, from, to, ids, values);
    }

    /// @dev Virtual function: implementation is required to handle token being burnt or locked on the source chain.
    function _onSend(address from, uint256[] memory ids, uint256[] memory values) internal virtual;

    /// @dev Virtual function: implementation is required to handle token being minted or unlocked on the destination chain.
    function _onReceive(address to, uint256[] memory ids, uint256[] memory values) internal virtual;
}
