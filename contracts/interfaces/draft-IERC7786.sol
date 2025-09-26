// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4;

/**
 * @dev Interface for ERC-7786 source gateways.
 *
 * See ERC-7786 for more details
 */
interface IERC7786GatewaySource {
    /**
     * @dev Event emitted when a message is created. If `sendId` is zero, no further processing is necessary. If
     * `sendId` is not zero, then further (gateway specific, and non-standardized) action is required.
     */
    event MessageSent(
        bytes32 indexed sendId,
        bytes sender, // Binary Interoperable Address
        bytes recipient, // Binary Interoperable Address
        bytes payload,
        uint256 value,
        bytes[] attributes
    );

    /// @dev This error is thrown when a message creation fails because of an unsupported attribute being specified.
    error UnsupportedAttribute(bytes4 selector);

    /// @dev Getter to check whether an attribute is supported or not.
    function supportsAttribute(bytes4 selector) external view returns (bool);

    /**
     * @dev Endpoint for creating a new message. If the message requires further (gateway specific) processing before
     * it can be sent to the destination chain, then a non-zero `sendId` must be returned. Otherwise, the
     * message MUST be sent and this function must return 0.
     *
     * * MUST emit a {MessageSent} event.
     *
     * If any of the `attributes` is not supported, this function SHOULD revert with an {UnsupportedAttribute} error.
     * Other errors SHOULD revert with errors not specified in ERC-7786.
     */
    function sendMessage(
        bytes calldata recipient, // Binary Interoperable Address
        bytes calldata payload,
        bytes[] calldata attributes
    ) external payable returns (bytes32 sendId);
}

/**
 * @dev Interface for the ERC-7786 client contract (receiver).
 *
 * See ERC-7786 for more details
 */
interface IERC7786Recipient {
    /**
     * @dev Endpoint for receiving cross-chain message.
     *
     * This function may be called directly by the gateway.
     */
    function receiveMessage(
        bytes32 receiveId,
        bytes calldata sender, // Binary Interoperable Address
        bytes calldata payload
    ) external payable returns (bytes4);
}
