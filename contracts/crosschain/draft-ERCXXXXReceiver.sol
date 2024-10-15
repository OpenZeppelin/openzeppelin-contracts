// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERCXXXXGatewayDestinationPassive, IERCXXXXReceiver} from "../interfaces/draft-IERCXXXX.sol";

abstract contract ERCXXXXReceiver is IERCXXXXReceiver {
    error ERCXXXXReceiverInvalidGateway(address gateway);

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

    function _isKnownGateway(address instance) internal view virtual returns (bool);

    function _processMessage(
        address gateway,
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) internal virtual;
}
