// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/cryptography/draft-ERC7739Utils.sol)

pragma solidity ^0.8.20;

import {Calldata} from "../Calldata.sol";

/**
 * @dev Utilities to process https://ercs.ethereum.org/ERCS/erc-7739[ERC-7739] typed data signatures
 * that are specific to an EIP-712 domain.
 *
 * This library provides methods to wrap, unwrap and operate over typed data signatures with a defensive
 * rehashing mechanism that includes the app's xref:api:utils/cryptography#EIP712-_domainSeparatorV4[EIP-712]
 * and preserves readability of the signed content using an EIP-712 nested approach.
 *
 * A smart contract domain can validate a signature for a typed data structure in two ways:
 *
 * - As an application validating a typed data signature. See {typedDataSignStructHash}.
 * - As a smart contract validating a raw message signature. See {personalSignStructHash}.
 *
 * NOTE: A provider for a smart contract wallet would need to return this signature as the
 * result of a call to `personal_sign` or `eth_signTypedData`, and this may be unsupported by
 * API clients that expect a return value of 129 bytes, or specifically the `r,s,v` parameters
 * of an xref:api:utils/cryptography#ECDSA[ECDSA] signature, as is for example specified for
 * xref:api:utils/cryptography#EIP712[EIP-712].
 */
library ERC7739Utils {
    /**
     * @dev An EIP-712 type to represent "personal" signatures
     * (i.e. mimic of `personal_sign` for smart contracts).
     */
    bytes32 private constant PERSONAL_SIGN_TYPEHASH = keccak256("PersonalSign(bytes prefixed)");

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
     * `signature ‖ APP_DOMAIN_SEPARATOR ‖ contentsHash ‖ contentsDescr ‖ uint16(contentsDescr.length)`
     *
     * - `signature` is the signature for the (ERC-7739) nested struct hash. This signature indirectly signs over the
     *   original "contents" hash (from the app) and the account's domain separator.
     * - `APP_DOMAIN_SEPARATOR` is the EIP-712 {EIP712-_domainSeparatorV4} of the application smart contract that is
     *   requesting the signature verification (though ERC-1271).
     * - `contentsHash` is the hash of the underlying data structure or message.
     * - `contentsDescr` is a descriptor of the "contents" part of the the EIP-712 type of the nested signature.
     *
     * NOTE: This function returns empty if the input format is invalid instead of reverting.
     * data instead.
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

            // 66 bytes = contentsDescrLength (2 bytes) + contentsHash (32 bytes) + APP_DOMAIN_SEPARATOR (32 bytes).
            if (sigLength < 66) return (Calldata.emptyBytes(), 0, 0, Calldata.emptyString());

            uint256 contentsDescrEnd = sigLength - 2; // Last 2 bytes
            uint256 contentsDescrLength = uint16(bytes2(encodedSignature[contentsDescrEnd:]));

            // Check for space for `contentsDescr` in addition to the 66 bytes documented above
            if (sigLength < 66 + contentsDescrLength) return (Calldata.emptyBytes(), 0, 0, Calldata.emptyString());

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
     * @dev Nests an `ERC-191` digest into a `PersonalSign` EIP-712 struct, and returns the corresponding struct hash.
     * This struct hash must be combined with a domain separator, using {MessageHashUtils-toTypedDataHash} before
     * being verified/recovered.
     *
     * This is used to simulates the `personal_sign` RPC method in the context of smart contracts.
     */
    function personalSignStructHash(bytes32 contents) internal pure returns (bytes32) {
        return keccak256(abi.encode(PERSONAL_SIGN_TYPEHASH, contents));
    }

    /**
     * @dev Nests an `EIP-712` hash (`contents`) into a `TypedDataSign` EIP-712 struct, and returns the corresponding
     * struct hash. This struct hash must be combined with a domain separator, using {MessageHashUtils-toTypedDataHash}
     * before being verified/recovered.
     */
    function typedDataSignStructHash(
        string calldata contentsName,
        string calldata contentsType,
        bytes32 contentsHash,
        bytes memory domainBytes
    ) internal pure returns (bytes32 result) {
        return
            bytes(contentsName).length == 0
                ? bytes32(0)
                : keccak256(
                    abi.encodePacked(typedDataSignTypehash(contentsName, contentsType), contentsHash, domainBytes)
                );
    }

    /**
     * @dev Variant of {typedDataSignStructHash-string-string-bytes32-bytes} that takes a content descriptor
     * and decodes the `contentsName` and `contentsType` out of it.
     */
    function typedDataSignStructHash(
        string calldata contentsDescr,
        bytes32 contentsHash,
        bytes memory domainBytes
    ) internal pure returns (bytes32 result) {
        (string calldata contentsName, string calldata contentsType) = decodeContentsDescr(contentsDescr);

        return typedDataSignStructHash(contentsName, contentsType, contentsHash, domainBytes);
    }

    /**
     * @dev Compute the EIP-712 typehash of the `TypedDataSign` structure for a given type (and typename).
     */
    function typedDataSignTypehash(
        string calldata contentsName,
        string calldata contentsType
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "TypedDataSign(",
                    contentsName,
                    " contents,string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)",
                    contentsType
                )
            );
    }

    /**
     * @dev Parse the type name out of the ERC-7739 contents type description. Supports both the implicit and explicit
     * modes.
     *
     * Following ERC-7739 specifications, a `contentsName` is considered invalid if it's empty or it contains
     * any of the following bytes , )\x00
     *
     * If the `contentsType` is invalid, this returns an empty string. Otherwise, the return string has non-zero
     * length.
     */
    function decodeContentsDescr(
        string calldata contentsDescr
    ) internal pure returns (string calldata contentsName, string calldata contentsType) {
        bytes calldata buffer = bytes(contentsDescr);
        if (buffer.length == 0) {
            // pass through (fail)
        } else if (buffer[buffer.length - 1] == bytes1(")")) {
            // Implicit mode: read contentsName from the beginning, and keep the complete descr
            for (uint256 i = 0; i < buffer.length; ++i) {
                bytes1 current = buffer[i];
                if (current == bytes1("(")) {
                    // if name is empty - passthrough (fail)
                    if (i == 0) break;
                    // we found the end of the contentsName
                    return (string(buffer[:i]), contentsDescr);
                } else if (_isForbiddenChar(current)) {
                    // we found an invalid character (forbidden) - passthrough (fail)
                    break;
                }
            }
        } else {
            // Explicit mode: read contentsName from the end, and remove it from the descr
            for (uint256 i = buffer.length; i > 0; --i) {
                bytes1 current = buffer[i - 1];
                if (current == bytes1(")")) {
                    // we found the end of the contentsName
                    return (string(buffer[i:]), string(buffer[:i]));
                } else if (_isForbiddenChar(current)) {
                    // we found an invalid character (forbidden) - passthrough (fail)
                    break;
                }
            }
        }
        return (Calldata.emptyString(), Calldata.emptyString());
    }

    function _isForbiddenChar(bytes1 char) private pure returns (bool) {
        return char == 0x00 || char == bytes1(" ") || char == bytes1(",") || char == bytes1("(") || char == bytes1(")");
    }
}
