// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/cryptography/signers/draft-ERC7739.sol)

pragma solidity ^0.8.24;

import {AbstractSigner} from "./AbstractSigner.sol";
import {EIP712} from "../EIP712.sol";
import {ERC7739Utils} from "../draft-ERC7739Utils.sol";
import {IERC1271} from "../../../interfaces/IERC1271.sol";
import {MessageHashUtils} from "../MessageHashUtils.sol";

/**
 * @dev Validates signatures wrapping the message hash in a nested EIP712 type. See {ERC7739Utils}.
 *
 * Linking the signature to the EIP-712 domain separator is a security measure to prevent signature replay across different
 * EIP-712 domains (e.g. a single offchain owner of multiple contracts).
 *
 * This contract requires implementing the {_rawSignatureValidation} function, which passes the wrapped message hash,
 * which may be either an typed data or a personal sign nested type.
 *
 * NOTE: xref:api:utils/cryptography#EIP712[EIP-712] uses xref:api:utils/cryptography#ShortStrings[ShortStrings] to
 * optimize gas costs for short strings (up to 31 characters). Consider that strings longer than that will use storage,
 * which may limit the ability of the signer to be used within the ERC-4337 validation phase (due to
 * https://eips.ethereum.org/EIPS/eip-7562#storage-rules[ERC-7562 storage access rules]).
 */
abstract contract ERC7739 is AbstractSigner, EIP712, IERC1271 {
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
        // For the hash `0x7739773977397739773977397739773977397739773977397739773977397739` and an empty signature,
        // we return the magic value `0x77390001` as it's assumed impossible to find a preimage for it that can be used
        // maliciously. Useful for simulation purposes and to validate whether the contract supports ERC-7739.
        return
            (_isValidNestedTypedDataSignature(hash, signature) || _isValidNestedPersonalSignSignature(hash, signature))
                ? IERC1271.isValidSignature.selector
                : (hash == 0x7739773977397739773977397739773977397739773977397739773977397739 && signature.length == 0)
                    ? bytes4(0x77390001)
                    : bytes4(0xffffffff);
    }

    /**
     * @dev Nested personal signature verification.
     */
    function _isValidNestedPersonalSignSignature(bytes32 hash, bytes calldata signature) private view returns (bool) {
        return _rawSignatureValidation(_domainSeparatorV4().toTypedDataHash(hash.personalSignStructHash()), signature);
    }

    /**
     * @dev Nested EIP-712 typed data verification.
     */
    function _isValidNestedTypedDataSignature(
        bytes32 hash,
        bytes calldata encodedSignature
    ) private view returns (bool) {
        // decode signature
        (
            bytes calldata signature,
            bytes32 appSeparator,
            bytes32 contentsHash,
            string calldata contentsDescr
        ) = encodedSignature.decodeTypedDataSig();

        (
            ,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,

        ) = eip712Domain();

        // Check that contentHash and separator are correct
        // Rebuild nested hash
        return
            hash == appSeparator.toTypedDataHash(contentsHash) &&
            bytes(contentsDescr).length != 0 &&
            _rawSignatureValidation(
                appSeparator.toTypedDataHash(
                    ERC7739Utils.typedDataSignStructHash(
                        contentsDescr,
                        contentsHash,
                        abi.encode(keccak256(bytes(name)), keccak256(bytes(version)), chainId, verifyingContract, salt)
                    )
                ),
                signature
            );
    }
}
