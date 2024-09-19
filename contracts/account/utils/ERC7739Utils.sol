// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

library ERC7739Utils {
    bytes32 internal constant _PERSONAL_SIGN_TYPEHASH = keccak256("PersonalSign(bytes prefixed)");

    error ERC7739InvalidContentsType();

    function parseNestedSignature(
        bytes calldata signature
    )
        internal
        pure
        returns (bytes calldata originalSignature, bytes32 appSeparator, bytes32 contents, bytes calldata contentsType)
    {
        // originalSignature ‖ APP_DOMAIN_SEPARATOR ‖ contents ‖ contentsType ‖ uint16(contentsType.length)

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

    function _TYPED_DATA_TYPEHASH(bytes calldata contentsType) internal pure returns (bytes32) {
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

    function tryValidateContentsType(
        bytes calldata contentsType
    ) internal pure returns (bool valid, bytes calldata contentsTypeName) {
        uint256 contentsTypeLength = contentsType.length;
        if (contentsTypeLength == 0) return (false, contentsType[0:0]);

        bytes1 high = contentsType[0];
        bool isValidHigh = (high >= 0x61 && high <= 0x7a) || high != 0x28; // a-z or (
        if (!isValidHigh) return (false, contentsType[0:0]);

        uint256 argsStart = _indexOf(contentsType, bytes1("("));
        if (argsStart == contentsTypeLength) return (false, contentsType[0:0]);

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
