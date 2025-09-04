// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {InteroperableAddress} from "../../utils/draft-InteroperableAddress.sol";
import {ERC7786Recipient} from "../ERC7786Recipient.sol";
import {BridgeCore} from "./BridgeCore.sol";

/**
 * @dev Base contract for bridging ERC-20 between chains using an ERC-7786 gateway.
 *
 * In order to use this contract, two function must be implemented to link it to the token:
 * * {lock}: called when a crosschain transfer is going out. Must take the sender tokens or revert.
 * * {unlock}: called when a crosschain transfer is coming it. Must give tokens to the receiver.
 *
 * This base contract is used by the {BridgeERC20Custodial}, which interfaces with legacy ERC-20 tokens, and
 * {BrdigeERC20Bridgeable}, which interface with ERC-7802 to provide an approve-free user experience. It is also used
 * by the {ERC20Crosschain} extension, which embeds the bridge logic directly in the token contract.
 */
abstract contract BridgeERC20 is BridgeCore {
    using InteroperableAddress for bytes;

    event CrossChainTransferSent(bytes32 indexed sendId, address indexed from, bytes to, uint256 amount);
    event CrossChainTransferReceived(bytes32 indexed receiveId, bytes from, address indexed to, uint256 amount);

    /// @dev Transfer `amount` tokens to a crosschain receiver.
    function crosschainTransfer(bytes memory to, uint256 amount) public virtual returns (bytes32) {
        return _crosschainTransfer(msg.sender, to, amount);
    }

    /// @dev Internal crosschain transfer function.
    function _crosschainTransfer(address from, bytes memory to, uint256 amount) internal virtual returns (bytes32) {
        _lock(from, amount);

        (bytes2 chainType, bytes memory chainReference, bytes memory addr) = to.parseV1();
        bytes memory chain = InteroperableAddress.formatV1(chainType, chainReference, hex"");

        bytes32 sendId = _sendMessage(
            chain,
            abi.encode(InteroperableAddress.formatEvmV1(block.chainid, from), addr, amount),
            new bytes[](0)
        );

        emit CrossChainTransferSent(sendId, from, to, amount);

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
        (bytes memory from, bytes memory toBinary, uint256 amount) = abi.decode(payload, (bytes, bytes, uint256));
        address to = address(bytes20(toBinary));

        _unlock(to, amount);

        emit CrossChainTransferReceived(receiveId, from, to, amount);
    }

    /// @dev Virtual function: implementation is required to handle token being burnt or locked on the source chain.
    function _lock(address from, uint256 amount) internal virtual;

    /// @dev Virtual function: implementation is required to handle token being minted or unlocked on the destination chain.
    function _unlock(address to, uint256 amount) internal virtual;
}
