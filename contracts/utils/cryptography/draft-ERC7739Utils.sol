// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC5267} from "../../interfaces/IERC5267.sol";
import {MessageHashUtils} from "./MessageHashUtils.sol";

/**
 * @dev Utilities to process https://ercs.ethereum.org/ERCS/erc-7739[ERC-7739] typed data signatures
 * that are specific to an {EIP712} domain.
 *
 * This library provides methods to wrap, unwrap and operate over typed data signatures with a defensive
 * rehashing mechanism that includes the application's {EIP712-_domainSeparatorV4} and preserves
 * readability of the signed content using an EIP-712 nested approach.
 *
 * A smart contract domain can validate a signature for a typed data structure in two ways:
 *
 * - As an application validating a typed data signature. See {toNestedTypedDataHash}.
 * - As a smart contract validating a raw message signature. See {toNestedPersonalSignHash}.
 *
 * NOTE: A provider for a smart contract wallet would need to return this signature as the
 * result of a call to `personal_sign` or `eth_signTypedData`, and this may be unsupported by
 * API clients that expect a return value of 129 bytes, or specifically the `r,s,v` parameters
 * of an {ECDSA} signature, as is for example specified for {EIP712}.
 */
library ERC7739Utils {
    /**
     * @dev An EIP-712 typed to represent "personal" signatures
     * (i.e. mimic of `eth_personalSign` for smart contracts).
     */
    bytes32 private constant PERSONAL_SIGN_TYPEHASH = keccak256("PersonalSign(bytes prefixed)");

    /**
     * @dev Error when the contents type is invalid. See {tryValidateContentsType}.
     */
    error InvalidContentsType();

    /**
     * @dev Nests a `contents` digest into an {EIP712} type that simulates the `eth_personalSign` RPC
     * method in the context of smart contracts.
     *
     * This typed uses the {PERSONAL_SIGN_TYPEHASH} type to nest the `contents` hash for the
     * current domain `separator`.
     *
     * To produce a signature for this nested type, the signer must sign the following type hash:
     *
     * ```solidity
     * bytes32 hash = keccak256(abi.encodePacked(
     *      \x19\x01,
     *      CURRENT_DOMAIN_SEPARATOR,
     *      keccak256(
     *          abi.encode(
     *              keccak256("PersonalSign(bytes prefixed)"),
     *              keccak256(abi.encode("\x19Ethereum Signed Message:\n32",contents))
     *          )
     *      )
     * ));
     * ```
     */
    function personalSignStructhash(bytes32 contents) internal pure returns (bytes32) {
        return keccak256(abi.encode(PERSONAL_SIGN_TYPEHASH, contents));
    }

    /**
     * @dev Computes the hash of the nested struct for the given contents.
     *
     * NOTE: This function does not validate the contents type. See {tryValidateContentsType}.
     */
    function typedDataSignStructHash(
        string calldata contentsType,
        bytes32 contents,
        bytes1 fields,
        string memory name,
        string memory version,
        address verifyingContract,
        bytes32 salt,
        uint256[] memory extensions
    ) internal view returns (bytes32 result) {
        (bool valid, string calldata contentsTypeName) = tryValidateContentsType(contentsType);

        if (valid) {
            bytes32 typehash = typedDataSignTypehash(contentsType, contentsTypeName);
            bytes32 extensionsHash = keccak256(abi.encodePacked(extensions));

            assembly ("memory-safe") {
                let ptr := mload(0x40)
                mstore(ptr, typehash)
                mstore(add(ptr, 0x020), contents)
                mstore(add(ptr, 0x040), fields)
                mstore(add(ptr, 0x060), keccak256(add(name, 0x20), mload(name)))
                mstore(add(ptr, 0x080), keccak256(add(version, 0x20), mload(version)))
                mstore(add(ptr, 0x0a0), chainid())
                mstore(add(ptr, 0x0c0), verifyingContract)
                mstore(add(ptr, 0x0e0), salt)
                mstore(add(ptr, 0x100), extensionsHash)
                result := keccak256(ptr, 0x120)
            }
        } else {
            result = bytes32(0);
        }
    }

    /**
     * @dev Nest a signature for a given EIP-712 type into a nested signature for the domain `separator`.
     *
     * Counterpart of {decodeTypedDataSig} to extract the original signature and the nested components.
     */
    function encodeTypedDataSig(
        bytes memory signature,
        bytes32 separator,
        bytes32 contents,
        string memory contentsType
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(signature, separator, contents, contentsType, uint16(bytes(contentsType).length));
    }

    /**
     * @dev Parses a nested signature into its components.
     *
     * Constructed as follows:
     *
     * `signature ‖ DOMAIN_SEPARATOR ‖ contents ‖ contentsType ‖ uint16(contentsType.length)`
     *
     * - `signature` is the original signature for the nested struct hash that includes the `contents` hash
     * - `DOMAIN_SEPARATOR` is the EIP-712 {EIP712-_domainSeparatorV4} of the smart contract verifying the signature
     * - `contents` is the hash of the underlying data structure or message
     * - `contentsType` is the EIP-712 type of the nested signature (e.g. {typedDataSignTypehash} or {PERSONAL_SIGN_TYPEHASH})
     */
    function decodeTypedDataSig(
        bytes calldata encodedSignature
    )
        internal
        pure
        returns (bytes calldata signature, bytes32 separator, bytes32 contents, string calldata contentsType)
    {
        unchecked {
            uint256 sigLength = encodedSignature.length;

            if (sigLength < 66) return (_emptyCalldataBytes(), 0, 0, _emptyCalldataString());

            uint256 contentsTypeEnd = sigLength - 2; // Last 2 bytes
            uint256 contentsTypeLength = uint16(bytes2(encodedSignature[contentsTypeEnd:]));

            if (contentsTypeLength > contentsTypeEnd) return (_emptyCalldataBytes(), 0, 0, _emptyCalldataString());

            uint256 contentsEnd = contentsTypeEnd - contentsTypeLength;

            if (contentsEnd < 64) return (_emptyCalldataBytes(), 0, 0, _emptyCalldataString());

            uint256 separatorEnd = contentsEnd - 32;
            uint256 signatureEnd = separatorEnd - 32;

            signature = encodedSignature[:signatureEnd];
            separator = bytes32(encodedSignature[signatureEnd:separatorEnd]);
            contents = bytes32(encodedSignature[separatorEnd:contentsEnd]);
            contentsType = string(encodedSignature[contentsEnd:contentsTypeEnd]);
        }
    }

    /**
     * @dev Computes the nested EIP-712 type hash for the given contents type.
     *
     * The `contentsTypeName` is the string name in the app's domain before the parentheses
     * (e.g. Transfer in `Transfer(address to,uint256 amount)`).
     *
     * ```solidity
     * TypedDataSign({contentsTypeName},bytes1 fields,string name,string version,uint256 chainId,address verifyingContract,bytes32 salt,uint256[] extensions){contentsType}
     * ```
     *
     * Requirements:
     *  - `contentsType` must be a valid EIP-712 type (see {tryValidateContentsType})
     */
    function typedDataSignTypehash(string calldata contentsType) internal pure returns (bytes32) {
        (bool valid, string calldata contentsTypeName) = tryValidateContentsType(contentsType);
        if (!valid) revert InvalidContentsType();
        return typedDataSignTypehash(contentsType, contentsTypeName);
    }

    /**
     * @dev Same as {typedDataSignTypehash} but with the `contentsTypeName` already validated.
     *
     * See {tryValidateContentsType}.
     */
    function typedDataSignTypehash(
        string calldata contentsType,
        string calldata contentsTypeName
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "TypedDataSign(",
                    contentsTypeName,
                    " contents,bytes1 fields,string name,string version,uint256 chainId,address verifyingContract,bytes32 salt,uint256[] extensions)",
                    contentsType
                )
            );
    }

    /**
     * @dev Try to validate the contents type is a valid EIP-712 type.
     *
     * A valid `contentsType` is considered invalid if it's empty or it:
     *
     * - Starts with a-z or (
     * - Contains any of the following bytes: , )\x00
     */
    function tryValidateContentsType(
        string calldata contentsType
    ) internal pure returns (bool valid, string calldata contentsTypeName) {
        bytes calldata buffer = bytes(contentsType);

        // Check the first character if it exists
        if (buffer.length != 0) {
            bytes1 first = buffer[0];
            if ((first > 0x60 && first < 0x7b) || first == bytes1("(")) {
                return (false, _emptyCalldataString());
            }
        }

        // Loop over the contentsType, looking for the end of the contntsTypeName and validating the input as we go.
        for (uint256 i = 0; i < buffer.length; ++i) {
            bytes1 current = buffer[i];
            if (current == bytes1("(")) {
                // we found the end of the contentsTypeName
                return (true, string(buffer[:i]));
            } else if (current == 0x00 || current == bytes1(" ") || current == bytes1(",") || current == bytes1(")")) {
                // we found an invalid character (forbidden)
                return (false, _emptyCalldataString());
            }
        }
        // We exited the loop without finding of the contentsTypeName
        return (false, _emptyCalldataString());
    }

    function _emptyCalldataBytes() private pure returns (bytes calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    function _emptyCalldataString() private pure returns (string calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }
}
