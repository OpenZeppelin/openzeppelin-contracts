// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC7786GatewaySource, IERC7786Recipient} from "../../interfaces/draft-IERC7786.sol";
import {InteroperableAddress} from "../../utils/draft-InteroperableAddress.sol";
import {BitMaps} from "../../utils/structs/BitMaps.sol";
import {Bytes} from "../../utils/Bytes.sol";

abstract contract BridgeCore is IERC7786Recipient {
    using BitMaps for BitMaps.BitMap;
    using InteroperableAddress for bytes;

    address private _gateway;
    mapping(bytes chain => bytes) private _remotes;
    mapping(address gateway => BitMaps.BitMap) private _received;

    event GatewayChange(address oldGateway, address newGateway);
    event RemoteRegistered(bytes remote);

    error InvalidGateway(address gateway);
    error InvalidSender(bytes sender);
    error MessageAlreadyProcessed(address gateway, bytes32 receiveId);
    error RemoteAlreadyRegistered(bytes remote);

    constructor(address initialGateway, bytes[] memory initialRemotes) {
        _setGateway(initialGateway);
        for (uint256 i = 0; i < initialRemotes.length; ++i) {
            _registerRemote(initialRemotes[i], false);
        }
    }

    /// @dev Returns the ERC-7786 gateway used for sending and receiving cross-chain messages
    function gateway() public view virtual returns (address) {
        return _gateway;
    }

    /// @dev Returns the interoperable address of the corresponding token on a given chain
    function remote(bytes memory chain) public view virtual returns (bytes memory) {
        return _remotes[chain];
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
        bytes memory chain = _extractChain(remoteToken);
        if (allowOverride || _remotes[chain].length == 0) {
            _remotes[chain] = remoteToken;
            emit RemoteRegistered(remoteToken);
        } else {
            revert RemoteAlreadyRegistered(_remotes[chain]);
        }
    }

    /// @dev Internal messaging function.
    function _sendMessage(
        bytes memory chain,
        bytes memory payload,
        bytes[] memory attributes
    ) internal virtual returns (bytes32) {
        return IERC7786GatewaySource(gateway()).sendMessage(remote(chain), payload, attributes);
    }

    /// @inheritdoc IERC7786Recipient
    function receiveMessage(
        bytes32 receiveId,
        bytes calldata sender, // Binary Interoperable Address
        bytes calldata payload
    ) public payable virtual returns (bytes4) {
        // Security restriction:
        // - sender must be the remote for that chain
        // - message was not processed yet
        require(msg.sender == gateway(), InvalidGateway(msg.sender));
        require(Bytes.equal(remote(_extractChain(sender)), sender), InvalidSender(sender));
        require(!_received[msg.sender].get(uint256(receiveId)), MessageAlreadyProcessed(msg.sender, receiveId));
        _received[msg.sender].set(uint256(receiveId));

        _processMessage(receiveId, payload);

        return IERC7786Recipient.receiveMessage.selector;
    }

    /// @dev Virtual function that should contain the logic to execute when a cross-chain message is received.
    function _processMessage(bytes32 receiveId, bytes calldata payload) internal virtual;

    function _extractChain(bytes memory self) private pure returns (bytes memory) {
        (bytes2 chainType, bytes memory chainReference, ) = self.parseV1();
        return InteroperableAddress.formatV1(chainType, chainReference, hex"");
    }
}
