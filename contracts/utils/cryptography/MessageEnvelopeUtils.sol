// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC5267} from "../../interfaces/IERC5267.sol";
import {MessageHashUtils} from "./MessageHashUtils.sol";

/**
 * @dev Utilities to produce and process {EIP712} typed data signatures with an application envelope.
 *
 * Typed data envelopes are useful for smart contracts that validate signatures (e.g. Accounts),
 * as these allow contracts to validate signatures of wrapped data structures that include their
 * {EIP712-_domainSeparatorV4}.
 *
 * In this way, an off-chain signer can be sure that the signature is only valid for the specific
 * domain. For developers, there might be 2 ways of validating smart contract messages:
 *
 * - As an application validating a typed data signature. See {toTypedDataEnvelopeHash}.
 * - As a smart contract validating a raw message signature. See {toPersonalSignEnvelopeHash}.
 *
 * NOTE: A provider for a smart contract wallet would need to return this signature as the
 * result of a call to `personal_sign` or `eth_signTypedData`, and this may be unsupported by
 * API clients that expect a return value of 129 bytes, or specifically the `r,s,v` parameters
 * of an {ECDSA} signature, as is for example specified for {EIP712}.
 */
library MessageEnvelopeUtils {
    /**
     * @dev An EIP-712 typed to represent "personal" signatures
     * (i.e. mimic of `eth_personalSign` for smart contracts).
     */
    bytes32 internal constant _PERSONAL_SIGN_ENVELOPE_TYPEHASH = keccak256("PersonalSign(bytes prefixed)");

    /**
     * @dev Error when the contents type is invalid. See {tryValidateContentsType}.
     */
    error InvalidContentsType();

    /**
     * @dev Parses a nested signature into its components. See {nest}.
     */
    function unwrapTypedDataEnvelope(
        bytes calldata signature
    )
        internal
        pure
        returns (bytes calldata originalSig, bytes32 appSeparator, bytes32 contents, bytes calldata contentsType)
    {
        uint256 sigLength = signature.length;
        uint256 contentsTypeEnd = sigLength - 2; // Last 2 bytes
        uint256 contentsEnd = contentsTypeEnd - uint16(bytes2(signature[contentsTypeEnd:sigLength]));
        uint256 appSeparatorEnd = contentsEnd - 32;
        uint256 originalSigEnd = appSeparatorEnd - 32;

        originalSig = signature[0:originalSigEnd];
        appSeparator = bytes32(signature[originalSigEnd:appSeparatorEnd]);
        contents = bytes32(signature[appSeparatorEnd:contentsEnd]);
        contentsType = signature[contentsEnd:contentsTypeEnd];
    }

    /**
     * @dev Nest a signature for a given EIP-712 type into an envelope for the domain `separator`.
     *
     * Constructed as follows:
     *
     * `signature ‖ DOMAIN_SEPARATOR ‖ contents ‖ contentsType ‖ uint16(contentsType.length)`
     *
     * - `signature` is the original signature for the envelope including the `contents` hash
     * - `DOMAIN_SEPARATOR` is the EIP-712 {EIP712-_domainSeparatorV4} of the smart contract verifying the signature
     * - `contents` is the hash of the underlying data structure or message
     * - `contentsType` is the EIP-712 type of the envelope (e.g. {TYPED_DATA_ENVELOPE_TYPEHASH} or {_PERSONAL_SIGN_ENVELOPE_TYPEHASH})
     *
     * Counterpart of {unwrapTypedDataEnvelope} to extract the original signature and the nested components.
     */
    function wrapTypedDataEnvelope(
        bytes memory signature,
        bytes32 separator,
        bytes32 contents,
        bytes memory contentsType
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(signature, separator, contents, contentsType, uint16(contentsType.length));
    }

    /**
     * @dev Wraps a `contents` digest into an envelope that simulates the `eth_personalSign` RPC
     * method in the context of smart contracts.
     *
     * This envelope uses the {_PERSONAL_SIGN_ENVELOPE_TYPEHASH} type to wrap the `contents`
     * hash in an EIP-712 envelope for the current domain `separator`.
     *
     * To produce a signature for this envelope, the signer must sign a wrapped message hash:
     *
     * ```solidity
     * bytes32 hash = abi.encodePacked(
     *      \x19\x01,
     *      CURRENT_DOMAIN_SEPARATOR,
     *      keccak256(abi.encode("PersonalSign(bytes prefixed)"),\x19Ethereum Signed Message:\n32,contents)
     * );
     * ```
     */
    function toPersonalSignEnvelopeHash(bytes32 separator, bytes32 contents) internal pure returns (bytes32) {
        return
            MessageHashUtils.toTypedDataHash(
                separator,
                keccak256(
                    abi.encode(
                        MessageEnvelopeUtils._PERSONAL_SIGN_ENVELOPE_TYPEHASH,
                        MessageHashUtils.toEthSignedMessageHash(contents)
                    )
                )
            );
    }

    /**
     * @dev Wraps an {EIP712} typed data `contents` digest into an envelope that simulates the
     * `eth_signTypedData` RPC method in the context of smart contracts.
     *
     * This envelope uses the {TYPED_DATA_ENVELOPE_TYPEHASH} type to nest the `contents` hash in
     * an EIP-712 envelope for the current domain.
     *
     * To produce a signature for this envelope, the signer must sign a wrapped typed data hash:
     *
     * ```solidity
     * bytes32 hash = keccak256(
     *  abi.encodePacked(
     *      \x19\x01,
     *      separator, // The domain separator of the applicaton contract
     *      keccak256(
     *          abi.encode(
     *              TYPED_DATA_ENVELOPE_TYPEHASH(contentsType), // See {TYPED_DATA_ENVELOPE_TYPEHASH}
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
    function toTypedDataEnvelopeHash(
        bytes32 separator,
        bytes32 contents,
        bytes calldata contentsType,
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract,
        bytes32 salt,
        uint256[] memory extensions
    ) internal pure returns (bytes32) {
        return
            MessageHashUtils.toTypedDataHash(
                separator,
                _typedDataEnvelopeStructHash(
                    contentsType,
                    contents,
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
     * @dev Computes the wrapped EIP-712 type hash for the given contents type.
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
    function TYPED_DATA_ENVELOPE_TYPEHASH(bytes calldata contentsType) internal pure returns (bytes32) {
        (bool valid, bytes calldata contentsTypeName) = tryValidateContentsType(contentsType);
        if (!valid) revert InvalidContentsType();

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
     * A valid `contentsType` is considered invalid if it's empty or it:
     *
     * - Starts with a-z or (
     * - Contains any of the following bytes: , )\x00
     */
    function tryValidateContentsType(
        bytes calldata contentsType
    ) internal pure returns (bool valid, bytes calldata contentsTypeName) {
        uint256 contentsTypeLength = contentsType.length;
        if (contentsTypeLength == 0) return (false, contentsType[0:0]); // Empty

        // Does not start with a-z or (
        bytes1 high = contentsType[0];
        bool isValidHigh = (high >= 0x61 && high <= 0x7a) || high != 0x28; // a-z or (
        if (!isValidHigh) return (false, contentsType[0:0]);

        // Find the start of the arguments
        uint256 argsStart = _indexOf(contentsType, bytes1("("));
        if (argsStart == contentsTypeLength) return (false, contentsType[0:0]);

        // Forbidden characters
        for (uint256 i = 0; i < contentsTypeLength; i++) {
            // Look for any of the following bytes: , )\x00
            bytes1 current = contentsType[i];
            if (current == 0x2c || current == 0x29 || current == 0x00) return (false, contentsType[0:0]);
        }

        return (true, contentsType[0:argsStart - 1]);
    }

    /**
     * @dev Computes the hash of the envelope struct for the given contents.
     */
    function _typedDataEnvelopeStructHash(
        bytes calldata contentsType,
        bytes32 contents,
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract,
        bytes32 salt,
        uint256[] memory extensions
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    TYPED_DATA_ENVELOPE_TYPEHASH(contentsType),
                    contents,
                    keccak256(bytes(name)),
                    keccak256(bytes(version)),
                    chainId,
                    verifyingContract,
                    salt,
                    keccak256(abi.encodePacked(extensions))
                )
            );
    }

    function _indexOf(bytes calldata buffer, bytes1 lookup) private pure returns (uint256) {
        uint256 length = buffer.length;
        for (uint256 i = 0; i < length; i++) {
            if (buffer[i] == lookup) return i;
        }
        return length;
    }
}
