// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {IERC7786GatewaySource, IERC7786Recipient} from "../../interfaces/draft-IERC7786.sol";
import {InteroperableAddress} from "../../utils/draft-InteroperableAddress.sol";

abstract contract ERC7786GatewayMock is IERC7786GatewaySource {
    using InteroperableAddress for bytes;

    error InvalidDestination();
    error ReceiverError();

    uint256 private _lastReceiveId;

    /// @inheritdoc IERC7786GatewaySource
    function supportsAttribute(bytes4 /*selector*/) public view virtual returns (bool) {
        return false;
    }

    /// @inheritdoc IERC7786GatewaySource
    function sendMessage(
        bytes calldata recipient,
        bytes calldata payload,
        bytes[] calldata attributes
    ) public payable virtual returns (bytes32 sendId) {
        // attributes are not supported
        if (attributes.length > 0) {
            revert UnsupportedAttribute(bytes4(attributes[0]));
        }

        // parse recipient
        (bool success, uint256 chainid, address target) = recipient.tryParseEvmV1Calldata();
        require(success && chainid == block.chainid, InvalidDestination());

        // perform call
        bytes4 magic = IERC7786Recipient(target).receiveMessage{value: msg.value}(
            bytes32(++_lastReceiveId),
            InteroperableAddress.formatEvmV1(block.chainid, msg.sender),
            payload
        );
        require(magic == IERC7786Recipient.receiveMessage.selector, ReceiverError());

        // emit standard event
        emit MessageSent(
            bytes32(0),
            InteroperableAddress.formatEvmV1(block.chainid, msg.sender),
            recipient,
            payload,
            msg.value,
            attributes
        );

        return 0;
    }
}
