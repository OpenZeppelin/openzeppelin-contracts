// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERCXXXXGatewayDestinationPassive, IERCXXXXReceiver} from "../interfaces/draft-IERCXXXX.sol";

abstract contract ERCXXXXReceiver is IERCXXXXReceiver {
    address private immutable _gateway;

    event MessageReceived(bytes gatewayMessageKey, string source, string sender, bytes payload, bytes[] attributes);
    error ERCXXXXReceiverInvalidGateway(address gateway);

    constructor(address gateway_) {
        _gateway = gateway_;
    }

    function isGateway(address instance) public view virtual returns (bool) {
        return instance == _gateway;
    }

    function receiveMessage(
        address gateway,
        bytes calldata gatewayMessageKey,
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) public payable virtual {
        if (isGateway(msg.sender)) {
            // Active mode
            // no extra check
        } else if (isGateway(gateway)) {
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
        emit MessageReceived(gatewayMessageKey, source, sender, payload, attributes);
        _processMessage(gateway, source, sender, payload, attributes);
    }

    function _processMessage(
        address gateway,
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) internal virtual;
}
