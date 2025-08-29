// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC7786Recipient} from "../ERC7786Recipient.sol";
import {IERC7786GatewaySource} from "../../interfaces/draft-IERC7786.sol";
import {InteroperableAddress} from "../../utils/draft-InteroperableAddress.sol";
import {BitMaps} from "../../utils/structs/BitMaps.sol";
import {Bytes} from "../../utils/Bytes.sol";

/**
 * @dev Base contract for bridging ERC-20 between chains using an ERC-7786 gateway.
 *
 * In order to use this contract, two function must be implemented to link it to the token:
 * * {lock}: called when a crosschain transfer is going out. Must take the sender tokens or revert.
 * * {unlock}: called when a crosschain transfer is coming it. Must give tokens to the receiver.
 *
 * This base contract is used by the {CrosschainBridgeERC20Custodial}, which interfaces with legacy ERC-20 tokens.
 * It is also used by the {ERC20Crosschain} extension, which embeds the bridge logic directly in the token contract.
 */
abstract contract CrosschainBridgeERC20 is ERC7786Recipient {
    using BitMaps for BitMaps.BitMap;
    using InteroperableAddress for bytes;

    address private _gateway;
    mapping(bytes chain => bytes) private _remoteTokens;
    mapping(address gateway => BitMaps.BitMap) private _received;

    event GatewayChange(address oldGateway, address newGateway);
    event RemoteTokenRegistered(bytes remote);
    event CrossChainTransferSent(bytes32 indexed sendId, address indexed from, bytes to, uint256 amount);
    event CrossChainTransferReceived(bytes32 indexed receiveId, bytes from, address indexed to, uint256 amount);

    error InvalidGateway();
    error InvalidSender(bytes sender);
    error MessageAlreadyProcessed(address gateway, bytes32 receiveId);
    error RemoteAlreadyRegistered(bytes remote);

    constructor(address initialGateway, bytes[] memory remoteTokens) {
        _setGateway(initialGateway);
        for (uint256 i = 0; i < remoteTokens.length; ++i) {
            _registerRemote(remoteTokens[i], false);
        }
    }

    /// @dev Returns the ERC-7786 gateway used for sending and receiving cross-chain messages
    function gateway() public view virtual returns (address) {
        return _gateway;
    }

    /// @dev Returns the interoperable address of the corresponding token on a given chain
    function remote(bytes memory chain) public view virtual returns (bytes memory) {
        return _remoteTokens[chain];
    }

    /// @dev Internal setter to change the ERC-7786 gateway. Called at construction.
    function _setGateway(address newGateway) internal virtual {
        // Sanity check, this should revert if newGateway is not an ERC-7786 implementation. Note that since
        // supportsAttribute returns data, an EOA would fail that test (nothing returned).
        IERC7786GatewaySource(newGateway).supportsAttribute(bytes4(0));

        address oldGateway = _gateway;
        _gateway = newGateway;

        emit GatewayChange(oldGateway, newGateway);
    }

    /// @dev Internal setter to change the ERC-7786 gateway. Called at construction.
    function _registerRemote(bytes memory remoteToken, bool allowOverride) internal virtual {
        (bytes memory chain, ) = _extractChain(remoteToken);
        if (allowOverride || _remoteTokens[chain].length == 0) {
            _remoteTokens[chain] = remoteToken;
            emit RemoteTokenRegistered(remoteToken);
        } else {
            revert RemoteAlreadyRegistered(_remoteTokens[chain]);
        }
    }

    /**
     * @dev Transfer `amount` tokens to a crosschain receiver.
     *
     * This is a variant of {crosschainTransfer-bytes-uint256-bytes[]} with an empty attribute list.
     *
     * NOTE: This function is not virtual and should not be overriden. Consider overriding
     * {crosschainTransfer-bytes-uint256-bytes[]} instead.
     */
    function crosschainTransfer(bytes memory to, uint256 amount) public returns (bytes32) {
        return crosschainTransfer(to, amount, new bytes[](0));
    }

    /// @dev Transfer `amount` tokens to a crosschain receiver.
    function crosschainTransfer(
        bytes memory to,
        uint256 amount,
        bytes[] memory attributes
    ) public virtual returns (bytes32) {
        return _crosschainTransfer(msg.sender, to, amount, attributes);
    }

    /// @dev Internal crosschain transfer function.
    function _crosschainTransfer(
        address from,
        bytes memory to,
        uint256 amount,
        bytes[] memory attributes
    ) internal virtual returns (bytes32) {
        _lock(from, amount);

        (bytes memory chain, bytes memory addr) = _extractChain(to);
        bytes32 sendId = IERC7786GatewaySource(gateway()).sendMessage(
            remote(chain),
            abi.encode(InteroperableAddress.formatEvmV1(block.chainid, from), addr, amount),
            attributes
        );

        emit CrossChainTransferSent(sendId, from, to, amount);

        return sendId;
    }

    /// @inheritdoc ERC7786Recipient
    function _isKnownGateway(address instance) internal view virtual override returns (bool) {
        return instance == gateway();
    }

    /// @inheritdoc ERC7786Recipient
    function _processMessage(
        address gateway_,
        bytes32 receiveId,
        bytes calldata sender,
        bytes calldata payload
    ) internal virtual override {
        // Check the sender is the remiote for that chain
        (bytes memory chain, ) = _extractChain(sender);
        require(Bytes.equal(remote(chain), sender), InvalidSender(sender));

        // Check the message was not processed yet
        require(!_received[gateway_].get(uint256(receiveId)), MessageAlreadyProcessed(gateway_, receiveId));
        _received[gateway_].set(uint256(receiveId));

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

    function _extractChain(bytes memory self) private pure returns (bytes memory chain, bytes memory addr) {
        bytes2 chainType;
        bytes memory chainReference;

        (chainType, chainReference, addr) = self.parseV1();
        chain = InteroperableAddress.formatV1(chainType, chainReference, hex"");
    }
}
