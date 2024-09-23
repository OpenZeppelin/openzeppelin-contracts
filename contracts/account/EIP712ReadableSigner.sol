// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../interfaces/IERC1271.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";
import {MessageHashUtils} from "../utils/cryptography/MessageHashUtils.sol";
import {EIP712NestedUtils} from "../utils/cryptography/EIP712NestedUtils.sol";
import {ShortStrings} from "../utils/ShortStrings.sol";

abstract contract EIP712ReadableSigner is EIP712, IERC1271 {
    error MismatchedTypedData();

    function isValidSignature(bytes32 hash, bytes calldata signature) public view virtual returns (bytes4 result) {
        return _isValidSignature(hash, signature) ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }

    function _isValidSignature(bytes32 hash, bytes calldata signature) internal view virtual returns (bool) {
        return _isValidNestedSignature(hash, signature) || _isValidPersonalSignature(hash, signature);
    }

    /// EIP 712

    function _isValidNestedSignature(bytes32 hash, bytes calldata signature) internal view virtual returns (bool) {
        (
            bytes calldata originalSignature,
            bytes32 appSeparator,
            bytes32 contents,
            bytes calldata contentsType
        ) = EIP712NestedUtils.parseNestedSignature(signature);

        bytes32 typedDataHash = MessageHashUtils.toTypedDataHash(
            appSeparator,
            _signStructHash(EIP712NestedUtils.TYPED_DATA_TYPEHASH(contentsType), contents)
        );

        if (typedDataHash != hash) revert MismatchedTypedData();

        return _validateSignature(hash, originalSignature);
    }

    function _signStructHash(bytes32 typedDataSignHash, bytes32 contents) private view returns (bytes32) {
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

    /// Personal

    function _isValidPersonalSignature(bytes32 hash, bytes calldata signature) internal view returns (bool) {
        bytes32 signPersonalStructHash = keccak256(
            abi.encode(EIP712NestedUtils._PERSONAL_SIGN_TYPEHASH, MessageHashUtils.toEthSignedMessageHash(hash))
        );
        bytes32 hashTypedData = _hashTypedDataV4(signPersonalStructHash);
        return _validateSignature(hashTypedData, signature);
    }

    /// Virtual

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual returns (bool);
}
