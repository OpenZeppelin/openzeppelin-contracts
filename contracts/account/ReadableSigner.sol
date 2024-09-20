// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../interfaces/IERC1271.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";
import {MessageHashUtils} from "../utils/cryptography/MessageHashUtils.sol";
import {ERC7739Utils} from "./utils/ERC7739Utils.sol";

abstract contract ReadableSigner is EIP712, IERC1271 {
    error MismatchedTypedData();

    function isValidSignature(bytes32 hash, bytes calldata signature) public view virtual returns (bytes4 result) {
        bool success = _isValidNestedSignature(hash, signature) || _isValidPersonalSignature(hash, signature);
        return success ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }

    /// EIP 712

    function _isValidNestedSignature(bytes32 hash, bytes calldata signature) internal view virtual returns (bool) {
        (
            bytes calldata originalSignature,
            bytes32 appSeparator,
            bytes32 contents,
            bytes calldata contentsType
        ) = ERC7739Utils.parseNestedSignature(signature);

        bytes32 typedDataHash = MessageHashUtils.toTypedDataHash(
            appSeparator,
            _signStructHash(ERC7739Utils.TYPED_DATA_TYPEHASH(contentsType), contents)
        );

        if (typedDataHash != hash) revert MismatchedTypedData();

        return _isValidSignature(hash, originalSignature);
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
            abi.encode(ERC7739Utils._PERSONAL_SIGN_TYPEHASH, MessageHashUtils.toEthSignedMessageHash(hash))
        );
        bytes32 hashTypedData = _hashTypedDataV4(signPersonalStructHash);
        return _isValidSignature(hashTypedData, signature);
    }

    /// Virtual

    function _isValidSignature(bytes32 hash, bytes calldata signature) internal view virtual returns (bool);
}
