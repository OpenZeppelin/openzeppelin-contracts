// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC7786GatewayDestinationPassive, IERC7786Receiver} from "../interfaces/draft-IERC7786.sol";

/**
 * @dev Base implementation of an ERC-7786 compliant cross-chain message receiver.
 *
 * This abstract contract exposes the `receiveMessage` function that is used in both active and passive mode for
 * communication with (one or multiple) destination gateways. This contract leaves two function unimplemented:
 *
 * {_isKnownGateway}, an internal getter used to verify whether an address is recognised by the contract as a valid
 * ERC-7786 destination gateway. One or multiple gateway can be supported. Note that any malicious address for which
 * this function returns true would be able to impersonate any account on any other chain sending any message.
 *
 * {_processMessage}, the internal function that will be called with any message that has been validated.
 */
abstract contract ERC7786Receiver is IERC7786Receiver {
    error ERC7786ReceiverInvalidGateway(address gateway);

    /// @inheritdoc IERC7786Receiver
    function receiveMessage(
        address gateway,
        bytes calldata gatewayMessageKey,
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) public payable virtual {
        if (_isKnownGateway(msg.sender)) {
            // Active mode
            // no extra check
        } else if (_isKnownGateway(gateway)) {
            // Passive mode
            IERC7786GatewayDestinationPassive(gateway).validateReceivedMessage(
                gatewayMessageKey,
                source,
                sender,
                payload,
                attributes
            );
        } else {
            revert ERC7786ReceiverInvalidGateway(gateway);
        }
        _processMessage(gateway, source, sender, payload, attributes);
    }

    /// @dev Virtual getter that returns weither an address in a valid ERC-7786 gateway.
    function _isKnownGateway(address instance) internal view virtual returns (bool);

    /// @dev Virtual function that should contain the logic to execute when a crosschain message is received.
    function _processMessage(
        address gateway,
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) internal virtual;
}
