// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ERC7786Receiver} from "../../crosschain/draft-ERC7786Receiver.sol";

contract ERC7786ReceiverMock is ERC7786Receiver {
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
