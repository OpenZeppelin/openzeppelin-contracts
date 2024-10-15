// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERCXXXXGatewayDestinationPassive, IERCXXXXReceiver} from "../interfaces/draft-IERCXXXX.sol";

/**
 * @dev Base implementation of an ERC-XXXX compliant cross-chain message receiver.
 *
 * This abstract contract exposes the `receiveMessage` function that is used in both active and passive mode for
 * communication with (on or multiple) destination gateways. This contract leaves two function unimplemented:
 *
 * * `_isKnownGateway(address)`: an internal getter used to verify weither an address is recognised by the contract as
 *   a valid ERC-XXXX gateway. One or multiple gateway can be supported. Note that any malicious address for which
 *   this function returns true would be able to impersonnate any account on any other chain sending any message.
 * * `_processMessage`: the internal function that will be called with any message that has been validated.
 */
abstract contract ERCXXXXReceiver is IERCXXXXReceiver {
    error ERCXXXXReceiverInvalidGateway(address gateway);

    /// @inheritdoc IERCXXXXReceiver
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
            IERCXXXXGatewayDestinationPassive(gateway).validateReceivedMessage(
                gatewayMessageKey,
                source,
                sender,
                payload,
                attributes
            );
        } else {
            revert ERCXXXXReceiverInvalidGateway(gateway);
        }
        _processMessage(gateway, source, sender, payload, attributes);
    }

    /// @dev Virtual getter that returns weither an address in a valid ERC-XXXX gateway.
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
