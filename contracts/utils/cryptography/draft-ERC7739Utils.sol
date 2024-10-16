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
    bytes32 internal constant _NESTED_PERSONAL_SIGN_TYPEHASH = keccak256("PersonalSign(bytes prefixed)");

    /**
     * @dev Error when the contents type is invalid. See {tryValidateContentsType}.
     */
    error InvalidContentsType();

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
     * - `contentsType` is the EIP-712 type of the nested signature (e.g. {NESTED_TYPED_DATA_TYPEHASH} or {_NESTED_PERSONAL_SIGN_TYPEHASH})
     */
    function decodeSignature(
        bytes calldata encodedSignature
    )
        internal
        pure
        returns (bytes calldata signature, bytes32 separator, bytes32 contents, bytes calldata contentsType)
    {
        unchecked {
            uint256 sigLength = encodedSignature.length;

            if (sigLength < 66) return (_emptyCalldataBytes(), 0, 0, _emptyCalldataBytes());

            uint256 contentsTypeEnd = sigLength - 2; // Last 2 bytes
            uint256 contentsTypeLength = uint16(bytes2(encodedSignature[contentsTypeEnd:]));

            if (contentsTypeLength > contentsTypeEnd) return (_emptyCalldataBytes(), 0, 0, _emptyCalldataBytes());

            uint256 contentsEnd = contentsTypeEnd - contentsTypeLength;

            if (contentsEnd < 64) return (_emptyCalldataBytes(), 0, 0, _emptyCalldataBytes());

            uint256 separatorEnd = contentsEnd - 32;
            uint256 signatureEnd = separatorEnd - 32;

            signature = encodedSignature[:signatureEnd];
            separator = bytes32(encodedSignature[signatureEnd:separatorEnd]);
            contents = bytes32(encodedSignature[separatorEnd:contentsEnd]);
            contentsType = encodedSignature[contentsEnd:contentsTypeEnd];
        }
    }

    /**
     * @dev Nest a signature for a given EIP-712 type into a nested signature for the domain `separator`.
     *
     * Counterpart of {decodeSignature} to extract the original signature and the nested components.
     */
    function encodeSignature(
        bytes memory signature,
        bytes32 separator,
        bytes32 contents,
        bytes memory contentsType
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(signature, separator, contents, contentsType, uint16(contentsType.length));
    }

    /**
     * @dev Nests a `contents` digest into an {EIP712} type that simulates the `eth_personalSign` RPC
     * method in the context of smart contracts.
     *
     * This typed uses the {_NESTED_PERSONAL_SIGN_TYPEHASH} type to nest the `contents` hash for the
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
    function toNestedPersonalSignHash(bytes32 separator, bytes32 contents) internal pure returns (bytes32) {
        return
            MessageHashUtils.toTypedDataHash(
                separator,
                keccak256(abi.encode(_NESTED_PERSONAL_SIGN_TYPEHASH, MessageHashUtils.toEthSignedMessageHash(contents)))
            );
    }

    /**
     * @dev Nests an {EIP712} typed data `contents` digest into an {EIP712} that simulates
     * `eth_signTypedData` RPC method for another domain (application).
     *
     * This type uses the {NESTED_TYPED_DATA_TYPEHASH} type to nest the `contents` hash
     * for the current domain with the application's domain separator.
     *
     * To produce a signature for this nested type, the signer must sign the following type hash:
     *
     * ```solidity
     * bytes32 hash = keccak256(
     *  abi.encodePacked(
     *      \x19\x01,
     *      separator, // The domain separator of the application contract
     *      keccak256(
     *          abi.encode(
     *              NESTED_TYPED_DATA_TYPEHASH(contentsType), // See {NESTED_TYPED_DATA_TYPEHASH}
     *              contents,
     *              // See {IERC5267-eip712Domain} for the following arguments from the verifying contract's domain
     *              keccak256(bytes(name)),
     *              keccak256(bytes(version)),
     *              chainId,
     *              verifyingContract,
     *              salt,
     *              keccak256(abi.encodePacked(extensions))
     *          )
     *      )
     *  )
     *);
     *
     * NOTE: The arguments should be those of the verifying application. See {EIP712-_domainSeparatorV4}
     * and {IERC5267-eip712Domain} for more details of how to obtain these values. Respectively, they
     * must be obtained from the verifying contract (e.g. an Account) and the application domain.
     */
    function toNestedTypedDataHash(
        bytes32 separator,
        bytes32 hashedTypedDataNestedStruct
    ) internal pure returns (bytes32) {
        return MessageHashUtils.toTypedDataHash(separator, hashedTypedDataNestedStruct);
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
    // solhint-disable-next-line func-name-mixedcase
    function NESTED_TYPED_DATA_TYPEHASH(bytes calldata contentsType) internal pure returns (bytes32) {
        (bool valid, bytes calldata contentsTypeName) = tryValidateContentsType(contentsType);
        if (!valid) revert InvalidContentsType();
        return NESTED_TYPED_DATA_TYPEHASH(contentsType, contentsTypeName);
    }

    /**
     * @dev Same as {NESTED_TYPED_DATA_TYPEHASH} but with the `contentsTypeName` already validated.
     *
     * See {tryValidateContentsType}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function NESTED_TYPED_DATA_TYPEHASH(
        bytes calldata contentsType,
        bytes calldata contentsTypeName
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "TypedDataSign(",
                    contentsTypeName,
                    "bytes1 fields,",
                    "string name,",
                    "string version,",
                    "uint256 chainId,",
                    "address verifyingContract,",
                    "bytes32 salt,",
                    "uint256[] extensions",
                    ")",
                    contentsType
                )
            );
    }

    /**
     * @dev Try to validate the contents type is a valid EIP-712 type.
     *
     * A valid `contentsType` is considered invalid if it's empty or if:
     * - it starts with a '('.
     * - it contains any of the following bytes: , )\x00
     *
     * NOTE: This is a looser take on the ERC very strict restrictions. This part appears to be under discussion, and
     * therefore the restrictions implemented here may change in a future release.
     */
    function tryValidateContentsType(
        bytes calldata contentsType
    ) internal pure returns (bool valid, bytes calldata contentsTypeName) {
        // Loop over the contentsType, looking for the end of the contntsTypeName and validating the input as we go.
        for (uint256 i = 0; i < contentsType.length; ++i) {
            bytes1 current = contentsType[i];
            if (current == bytes1("(")) {
                // we found the end of the contentsTypeName
                if (i == 0) {
                    return (false, _emptyCalldataBytes());
                } else {
                    return (true, contentsType[:i]);
                }
            } else if (current == 0x00 || current == bytes1(" ") || current == bytes1(",") || current == bytes1(")")) {
                // we found an invalid character (forbidden)
                return (false, _emptyCalldataBytes());
            }
        }
        // We exited the loop without finding of the contentsTypeName
        return (false, _emptyCalldataBytes());
    }

    /**
     * @dev Computes the hash of the nested struct for the given contents.
     *
     * NOTE: This function does not validate the contents type. See {tryValidateContentsType}.
     */
    function typedDataNestedStructHash(
        bytes calldata contentsType,
        bytes32 contents,
        string memory name,
        string memory version,
        address verifyingContract,
        bytes32 salt,
        uint256[] memory extensions
    ) internal view returns (bytes32) {
        (, bytes calldata contentsTypeName) = tryValidateContentsType(contentsType);
        return
            keccak256(
                abi.encode(
                    NESTED_TYPED_DATA_TYPEHASH(contentsType, contentsTypeName),
                    contents,
                    keccak256(bytes(name)),
                    keccak256(bytes(version)),
                    block.chainid,
                    verifyingContract,
                    salt,
                    keccak256(abi.encodePacked(extensions))
                )
            );
    }

    function _emptyCalldataBytes() private pure returns (bytes calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }
}
