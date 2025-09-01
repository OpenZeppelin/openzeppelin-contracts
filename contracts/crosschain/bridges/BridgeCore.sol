// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC7786GatewaySource, IERC7786Recipient} from "../../interfaces/draft-IERC7786.sol";
import {InteroperableAddress} from "../../utils/draft-InteroperableAddress.sol";
import {BitMaps} from "../../utils/structs/BitMaps.sol";
import {Bytes} from "../../utils/Bytes.sol";

/**
 * @dev Core bridging mechanism.
 *
 * This contract contains the logic to register and send messages to counterparts on remote chains using ERC-7786
 * gateways. It ensure received message originate from for a counterpart. This is the code of token bridges such as
 * {BridgeERC20}.
 *
 * Contract that inherit from this contract can use the internal {_senMessage} to send messages to their conterpart
 * on a foreign chain. They must implement the {_processMessage} to handle the message that have been verified.
 */
abstract contract BridgeCore is IERC7786Recipient {
    using BitMaps for BitMaps.BitMap;
    using Bytes for bytes;
    using InteroperableAddress for bytes;

    struct Link {
        address gateway;
        bytes remote;
    }
    mapping(bytes chain => Link) private _links;
    mapping(address gateway => BitMaps.BitMap) private _received;

    event RemoteRegistered(address gateway, bytes remote);

    error InvalidGatewayForChain(address gateway, bytes chain);
    error InvalidRemoteForChain(bytes remote, bytes chain);
    error RemoteAlreadyRegistered(bytes chain);
    error MessageAlreadyProcessed(address gateway, bytes32 receiveId);

    constructor(Link[] memory links) {
        for (uint256 i = 0; i < links.length; ++i) {
            _setLink(links[0].gateway, links[0].remote, false);
        }
    }

    /// @dev Returns the ERC-7786 gateway used for sending and receiving cross-chain messages to a given chain
    function link(bytes memory chain) public view virtual returns (address gateway, bytes memory remote) {
        Link storage self = _links[chain];
        return (self.gateway, self.remote);
    }

    /// @dev Internal setter to change the ERC-7786 gateway and remote for a given chain. Called at construction.
    function _setLink(address gateway, bytes memory remote, bool allowOverride) internal virtual {
        // Sanity check, this should revert if gateway is not an ERC-7786 implementation. Note that since
        // supportsAttribute returns data, an EOA would fail that test (nothing returned).
        IERC7786GatewaySource(gateway).supportsAttribute(bytes4(0));

        bytes memory chain = _extractChain(remote);
        if (allowOverride || _links[chain].gateway == address(0)) {
            _links[chain] = Link(gateway, remote);
            emit RemoteRegistered(gateway, remote);
        } else {
            revert RemoteAlreadyRegistered(chain);
        }
    }

    /// @dev Internal messaging function.
    function _sendMessage(
        bytes memory chain,
        bytes memory payload,
        bytes[] memory attributes
    ) internal virtual returns (bytes32) {
        (address gateway, bytes memory remote) = link(chain);
        return IERC7786GatewaySource(gateway).sendMessage(remote, payload, attributes);
    }

    /// @inheritdoc IERC7786Recipient
    function receiveMessage(
        bytes32 receiveId,
        bytes calldata sender,
        bytes calldata payload
    ) public payable virtual returns (bytes4) {
        bytes memory chain = _extractChain(sender);
        (address gateway, bytes memory router) = link(chain);

        // Security restriction:
        // - sender must be the remote for that chain
        // - message was not processed yet
        require(msg.sender == gateway, InvalidGatewayForChain(msg.sender, chain));
        require(sender.equal(router), InvalidRemoteForChain(sender, chain));
        require(!_received[msg.sender].get(uint256(receiveId)), MessageAlreadyProcessed(msg.sender, receiveId));
        _received[msg.sender].set(uint256(receiveId));

        _processMessage(receiveId, payload);

        return IERC7786Recipient.receiveMessage.selector;
    }

    /**
     * @dev Virtual function that should contain the logic to execute when a cross-chain message is received.
     *
     * Replay protection is already enabled in {receiveMessage}.
     */
    function _processMessage(bytes32 receiveId, bytes calldata payload) internal virtual;

    function _extractChain(bytes memory self) private pure returns (bytes memory) {
        (bytes2 chainType, bytes memory chainReference, ) = self.parseV1();
        return InteroperableAddress.formatV1(chainType, chainReference, hex"");
    }
}
