// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {ERC7786Recipient} from "../../crosschain/ERC7786Recipient.sol";

contract ERC7786RecipientMock is ERC7786Recipient {
    address private immutable _gateway;

    event MessageReceived(address gateway, bytes32 receiveId, bytes sender, bytes payload, uint256 value);

    constructor(address gateway_) {
        _gateway = gateway_;
    }

    function _isAuthorizedGateway(
        address gateway,
        bytes calldata /*sender*/
    ) internal view virtual override returns (bool) {
        return gateway == _gateway;
    }

    function _processMessage(
        address gateway,
        bytes32 receiveId,
        bytes calldata sender,
        bytes calldata payload
    ) internal virtual override {
        emit MessageReceived(gateway, receiveId, sender, payload, msg.value);
    }
}
