// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (crosschain/bridges/abstract/BridgeNonFungible.sol)

pragma solidity ^0.8.26;

import {InteroperableAddress} from "../../../utils/draft-InteroperableAddress.sol";
import {Context} from "../../../utils/Context.sol";
import {ERC7786Recipient} from "../../ERC7786Recipient.sol";
import {CrosschainLinked} from "../../CrosschainLinked.sol";

/**
 * @dev Base contract for bridging ERC-721 between chains using an ERC-7786 gateway.
 *
 * In order to use this contract, two functions must be implemented to link it to the token:
 * * {_onSend}: called when a crosschain transfer is going out. Must take the sender tokens or revert.
 * * {_onReceive}: called when a crosschain transfer is coming in. Must give tokens to the receiver.
 *
 * This base contract is used by the {BridgeERC721}, which interfaces with legacy ERC-721 tokens. It is also used by
 * the {ERC721Crosschain} extension, which embeds the bridge logic directly in the token contract.
 */
abstract contract BridgeNonFungible is Context, CrosschainLinked {
    /// @dev Emitted when a crosschain ERC-721 transfer is sent.
    event CrosschainNonFungibleTransferSent(bytes32 indexed sendId, address indexed from, bytes to, uint256 tokenId);

    /// @dev Emitted when a crosschain ERC-721 transfer is received.
    event CrosschainNonFungibleTransferReceived(
        bytes32 indexed receiveId,
        bytes from,
        address indexed to,
        uint256 tokenId
    );

    /// @dev Revert reason when the address part of the interoperable address is empty.
    error CrosschainNonFungibleEmptyAddress();

    /// @dev The receiver address is not a valid EVM address (wrong length or zero).
    error CrosschainNonFungibleInvalidAddress();

    /**
     * @dev Internal crosschain transfer function.
     *
     * NOTE: The `to` parameter is the full InteroperableAddress (chain ref + address).
     */
    function _crosschainTransfer(address from, bytes memory to, uint256 tokenId) internal virtual returns (bytes32) {
        (bytes2 chainType, bytes memory chainReference, bytes memory addr) = InteroperableAddress.parseV1(to);
        require(addr.length > 0, CrosschainNonFungibleEmptyAddress());
        // EIP-155 destinations use 20-byte non-zero addresses (see {InteroperableAddress-tryParseEvmV1}).
        // Accepting other lengths (or the zero address) would lock funds once the receive path rejects them.
        if (chainType == bytes2(0x0000)) {
            require(addr.length == 20 && address(bytes20(addr)) != address(0), CrosschainNonFungibleInvalidAddress());
        }

        _onSend(from, tokenId);

        bytes32 sendId = _sendMessageToCounterpart(
            InteroperableAddress.formatV1(chainType, chainReference, hex""),
            abi.encode(InteroperableAddress.formatEvmV1(block.chainid, from), addr, tokenId),
            new bytes[](0)
        );

        emit CrosschainNonFungibleTransferSent(sendId, from, to, tokenId);

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
        (bytes memory from, bytes memory toEvm, uint256 tokenId) = abi.decode(payload, (bytes, bytes, uint256));
        // `toEvm` comes from the ERC-7786 payload; `bytes20(...)` would silently truncate
        // a longer (e.g. non-EVM) address, mis-delivering the assets to a wrong account.
        // The zero address is also rejected: unlocking/minting there is irreversible fund loss.
        require(toEvm.length == 20, CrosschainNonFungibleInvalidAddress());
        address to = address(bytes20(toEvm));
        require(to != address(0), CrosschainNonFungibleInvalidAddress());

        _onReceive(to, tokenId);

        emit CrosschainNonFungibleTransferReceived(receiveId, from, to, tokenId);
    }

    /// @dev Virtual function: implementation is required to handle token being burnt or locked on the source chain.
    function _onSend(address from, uint256 tokenId) internal virtual;

    /// @dev Virtual function: implementation is required to handle token being minted or unlocked on the destination chain.
    function _onReceive(address to, uint256 tokenId) internal virtual;
}
