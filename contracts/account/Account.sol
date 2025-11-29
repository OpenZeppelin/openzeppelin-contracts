// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (account/Account.sol)

pragma solidity ^0.8.20;

import {PackedUserOperation, IAccount, IEntryPoint} from "../interfaces/draft-IERC4337.sol";
import {ERC4337Utils} from "./utils/draft-ERC4337Utils.sol";
import {AbstractSigner} from "../utils/cryptography/signers/AbstractSigner.sol";
import {LowLevelCall} from "../utils/LowLevelCall.sol";

/**
 * @dev A simple ERC4337 account implementation. This base implementation only includes the minimal logic to process
 * user operations.
 *
 * Developers must implement the {AbstractSigner-_rawSignatureValidation} function to define the account's validation logic.
 *
 * NOTE: This core account doesn't include any mechanism for performing arbitrary external calls. This is an essential
 * feature that all Account should have. We leave it up to the developers to implement the mechanism of their choice.
 * Common choices include ERC-6900, ERC-7579 and ERC-7821 (among others).
 *
 * IMPORTANT: Implementing a mechanism to validate signatures is a security-sensitive operation as it may allow an
 * attacker to bypass the account's security measures. Check out {SignerECDSA}, {SignerP256}, or {SignerRSA} for
 * digital signature validation implementations.
 *
 * @custom:stateless
 */
abstract contract Account is AbstractSigner, IAccount {
    /**
     * @dev Unauthorized call to the account.
     */
    error AccountUnauthorized(address sender);

    /**
     * @dev Revert if the caller is not the entry point or the account itself.
     */
    modifier onlyEntryPointOrSelf() {
        _checkEntryPointOrSelf();
        _;
    }

    /**
     * @dev Revert if the caller is not the entry point.
     */
    modifier onlyEntryPoint() {
        _checkEntryPoint();
        _;
    }

    /**
     * @dev Canonical entry point for the account that forwards and validates user operations.
     */
    function entryPoint() public view virtual returns (IEntryPoint) {
        return ERC4337Utils.ENTRYPOINT_V08;
    }

    /**
     * @dev Return the account nonce for the canonical sequence.
     */
    function getNonce() public view virtual returns (uint256) {
        return getNonce(0);
    }

    /**
     * @dev Return the account nonce for a given sequence (key).
     */
    function getNonce(uint192 key) public view virtual returns (uint256) {
        return entryPoint().getNonce(address(this), key);
    }

    /**
     * @inheritdoc IAccount
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) public virtual onlyEntryPoint returns (uint256) {
        uint256 validationData = _validateUserOp(userOp, userOpHash, userOp.signature);
        _payPrefund(missingAccountFunds);
        return validationData;
    }

    /**
     * @dev Returns the validationData for a given user operation. By default, this checks the signature of the
     * signable hash (produced by {_signableUserOpHash}) using the abstract signer ({AbstractSigner-_rawSignatureValidation}).
     *
     * The `signature` parameter is taken directly from the user operation's `signature` field.
     * This design enables derived contracts to implement custom signature handling logic,
     * such as embedding additional data within the signature and processing it by overriding this function
     * and optionally invoking `super`.
     *
     * NOTE: The userOpHash is assumed to be correct. Calling this function with a userOpHash that does not match the
     * userOp will result in undefined behavior.
     */
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        bytes calldata signature
    ) internal virtual returns (uint256) {
        return
            _rawSignatureValidation(_signableUserOpHash(userOp, userOpHash), signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    /**
     * @dev Virtual function that returns the signable hash for a user operations. Since v0.8.0 of the entrypoint,
     * `userOpHash` is an EIP-712 hash that can be signed directly.
     */
    function _signableUserOpHash(
        PackedUserOperation calldata /*userOp*/,
        bytes32 userOpHash
    ) internal view virtual returns (bytes32) {
        return userOpHash;
    }

    /**
     * @dev Sends the missing funds for executing the user operation to the {entrypoint}.
     * The `missingAccountFunds` must be defined by the entrypoint when calling {validateUserOp}.
     */
    function _payPrefund(uint256 missingAccountFunds) internal virtual {
        if (missingAccountFunds > 0) {
            LowLevelCall.callNoReturn(msg.sender, missingAccountFunds, ""); // The entrypoint should validate the result.
        }
    }

    /**
     * @dev Ensures the caller is the {entrypoint}.
     */
    function _checkEntryPoint() internal view virtual {
        address sender = msg.sender;
        if (sender != address(entryPoint())) {
            revert AccountUnauthorized(sender);
        }
    }

    /**
     * @dev Ensures the caller is the {entrypoint} or the account itself.
     */
    function _checkEntryPointOrSelf() internal view virtual {
        address sender = msg.sender;
        if (sender != address(this) && sender != address(entryPoint())) {
            revert AccountUnauthorized(sender);
        }
    }

    /**
     * @dev Receive Ether.
     */
    receive() external payable virtual {}
}
