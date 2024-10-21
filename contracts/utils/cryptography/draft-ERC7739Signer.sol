// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {EIP712} from "./EIP712.sol";
import {MessageHashUtils} from "./MessageHashUtils.sol";
import {ERC7739Utils} from "./draft-ERC7739Utils.sol";
import {ShortStrings} from "../ShortStrings.sol";

/**
 * @dev Validates signatures wrapping the message hash in a nested EIP712 type. See {ERC7739Utils}.
 *
 * Linking the signature to the EIP-712 domain separator is a security measure to prevent signature replay across different
 * EIP-712 domains (e.g. a single offchain owner of multiple contracts).
 *
 * This contract requires implementing the {_validateSignature} function, which passes the wrapped message hash,
 * which may be either an typed data or a personal sign nested type.
 *
 * NOTE: {EIP712} uses {ShortStrings} to optimize gas costs for short strings (up to 31 characters).
 * Consider that strings longer than that will use storage, which may limit the ability of the signer to
 * be used within the ERC-4337 validation phase (due to ERC-7562 storage access rules).
 */
abstract contract ERC7739Signer is EIP712, IERC1271 {
    using ERC7739Utils for *;
    using MessageHashUtils for bytes32;

    /**
     * @dev Attempts validating the signature in a nested EIP-712 type.
     *
     * A nested EIP-712 type might be presented in 2 different ways:
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
            _isValidNestedPersonalSignSignature(hash, signature) || _isValidNestedTypedDataSignature(hash, signature);
    }

    /**
     * @dev Nested personal signature verification.
     */
    function _isValidNestedPersonalSignSignature(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual returns (bool) {
        return _validateSignature(_domainSeparatorV4().toTypedDataHash(hash.personalSignStructHash()), signature);
    }

    /**
     * @dev Nested EIP-712 typed data verification.
     */
    function _isValidNestedTypedDataSignature(
        bytes32 hash,
        bytes calldata encodedSignature
    ) internal view virtual returns (bool) {
        // decode signature
        (
            bytes calldata signature,
            bytes32 appSeparator,
            bytes32 contentsHash,
            string calldata contentsType
        ) = encodedSignature.decodeTypedDataSig();

        // Check that contentHash and separator are correct
        if (hash == appSeparator.toTypedDataHash(contentsHash)) {
            // fetch domain details
            (
                bytes1 fields,
                string memory name,
                string memory version,
                ,
                address verifyingContract,
                bytes32 salt,
                uint256[] memory extensions
            ) = eip712Domain();

            // Rebuild nested hash
            return
                _validateSignature(
                    appSeparator.toTypedDataHash(
                        ERC7739Utils.typedDataSignStructHash(
                            contentsType,
                            contentsHash,
                            fields,
                            name,
                            version,
                            verifyingContract,
                            salt,
                            extensions
                        )
                    ),
                    signature
                );
        } else {
            return false;
        }
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
