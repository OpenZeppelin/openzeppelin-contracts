// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../interfaces/IERC1271.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";
import {MessageHashUtils} from "../utils/cryptography/MessageHashUtils.sol";
import {EIP712NestedUtils} from "../utils/cryptography/EIP712NestedUtils.sol";
import {ShortStrings} from "../utils/ShortStrings.sol";

/**
 * @dev Validates signatures according to the {IERC1271} interface and wraps the message hash in an {EIP712} domain separator.
 *
 * Linking the signature to the EIP-712 domain separator is a security measure to prevent signature replay across different
 * EIP-712 domains (e.g. a single offchain owner of multiple contracts).
 *
 * This contract requires implementing the {_validateSignature} function, which passes the wrapped message hash.
 */
abstract contract ERC1271TypedSigner is EIP712, IERC1271 {
    /**
     * @dev Initializes the domain separator and parameter caches. See {EIP712-constructor}.
     *
     * NOTE: {EIP712} uses {ShortStrings} to optimize gas costs for short strings (up to 31 characters).
     * Consider that strings longer than that will use storage, which may limit the ability of the signer to
     * be used within the ERC-4337 validation phase (due to ERC-7562 storage access rules).
     */
    constructor(string memory name, string memory version) EIP712(name, version) {}

    /*
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

    /// @dev Internal version of {isValidSignature} that returns a boolean.
    function _isValidSignature(bytes32 hash, bytes calldata signature) internal view virtual returns (bool) {
        return _isValidNestedSignature(hash, signature) || _isValidPersonalSignature(hash, signature);
    }

    /**
     * @dev Nested EIP-712 typed data verification. See {EIP712NestedUtils-parseNestedSignature} for the signature format.
     *
     * To request a nested signatures, develoepers may leverage the {MessageHashUtils-toTypedDataHash} utility function to
     * hash the nested EIP-712 typed data using the current {eip712Domain}:
     *
     * ```solidity
     * bytes32 hash = MessageHashUtils.toTypedDataHash(
     *  APP_DOMAIN_SEPARATOR,
     *  keccak256(
     *       abi.encode(
     *          typedDataSignHash, contents, // Nested EIP-712 typed data
     *          name, version, chainId, verifyingContract, salt, extensions // Current EIP-712 domain
     *      )
     *  ));
     * ```
     */
    function _isValidNestedSignature(bytes32 hash, bytes calldata signature) internal view virtual returns (bool) {
        (
            bytes calldata originalSignature,
            bytes32 appSeparator,
            bytes32 contents,
            bytes calldata contentsType
        ) = EIP712NestedUtils.parseNestedSignature(signature);

        bytes32 typedDataHash = MessageHashUtils.toTypedDataHash(
            appSeparator,
            _nestedStructHash(EIP712NestedUtils.TYPED_DATA_TYPEHASH(contentsType), contents)
        );

        if (typedDataHash != hash) return false;

        return _validateSignature(hash, originalSignature);
    }

    /**
     * @dev Personal signature verification.
     *
     * This method is an envelope that represents `eth_personalSign` RPC method in the context of smart contracts.
     * To request a signature from a user, developers may leverage the {MessageHashUtils-toTypedDataHash} utility function
     * to nest the content hash in an EIP-712 typed data `PersonalSign(bytes prefixed)` type:
     *
     * ```solidity
     * bytes32 hash = MessageHashUtils.toTypedDataHash(
     *     CURRENT_DOMAIN_SEPARATOR,
     *     keccak256(abi.encode("PersonalSign(bytes prefixed)"),\x19Ethereum Signed Message:\n32,contents)
     * );
     * ```
     */
    function _isValidPersonalSignature(bytes32 hash, bytes calldata signature) internal view returns (bool) {
        bytes32 signPersonalStructHash = keccak256(
            abi.encode(EIP712NestedUtils._PERSONAL_SIGN_TYPEHASH, MessageHashUtils.toEthSignedMessageHash(hash))
        );
        bytes32 hashTypedData = _hashTypedDataV4(signPersonalStructHash);
        return _validateSignature(hashTypedData, signature);
    }

    /// @dev Builds the EIP-712 nested type hash on the fly as it depends on the application's domain.
    function _nestedStructHash(bytes32 typedDataSignHash, bytes32 contents) private view returns (bytes32) {
        (
            ,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        ) = eip712Domain();
        return
            keccak256(
                abi.encode(typedDataSignHash, contents, name, version, chainId, verifyingContract, salt, extensions)
            );
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
