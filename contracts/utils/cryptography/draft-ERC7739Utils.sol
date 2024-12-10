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
     * @dev An EIP-712 type to represent "personal" signatures
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
        string memory contentsDescr
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(signature, appSeparator, contentsHash, contentsDescr, uint16(bytes(contentsDescr).length));
    }

    /**
     * @dev Parses a nested signature into its components.
     *
     * Constructed as follows:
     *
     * `signature ‖ DOMAIN_SEPARATOR ‖ contentsHash ‖ contentsDescr ‖ uint16(contentsDescr.length)`
     *
     * - `signature` is the original signature for the nested struct hash that includes the "contents" hash
     * - `DOMAIN_SEPARATOR` is the EIP-712 {EIP712-_domainSeparatorV4} of the smart contract verifying the signature
     * - `contentsHash` is the hash of the underlying data structure or message
     * - `contentsDescr` is a descriptor of the "contents" part of the the EIP-712 type of the nested signature
     */
    function decodeTypedDataSig(
        bytes calldata encodedSignature
    )
        internal
        pure
        returns (bytes calldata signature, bytes32 appSeparator, bytes32 contentsHash, string calldata contentsDescr)
    {
        unchecked {
            uint256 sigLength = encodedSignature.length;

            if (sigLength < 4) return (_emptyCalldataBytes(), 0, 0, _emptyCalldataString());

            uint256 contentsDescrEnd = sigLength - 2; // Last 2 bytes
            uint256 contentsDescrLength = uint16(bytes2(encodedSignature[contentsDescrEnd:]));

            if (contentsDescrLength + 64 > contentsDescrEnd)
                return (_emptyCalldataBytes(), 0, 0, _emptyCalldataString());

            uint256 contentsHashEnd = contentsDescrEnd - contentsDescrLength;
            uint256 separatorEnd = contentsHashEnd - 32;
            uint256 signatureEnd = separatorEnd - 32;

            signature = encodedSignature[:signatureEnd];
            appSeparator = bytes32(encodedSignature[signatureEnd:separatorEnd]);
            contentsHash = bytes32(encodedSignature[separatorEnd:contentsHashEnd]);
            contentsDescr = string(encodedSignature[contentsHashEnd:contentsDescrEnd]);
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
     * @dev Nests an `EIP-712` hash (`contents`) into a `TypedDataSign` EIP-712 struct, and return the corresponding
     * struct hash. This struct hash must be combined with a domain separator, using {MessageHashUtils-toTypedDataHash}
     * before being verified/recovered.
     */
    function typedDataSignStructHash(
        string calldata contentsTypeName,
        string calldata contentsType,
        bytes32 contentsHash,
        bytes memory domainBytes
    ) internal pure returns (bytes32 result) {
        return
            bytes(contentsTypeName).length == 0
                ? bytes32(0)
                : keccak256(
                    abi.encodePacked(typedDataSignTypehash(contentsTypeName, contentsType), contentsHash, domainBytes)
                );
    }

    /**
     * @dev Variant of {typedDataSignStructHash-string-string-bytes32-string-bytes} that takes a content descriptor
     * and decodes the `contentsTypeName` and `contentsType` out of it.
     */
    function typedDataSignStructHash(
        string calldata contentsDescr,
        bytes32 contentsHash,
        bytes memory domainBytes
    ) internal pure returns (bytes32 result) {
        (string calldata contentsTypeName, string calldata contentsType) = decodeContentsDescr(contentsDescr);

        return typedDataSignStructHash(contentsTypeName, contentsType, contentsHash, domainBytes);
    }

    /**
     * @dev Compute the EIP-712 typehash of the `TypedDataSign` structure for a given type (and typename).
     */
    function typedDataSignTypehash(
        string calldata contentsTypeName,
        string calldata contentsType
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "TypedDataSign(",
                    contentsTypeName,
                    " contents,string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)",
                    contentsType
                )
            );
    }

    /**
     * @dev Parse the type name out of the ERC-7739 contents type description. Supports both the implicit and explicit
     * modes.
     *
     * Following ERC-7739 specifications, a `contentsTypeName` is considered invalid if it's empty or it contains
     * any of the following bytes , )\x00
     *
     * If the `contentsType` is invalid, this returns an empty string. Otherwise, the return string has non-zero
     * length.
     */
    function decodeContentsDescr(
        string calldata contentsDescr
    ) internal pure returns (string calldata contentsTypeName, string calldata contentsType) {
        bytes calldata buffer = bytes(contentsDescr);
        if (buffer.length == 0) {
            // pass through (fail)
        } else if (buffer[buffer.length - 1] == bytes1(")")) {
            // Implicit mode: read contentsTypeName for the beginning, and keep the complete descr
            for (uint256 i = 0; i < buffer.length; ++i) {
                bytes1 current = buffer[i];
                if (current == bytes1("(")) {
                    // if name is empty - passthrough (fail)
                    if (i == 0) break;
                    // we found the end of the contentsTypeName
                    return (string(buffer[:i]), contentsDescr);
                } else if (_isForbiddenChar(current)) {
                    // we found an invalid character (forbidden) - passthrough (fail)
                    break;
                }
            }
        } else {
            // Explicit mode: read contentsTypeName for the end, and remove it from the descr
            for (uint256 i = buffer.length; i > 0; --i) {
                bytes1 current = buffer[i - 1];
                if (current == bytes1(")")) {
                    // we found the end of the contentsTypeName
                    return (string(buffer[i:]), string(buffer[:i]));
                } else if (_isForbiddenChar(current)) {
                    // we found an invalid character (forbidden) - passthrough (fail)
                    break;
                }
            }
        }
        return (_emptyCalldataString(), _emptyCalldataString());
    }

    // slither-disable-next-line write-after-write
    function _emptyCalldataBytes() private pure returns (bytes calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    // slither-disable-next-line write-after-write
    function _emptyCalldataString() private pure returns (string calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    function _isForbiddenChar(bytes1 char) private pure returns (bool) {
        return char == 0x00 || char == bytes1(" ") || char == bytes1(",") || char == bytes1("(") || char == bytes1(")");
    }
}
