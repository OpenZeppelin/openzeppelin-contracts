// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Utilities to nest {EIP712} typed data signatures.
 *
 * Nesting typed data is useful for smart contracts that implement the {IERC1271} interface, as it allows them to
 * validate signatures of nested data structures. In this way, an off-chain signer has the assurance that the signature
 * is only valid for the specific domain of the application.
 *
 * The nested signature is constructed as follows:
 *
 * `originalSignature ‖ APP_DOMAIN_SEPARATOR ‖ contents ‖ contentsType ‖ uint16(contentsType.length)`
 *
 * * `originalSignature` is the signature for the `content` hash
 * * `APP_DOMAIN_SEPARATOR` is the EIP-712 {EIP712-_domainSeparatorV4} of the smart contract (app) that requested the signature
 * * `contents` is the hash of the requested EIP-712 typed data (see {EIP712-_hashTypedDataV4})
 * * `contentsType` is the EIP-712 type (e.g. `Transfer(address to,uint256 amount)`)
 *
 * NOTE: A provider for a smart contract wallet would need to return this signature as the result of a call to `personal_sign` or
 * `eth_signTypedData`, and this may be unsupported by API clients that expect a return value of 129 bytes, or specifically
 * the `r,s,v` parameters of an {ECDSA} signature, as is for example specified for {EIP712}.
 */
library EIP712NestedUtils {
    /// @dev An EIP-712 typed to represent "personal" signatures (i.e. mimic of `eth_personalSign` for smart contracts).
    bytes32 internal constant _PERSONAL_SIGN_TYPEHASH = keccak256("PersonalSign(bytes prefixed)");

    error ERC7739InvalidContentsType();

    /// @dev Parses a nested signature into its components.
    function parseNestedSignature(
        bytes calldata signature
    )
        internal
        pure
        returns (bytes calldata originalSignature, bytes32 appSeparator, bytes32 contents, bytes calldata contentsType)
    {
        uint256 signatureLength = signature.length;
        uint256 contentsTypeEnd = signatureLength - 2; // Last 2 bytes
        uint256 contentsEnd = contentsTypeEnd - uint16(bytes2(signature[contentsTypeEnd:signatureLength]));
        uint256 appSeparatorEnd = contentsEnd - 32;
        uint256 originalSignatureEnd = appSeparatorEnd - 32;

        originalSignature = signature[0:originalSignatureEnd];
        appSeparator = bytes32(signature[originalSignatureEnd:appSeparatorEnd]);
        contents = bytes32(signature[appSeparatorEnd:contentsEnd]);
        contentsType = signature[contentsEnd:contentsTypeEnd];
    }

    /// @dev Nest a signature for a given EIP-712 typed data hash.
    function nestSignature(
        bytes memory originalSignature,
        bytes32 appSeparator,
        bytes32 contents,
        bytes memory contentsType
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(originalSignature, appSeparator, contents, contentsType, uint16(contentsType.length));
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
     *  * `contentsType` must be a valid EIP-712 type (see {tryValidateContentsType})
     */
    // solhint-disable-next-line func-name-mixedcase
    function TYPED_DATA_TYPEHASH(bytes calldata contentsType) internal pure returns (bytes32) {
        (bool valid, bytes calldata contentsTypeName) = tryValidateContentsType(contentsType);
        if (!valid) revert ERC7739InvalidContentsType();

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

        // Forbidded characters
        for (uint256 i = 0; i < contentsTypeLength; i++) {
            // Look for any of the following bytes: , )\x00
            bytes1 current = contentsType[i];
            if (current == 0x2c || current == 0x29 || current == 0x00) return (false, contentsType[0:0]);
        }

        return (true, contentsType[0:argsStart - 1]);
    }

    function _indexOf(bytes calldata buffer, bytes1 lookup) private pure returns (uint256) {
        uint256 length = buffer.length;
        for (uint256 i = 0; i < length; i++) {
            if (buffer[i] == lookup) return i;
        }
        return length;
    }
}
