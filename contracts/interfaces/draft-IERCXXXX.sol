// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface for ERC-XXXX source gateways.
 *
 * See ERC-XXXX for more details
 */
interface IERCXXXXGatewaySource {
    /**
     * @dev Event emitted when a message is created. If `outboxId` is zero, no further processing is necessary, and
     * not {MessageSent} event SHOULD be expected. If `outboxId` is not zero, then further (gateway specific, and non
     * standardized) action is required.
     */
    event MessageCreated(
        bytes32 outboxId,
        string sender, // CAIP-10 account ID
        string receiver, // CAIP-10 account ID
        bytes payload,
        bytes[] attributes
    );

    /**
     * @dev This event is emitted when a message, for which the {MessageCreated} event contains an non zero `outboxId`,
     * received the required post processing actions, and was thus sent to the destination chain.
     */
    event MessageSent(bytes32 indexed outboxId);

    /// @dev This error is thrown when a message creation fails because of an unsupported attribute being specified.
    error UnsuportedAttribute(bytes4 selector);

    /// @dev Getter to check weither an attribute is supported.
    function supportsAttribute(bytes4 selector) external view returns (bool);

    /**
     * @dev Endpoint for creating a new message. If the message requires further (gateway specific) processing before
     * it can be sent to the destination chain, then a non-zero `outboxId` must be returned. Otherwize, this the
     * message MUST be sent and this function must return 0.
     *
     * * MUST emit a {MessageCreated} event.
     * * SHOULD NOT emit a {MessageSent} event.
     *
     * If any of the `attributes` is not supported, this function SHOULD revert with an {UnsuportedAttribute} error.
     * Other errors SHOULD revert with errors not specified in ERC-XXXX.
     */
    function sendMessage(
        string calldata destination, // CAIP-2 chain ID
        string calldata receiver, // CAIP-10 account ID
        bytes calldata payload,
        bytes[] calldata attributes
    ) external payable returns (bytes32 outboxId);
}

/**
 * @dev Interface for ERC-XXXX destination gateways operating in passive mode.
 *
 * See ERC-XXXX for more details
 */
interface IERCXXXXGatewayDestinationPassive {
    error InvalidMessageKey(bytes messageKey);

    /**
     * @dev Endpoint for checking the validity of a message that is being relayed in passive mode. The message
     * receiver is implicitelly the caller of this method, which guarantees that no-one but the receiver can
     * "consume" the message. This function MUST implement replay protection, meaning that if called multiple time
     * for same message, all but the first calls MUST revert.
     *
     * NOTE: implementing this interface is OPTIONAL. Some destination gateway MAY only support active mode.
     */
    function validateReceivedMessage(
        bytes calldata messageKey,
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) external;
}

/**
 * @dev Interface for the ERC-XXXX client contracts (receiver).
 *
 * See ERC-XXXX for more details
 */
interface IERCXXXXReceiver {
    /**
     * @dev Endpoint for receiving cross-chain message.
     *
     * This function may be called directly by the gateway (active mode) or by a third party (passive mode).
     */
    function receiveMessage(
        address gateway,
        bytes calldata gatewayMessageKey,
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) external payable;
}
