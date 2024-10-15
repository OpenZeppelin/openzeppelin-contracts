// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ERCXXXXReceiver} from "../../crosschain/draft-ERCXXXXReceiver.sol";

contract ERCXXXXReceiverMock is ERCXXXXReceiver {
    address private immutable _gateway;

    event MessageReceived(address gateway, string source, string sender, bytes payload, bytes[] attributes);

    constructor(address gateway_) {
        _gateway = gateway_;
    }

    function _isKnownGateway(address instance) internal view virtual override returns (bool) {
        return instance == _gateway;
    }

    function _processMessage(
        address gateway,
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) internal virtual override {
        emit MessageReceived(gateway, source, sender, payload, attributes);
    }
}
