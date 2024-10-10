// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {EIP712} from "./EIP712.sol";
import {MessageHashUtils} from "./MessageHashUtils.sol";
import {ERC7739Utils} from "./draft-ERC7739Utils.sol";
import {ShortStrings} from "../ShortStrings.sol";

/**
 * @dev Validates signatures wrapping the message hash in an EIP712 envelope. See {ERC7739Utils}.
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
abstract contract ERC7739Signer is EIP712, IERC1271 {
    using ERC7739Utils for *;

    /**
     * @dev Attempts validating the signature in an nested EIP-712 envelope.
     *
     * A nested EIP-712 envelope might be presented in 2 different ways:
     *
     * - As a nested EIP-712 typed data
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
            _isValidPersonalSigEnvelopeSignature(hash, signature) ||
            _isValidTypedDataEnvelopeSignature(hash, signature);
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
        return _validateSignature(_personalSigEnvelopeHash(hash), signature);
    }

    /**
     * @dev EIP-712 typed data envelope verification.
     *
     * See {ERC7739Utils-toNestedTypedDataHash} for the envelope structure.
     */
    function _typedDataEnvelopeHash(
        bytes calldata signature
    ) internal view virtual returns (bytes calldata originalSignature, bytes32 result) {
        bytes32 appSeparator;
        bytes32 contents;
        bytes calldata contentsType;
        (originalSignature, appSeparator, contents, contentsType) = signature.unwrapTypedDataSig();

        (
            ,
            string memory name,
            string memory version,
            ,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        ) = eip712Domain();

        result = ERC7739Utils.toNestedTypedDataHash(
            appSeparator,
            ERC7739Utils.typedDataNestedStructHash(
                contentsType,
                contents,
                name,
                version,
                verifyingContract,
                salt,
                extensions
            )
        );
    }

    /**
     * @dev See {ERC7739Utils-toNestedPersonalSignHash}.
     */
    function _personalSigEnvelopeHash(bytes32 hash) internal view virtual returns (bytes32) {
        return _domainSeparatorV4().toNestedPersonalSignHash(hash);
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
