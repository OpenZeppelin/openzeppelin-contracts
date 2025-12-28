// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {InteroperableAddress} from "../../utils/draft-InteroperableAddress.sol";
import {ERC7786Recipient} from "../ERC7786Recipient.sol";
import {CrosschainLinked} from "../CrosschainLinked.sol";

/**
 * @dev Base contract for bridging ERC-721 between chains using an ERC-7786 gateway.
 *
 * In order to use this contract, two functions must be implemented to link it to the token:
 * * {_onSend}: called when a crosschain transfer is going out. Must take the sender tokens or revert.
 * * {_onReceive}: called when a crosschain transfer is coming in. Must give tokens to the receiver.
 *
 * This base contract is used by the {BridgeERC721}, which interfaces with legacy ERC-721 tokens. It is also used by
 * the {ERC721Crosschain}extension, which embeds the bridge logic directly in the token contract.
 */
abstract contract BridgeERC721Core is CrosschainLinked {
    using InteroperableAddress for bytes;

    event CrosschainERC721TransferSent(bytes32 indexed sendId, address indexed from, bytes to, uint256 tokenId);
    event CrosschainERC721TransferReceived(bytes32 indexed receiveId, bytes from, address indexed to, uint256 tokenId);

    /**
     * @dev Internal crosschain transfer function.
     *
     * Note: The `to` parameter is the full InteroperableAddress (chain ref + address).
     */
    function _crosschainTransfer(address from, bytes memory to, uint256 tokenId) internal virtual returns (bytes32) {
        _onSend(from, tokenId);

        (bytes2 chainType, bytes memory chainReference, bytes memory addr) = to.parseV1();
        bytes memory chain = InteroperableAddress.formatV1(chainType, chainReference, hex"");

        bytes32 sendId = _sendMessageToCounterpart(
            chain,
            abi.encode(InteroperableAddress.formatEvmV1(block.chainid, from), addr, tokenId),
            new bytes[](0)
        );

        emit CrosschainERC721TransferSent(sendId, from, to, tokenId);

        return sendId;
    }

    /// @inheritdoc ERC7786Recipient
    function _processMessage(
        address /*gateway*/,
        bytes32 receiveId,
        bytes calldata /*sender*/,
        bytes calldata payload
    ) internal virtual override {
        // split payload
        (bytes memory from, bytes memory toBinary, uint256 tokenId) = abi.decode(payload, (bytes, bytes, uint256));
        address to = address(bytes20(toBinary));

        _onReceive(to, tokenId);

        emit CrosschainERC721TransferReceived(receiveId, from, to, tokenId);
    }

    /// @dev Virtual function: implementation is required to handle token being burnt or locked on the source chain.
    function _onSend(address from, uint256 tokenId) internal virtual;

    /// @dev Virtual function: implementation is required to handle token being minted or unlocked on the destination chain.
    function _onReceive(address to, uint256 tokenId) internal virtual;
}
