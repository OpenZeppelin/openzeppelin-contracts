// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (crosschain/ERC7786Recipient.sol)

pragma solidity ^0.8.20;

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
 *
 * ERC-7786 requires the gateway to ensure messages are not delivered more than once. Therefore, we don't need to keep
 * track of the processed receiveId.
 *
 * @custom:stateless
 */
abstract contract ERC7786Recipient is IERC7786Recipient {
    /// @dev Error thrown if the gateway is not authorized to send messages to this contract on behalf of the sender.
    error ERC7786RecipientUnauthorizedGateway(address gateway, bytes sender);

    /// @inheritdoc IERC7786Recipient
    function receiveMessage(
        bytes32 receiveId,
        bytes calldata sender, // Binary Interoperable Address
        bytes calldata payload
    ) external payable returns (bytes4) {
        // Check authorization
        if (!_isAuthorizedGateway(msg.sender, sender)) {
            revert ERC7786RecipientUnauthorizedGateway(msg.sender, sender);
        }

        _processMessage(msg.sender, receiveId, sender, payload);

        return IERC7786Recipient.receiveMessage.selector;
    }

    /**
     * @dev Virtual getter that returns whether an address is a valid ERC-7786 gateway for a given sender.
     *
     * The `sender` parameter is an interoperable address that include the source chain. The chain part can be
     * extracted using the {InteroperableAddress} library to selectively authorize gateways based on the origin chain
     * of a message.
     */
    function _isAuthorizedGateway(address gateway, bytes calldata sender) internal view virtual returns (bool);

    /**
     * @dev Virtual function that should contain the logic to execute when a cross-chain message is received.
     *
     * NOTE: This function should revert on failure. Any silent failure from this function will result in the message
     * being marked as received and not being retryable.
     */
    function _processMessage(
        address gateway,
        bytes32 receiveId,
        bytes calldata sender,
        bytes calldata payload
    ) internal virtual;
}
