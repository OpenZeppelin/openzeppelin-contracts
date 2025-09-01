// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC7786GatewaySource, IERC7786Recipient} from "../interfaces/draft-IERC7786.sol";
import {InteroperableAddress} from "../utils/draft-InteroperableAddress.sol";
import {Hashes} from "../utils/cryptography/Hashes.sol";
import {Bytes} from "../utils/Bytes.sol";

contract ERC7786Router is IERC7786GatewaySource, IERC7786Recipient {
    using Bytes for bytes;
    using InteroperableAddress for bytes;

    struct Link {
        address gateway;
        bytes router;
    }
    mapping(bytes chain => Link) private _links;

    event RemoteRegistered(address gateway, bytes remote);

    error InvalidGatewayForChain(address gateway, bytes chain);
    error InvalidRemoteForChain(bytes remote, bytes chain);
    error RemoteAlreadyRegistered(bytes chain);

    constructor(Link[] memory links) {
        for (uint256 i = 0; i < links.length; ++i) {
            _setLink(links[0].gateway, links[0].router, false);
        }
    }

    /// @dev Returns the ERC-7786 gateway used for sending and receiving cross-chain messages to a given chain
    function link(bytes memory chain) public view virtual returns (address, bytes memory) {
        Link storage self = _links[chain];
        return (self.gateway, self.router);
    }

    /// @dev Internal setter to change the ERC-7786 gateway and remote for a given chain. Called at construction.
    function _setLink(address gateway, bytes memory router, bool allowOverride) internal virtual {
        // Sanity check, this should revert if gateway is not an ERC-7786 implementation. Note that since
        // supportsAttribute returns data, an EOA would fail that test (nothing returned).
        IERC7786GatewaySource(gateway).supportsAttribute(bytes4(0));

        (bytes memory chain, ) = _extractChain(router);
        if (allowOverride || _links[chain].gateway == address(0)) {
            _links[chain] = Link(gateway, router);
            emit RemoteRegistered(gateway, router);
        } else {
            revert RemoteAlreadyRegistered(chain);
        }
    }

    /// @inheritdoc IERC7786GatewaySource
    function supportsAttribute(bytes4 /*selector*/) public view virtual override returns (bool) {
        return false;
    }

    /// @inheritdoc IERC7786GatewaySource
    function sendMessage(
        bytes calldata recipient,
        bytes calldata payload,
        bytes[] calldata attributes
    ) public payable virtual override returns (bytes32 sendId) {
        (bytes memory chain, bytes memory addr) = _extractChain(recipient);
        (address gateway, bytes memory router) = link(chain);

        bytes memory wrappedPayload = abi.encode(
            addr,
            InteroperableAddress.formatEvmV1(block.chainid, msg.sender),
            payload
        );

        return IERC7786GatewaySource(gateway).sendMessage{value: msg.value}(router, wrappedPayload, attributes);
    }

    /// @inheritdoc IERC7786Recipient
    function receiveMessage(
        bytes32 receiveId,
        bytes calldata sender,
        bytes calldata payload
    ) public payable virtual override returns (bytes4) {
        (bytes memory chain, ) = _extractChain(sender);
        (address gateway, bytes memory router) = link(chain);

        require(msg.sender == gateway, InvalidGatewayForChain(msg.sender, chain));
        require(sender.equal(router), InvalidRemoteForChain(sender, chain));

        (bytes memory addr, bytes memory actualSender, bytes memory actualPayload) = abi.decode(
            payload,
            (bytes, bytes, bytes)
        );

        return
            IERC7786Recipient(address(bytes20(addr))).receiveMessage(
                Hashes.efficientKeccak256(bytes32(bytes20(msg.sender)), receiveId),
                actualSender,
                actualPayload
            );
    }

    function _extractChain(bytes memory self) private pure returns (bytes memory, bytes memory) {
        (bytes2 chainType, bytes memory chainReference, bytes memory addr) = self.parseV1();
        return (InteroperableAddress.formatV1(chainType, chainReference, hex""), addr);
    }
}
