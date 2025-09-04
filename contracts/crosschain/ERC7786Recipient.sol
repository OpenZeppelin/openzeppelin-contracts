// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {IERC7786Recipient} from "../interfaces/draft-IERC7786.sol";

/**
 * @dev Base implementation of an ERC-7786 compliant cross-chain message receiver.
 *
 * This abstract contract exposes the `receiveMessage` function that is used for communication with (one or multiple)
 * destination gateways. This contract leaves two functions unimplemented:
 *
 * * {_isAuthorizedGateway}, an internal getter used to verify whether an address is recognised by the contract as a
 * valid ERC-7786 destination gateway. One or multiple gateway can be supported. Note that any malicious address for
 * which this function returns true would be able to impersonate any account on any other chain sending any message.
 *
 * * {_processMessage}, the internal function that will be called with any message that has been validated.
 */
abstract contract ERC7786Recipient is IERC7786Recipient {
    error ERC7786RecipientInvalidGateway(address gateway);

    /// @inheritdoc IERC7786Recipient
    function receiveMessage(
        bytes32 receiveId,
        bytes calldata sender, // Binary Interoperable Address
        bytes calldata payload
    ) external payable returns (bytes4) {
        require(_isAuthorizedGateway(msg.sender, sender), ERC7786RecipientInvalidGateway(msg.sender));
        _processMessage(msg.sender, receiveId, sender, payload);
        return IERC7786Recipient.receiveMessage.selector;
    }

    /// @dev Virtual getter that returns whether an address is a valid ERC-7786 gateway for a given sender.
    function _isAuthorizedGateway(address instance, bytes memory sender) internal view virtual returns (bool);

    /// @dev Virtual function that should contain the logic to execute when a cross-chain message is received.
    function _processMessage(
        address gateway,
        bytes32 receiveId,
        bytes calldata sender,
        bytes calldata payload
    ) internal virtual;
}
