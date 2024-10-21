// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Utilities to process https://ercs.ethereum.org/ERCS/erc-7739[ERC-7739] typed data signatures
 * that are specific to an EIP-712 domain.
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
     * (i.e. mimic of `personal_sign` for smart contracts).
     */
    bytes32 private constant PERSONAL_SIGN_TYPEHASH = keccak256("PersonalSign(bytes prefixed)");

    /**
     * @dev Error when the contents type is invalid. See {tryValidateContentsType}.
     */
    error InvalidContentsType();

    /**
     * @dev Nest a signature for a given EIP-712 type into a nested signature for the domain of the app.
     *
     * Counterpart of {decodeTypedDataSig} to extract the original signature and the nested components.
     */
    function encodeTypedDataSig(
        bytes memory signature,
        bytes32 appSeparator,
        bytes32 contentsHash,
        string memory contentsType
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(signature, appSeparator, contentsHash, contentsType, uint16(bytes(contentsType).length));
    }

    /**
     * @dev Parses a nested signature into its components.
     *
     * Constructed as follows:
     *
     * `signature ‖ DOMAIN_SEPARATOR ‖ contentsHash ‖ contentsType ‖ uint16(contentsType.length)`
     *
     * - `signature` is the original signature for the nested struct hash that includes the `contents` hash
     * - `DOMAIN_SEPARATOR` is the EIP-712 {EIP712-_domainSeparatorV4} of the smart contract verifying the signature
     * - `contentsHash` is the hash of the underlying data structure or message
     * - `contentsType` is the EIP-712 type of the nested signature (e.g. {typedDataSignTypehash} or {PERSONAL_SIGN_TYPEHASH})
     */
    function decodeTypedDataSig(
        bytes calldata encodedSignature
    )
        internal
        pure
        returns (bytes calldata signature, bytes32 appSeparator, bytes32 contentsHash, string calldata contentsType)
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
            appSeparator = bytes32(encodedSignature[signatureEnd:separatorEnd]);
            contentsHash = bytes32(encodedSignature[separatorEnd:contentsEnd]);
            contentsType = string(encodedSignature[contentsEnd:contentsTypeEnd]);
        }
    }

    /**
     * @dev Nests an `ERC-191` digest into a `PersonalSign` EIP-712 struct, and return the corresponding struct hash.
     * This struct hash must be combined with a domain separator, using {MessageHashUtils-toTypedDataHash} before
     * being verified/recovered.
     *
     * This is used to simulates the `personal_sign` RPC method in the context of smart contracts.
     */
    function personalSignStructHash(bytes32 contents) internal pure returns (bytes32) {
        return keccak256(abi.encode(PERSONAL_SIGN_TYPEHASH, contents));
    }

    /**
     * @dev Nest an `EIP-712` hash (`contents`) into a `TypedDataSign` EIP-712 struct, and return the corresponding
     * struct hash. This struct hash must be combined with a domain separator, using {MessageHashUtils-toTypedDataHash}
     * before being verified/recovered.
     */
    function typedDataSignStructHash(
        string calldata contentsType,
        bytes32 contentsHash,
        bytes1 fields,
        string memory name,
        string memory version,
        address verifyingContract,
        bytes32 salt,
        uint256[] memory extensions
    ) internal view returns (bytes32 result) {
        string calldata contentsTypeName = tryValidateContentsType(contentsType);

        if (bytes(contentsTypeName).length == 0) {
            result = bytes32(0);
        } else {
            bytes32 typehash = typedDataSignTypehash(contentsType, contentsTypeName);
            bytes32 extensionsHash = keccak256(abi.encodePacked(extensions));

            assembly ("memory-safe") {
                let ptr := mload(0x40)
                mstore(ptr, typehash)
                mstore(add(ptr, 0x020), contentsHash)
                mstore(add(ptr, 0x040), fields)
                mstore(add(ptr, 0x060), keccak256(add(name, 0x20), mload(name)))
                mstore(add(ptr, 0x080), keccak256(add(version, 0x20), mload(version)))
                mstore(add(ptr, 0x0a0), chainid())
                mstore(add(ptr, 0x0c0), verifyingContract)
                mstore(add(ptr, 0x0e0), salt)
                mstore(add(ptr, 0x100), extensionsHash)
                result := keccak256(ptr, 0x120)
            }
        }
    }

    /**
     * @dev Compute the EIP-712 typehash of the `TypedDataSign` structure for a given type (and typename).
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
     * @dev Variant of {typedDataSignTypehash-string-string} that automatically parses the contents typename from the
     * contents type definition.
     *
     * Requirements:
     *  - `contentsType` must be a valid EIP-712 type (see {tryValidateContentsType})
     */
    function typedDataSignTypehash(string calldata contentsType) internal pure returns (bytes32) {
        string calldata contentsTypeName = tryValidateContentsType(contentsType);
        if (bytes(contentsTypeName).length == 0) revert InvalidContentsType();
        return typedDataSignTypehash(contentsType, contentsTypeName);
    }

    /**
     * @dev Parse the type name out of the EIP-712 type definition.
     *
     * Following ERC-7739 specifications, a `contentsType` is considered invalid if it's empty or it:
     * - Starts with a-z or (
     * - Contains any of the following bytes: , )\x00
     *
     * If the `contentsType` is invalid, this returns an empty string. Otherwize, the return string has non-zero
     * length.
     */
    function tryValidateContentsType(
        string calldata contentsType
    ) internal pure returns (string calldata contentsTypeName) {
        bytes calldata buffer = bytes(contentsType);

        // Check the first character if it exists
        if (buffer.length != 0) {
            bytes1 first = buffer[0];
            if ((first > 0x60 && first < 0x7b) || first == bytes1("(")) {
                return _emptyCalldataString();
            }
        }

        // Loop over the contentsType, looking for the end of the contntsTypeName and validating the input as we go.
        for (uint256 i = 0; i < buffer.length; ++i) {
            bytes1 current = buffer[i];
            if (current == bytes1("(")) {
                // we found the end of the contentsTypeName
                return string(buffer[:i]);
            } else if (current == 0x00 || current == bytes1(" ") || current == bytes1(",") || current == bytes1(")")) {
                // we found an invalid character (forbidden)
                return _emptyCalldataString();
            }
        }
        // We exited the loop without finding of the contentsTypeName
        return _emptyCalldataString();
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
