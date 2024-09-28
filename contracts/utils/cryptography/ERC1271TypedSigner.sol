// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {EIP712} from "./EIP712.sol";
import {MessageHashUtils} from "./MessageHashUtils.sol";
import {MessageEnvelopeUtils} from "./MessageEnvelopeUtils.sol";
import {ShortStrings} from "../ShortStrings.sol";

/**
 * @dev Validates signatures wrapping the message hash in an EIP712 envelope. See {MessageEnvelopeUtils}.
 *
 * Linking the signature to the EIP-712 domain separator is a security measure to prevent signature replay across different
 * EIP-712 domains (e.g. a single offchain owner of multiple contracts).
 *
 * This contract requires implementing the {_validateSignature} function, which passes the wrapped message hash,
 * which may be either an typed data or a personal sign envelope.
 *
 * NOTE: {EIP712} uses {ShortStrings} to optimize gas costs for short strings (up to 31 characters).
 * Consider that strings longer than that will use storage, which may limit the ability of the signer to
 * be used within the ERC-4337 validation phase (due to ERC-7562 storage access rules).
 */
abstract contract ERC1271TypedSigner is EIP712, IERC1271 {
    using MessageEnvelopeUtils for *;

    /**
     * @dev Attempts validating the signature in an nested EIP-712 envelope.
     *
     * A nested EIP-712 envelope might be presented in 2 different ways:
     *
     * - As an nested EIP-712 typed data
     * - As a _personal_ signature (an EIP-712 mimic of the `eth_personalSign` for a smart contract)
     */
    function isValidSignature(bytes32 hash, bytes calldata signature) public view virtual returns (bytes4 result) {
        return _isValidSignature(hash, signature) ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }

    /**
     * @dev Internal version of {isValidSignature} that returns a boolean.
     */
    function _isValidSignature(bytes32 hash, bytes calldata signature) internal view virtual returns (bool) {
        return
            _isValidTypedDataEnvelopeSignature(hash, signature) ||
            _isValidPersonalSigEnvelopeSignature(hash, signature);
    }

    /**
     * @dev EIP-712 typed data envelope verification.
     */
    function _isValidTypedDataEnvelopeSignature(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual returns (bool) {
        (bytes calldata originalSignature, bytes32 envelopeHash) = _typedDataEnvelopeHash(signature);
        return hash == envelopeHash && _validateSignature(envelopeHash, originalSignature);
    }

    /**
     * @dev Personal signature envelope verification.
     */
    function _isValidPersonalSigEnvelopeSignature(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual returns (bool) {
        bytes32 envelopeHash = _personalSigEnvelopeHash(hash);
        return _validateSignature(envelopeHash, signature);
    }

    /**
     * @dev EIP-712 typed data envelope verification.
     *
     * See {MessageEnvelopeUtils-toTypedDataEnvelopeHash} for the envelope structure.
     */
    function _typedDataEnvelopeHash(
        bytes calldata signature
    ) internal view virtual returns (bytes calldata originalSignature, bytes32) {
        (bytes calldata sig, bytes32 appSeparator, bytes32 contents, bytes calldata contentsType) = signature
            .unwrapTypedDataEnvelope();

        (
            ,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        ) = eip712Domain();

        return (
            sig,
            MessageEnvelopeUtils.toTypedDataEnvelopeHash(
                appSeparator,
                contents,
                contentsType,
                name,
                version,
                chainId,
                verifyingContract,
                salt,
                extensions
            )
        );
    }

    /**
     * @dev See {MessageEnvelopeUtils-toPersonalSignEnvelopeHash}.
     */
    function _personalSigEnvelopeHash(bytes32 hash) internal view virtual returns (bytes32) {
        return _domainSeparatorV4().toPersonalSignEnvelopeHash(hash);
    }

    /**
     * @dev Signature validation algorithm.
     *
     * WARNING: Implementing a signature validation algorithm is a security-sensitive operation as it involves
     * cryptographic verification. It is important to review and test thoroughly before deployment. Consider
     * using one of the signature verification libraries ({ECDSA}, {P256} or {RSA}).
     */
    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual returns (bool);
}
