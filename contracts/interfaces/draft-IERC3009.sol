// SPDX-License-Identifier: MIT

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-3009 standard as defined in https://eips.ethereum.org/EIPS/eip-3009[ERC-3009].
 */
interface IERC3009 {
    /// @dev Emitted when an authorization is used.
    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);

    /**
     * @dev Returns the state of an authorization.
     *
     * Nonces are randomly generated 32-byte values unique to the authorizer's address.
     */
    function authorizationState(address authorizer, bytes32 nonce) external view returns (bool);

    /**
     * @dev Executes a transfer with a signed authorization.
     *
     * Requirements:
     *
     * * `validAfter` must be less than the current block timestamp.
     * * `validBefore` must be greater than the current block timestamp.
     * * `nonce` must not have been used by the `from` account.
     * * the signature must be valid for the authorization.
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Receives a transfer with a signed authorization from the payer.
     *
     * Includes an additional check to ensure that the payee's address (`to`) matches the caller
     * to prevent front-running attacks.
     *
     * Requirements:
     *
     * * `to` must be the caller of this function.
     * * `validAfter` must be less than the current block timestamp.
     * * `validBefore` must be greater than the current block timestamp.
     * * `nonce` must not have been used by the `from` account.
     * * the signature must be valid for the authorization.
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

/**
 * @dev Extension of {IERC3009} that adds the ability to cancel authorizations.
 */
interface IERC3009Cancel {
    /// @dev Emitted when an authorization is canceled.
    event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);

    /**
     * @dev Cancels an authorization.
     *
     * Requirements:
     *
     * * `nonce` must not have been used by the `authorizer` account.
     * * the signature must be valid for the cancellation.
     */
    function cancelAuthorization(address authorizer, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external;
}
