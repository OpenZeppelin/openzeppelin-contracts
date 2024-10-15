// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {IERC5267} from "../../interfaces/IERC5267.sol";
import {PackedUserOperation} from "../../interfaces/draft-IERC4337.sol";
import {IERC7579Validator, IERC7579Module, MODULE_TYPE_VALIDATOR} from "../../interfaces/draft-IERC7579.sol";
import {ERC4337Utils} from "../utils/draft-ERC4337Utils.sol";
import {ERC7739Utils} from "../../utils/cryptography/draft-ERC7739Utils.sol";

/**
 * @dev ERC7579 Signature Validator module.
 *
 * This module provides signature validation for user operations using {ERC7739Utils}
 * for replay protection when validating {IERC1271} signatures. This contract does not
 * have a domain itself but it uses the sender's domain separator to validate typed data signatures.
 *
 * See {_validateSignatureWithSender} for the signature validation logic.
 */
abstract contract SignatureValidator is IERC7579Validator {
    bytes32 private constant EIP712_TYPE_HASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    /// @inheritdoc IERC7579Module
    function isModuleType(uint256 moduleTypeId) public pure virtual returns (bool) {
        return moduleTypeId == MODULE_TYPE_VALIDATOR;
    }

    /// @inheritdoc IERC7579Validator
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) public view virtual returns (uint256) {
        return
            _isValidSignatureWithSender(msg.sender, userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    /// @inheritdoc IERC7579Validator
    function isValidSignatureWithSender(
        address sender,
        bytes32 hash,
        bytes calldata signature
    ) public view virtual returns (bytes4) {
        return
            _isValidSignatureWithSender(sender, hash, signature)
                ? IERC1271.isValidSignature.selector
                : bytes4(0xffffffff);
    }

    /**
     * @dev Validates a signature wrapped in a nested typed data for a specific sender.
     *
     * If the calculated sender's domain separator is different from the provided sender's domain separator,
     * the signature validation defaults to a nested typed personal signature validation workflow.
     */
    function _isValidSignatureWithSender(
        address sender,
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual returns (bool) {
        (bytes32 nestedHash, string memory name, string memory version, bytes calldata sig) = _hashUnwrappedSig(
            sender,
            signature
        );
        if (nestedHash != hash)
            return _validateSignatureWithSender(sender, _personalNestedHash(hash, name, version, sender), signature);
        return _validateSignatureWithSender(sender, nestedHash, sig);
    }

    /**
     * @dev Hashes the unwrapped signature contents and returns the nested struct hash and the original signature.
     */
    function _hashUnwrappedSig(
        address sender,
        bytes calldata signature
    )
        internal
        view
        virtual
        returns (bytes32 nestedHash, string memory name, string memory version, bytes calldata originalSig)
    {
        bytes32 senderSeparator;
        bytes32 contents;
        bytes calldata contentsType;
        (originalSig, senderSeparator, contents, contentsType) = ERC7739Utils.unwrapTypedDataSig(signature);
        bytes32 nestedStructHash;
        (name, version, nestedStructHash) = _typedDataNestedStructHash(sender, contents, contentsType);
        nestedHash = ERC7739Utils.toNestedTypedDataHash(senderSeparator, nestedStructHash);
    }

    /**
     * @dev Calculates the hash of the nested typed data struct.
     */
    function _typedDataNestedStructHash(
        address sender,
        bytes32 contents,
        bytes calldata contentsType
    ) private view returns (string memory name, string memory version, bytes32 nestedStructHash) {
        address verifyingContract;
        bytes32 salt;
        uint256[] memory extensions;
        (name, version, verifyingContract, salt, extensions) = _appDomain(sender);

        nestedStructHash = ERC7739Utils.typedDataNestedStructHash(
            contentsType,
            contents,
            name,
            version,
            verifyingContract,
            salt,
            extensions
        );
    }

    function _appDomain(
        address app
    )
        internal
        view
        returns (
            string memory name,
            string memory version,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        )
    {
        bytes memory data = abi.encodePacked(IERC5267.eip712Domain.selector);
        bool success;
        uint256 retSize;

        // Get domain without revert if the account doesn't have code
        assembly ("memory-safe") {
            success := staticcall(gas(), app, add(data, 0x20), mload(data), 0, 0)
            retSize := returndatasize()
        }

        if (!success || retSize < 32) return ("", "", address(0), bytes32(0), new uint256[](0));

        // Copy the return data
        assembly ("memory-safe") {
            mstore(data, retSize)
            returndatacopy(add(data, 0x20), 0, retSize)
        }

        // Decode
        (, name, version, , verifyingContract, salt, extensions) = abi.decode(
            data,
            (bytes1, string, string, uint256, address, bytes32, uint256[])
        );
    }

    /**
     * @dev Calculates the hash of the nested personal signature.
     */
    function _personalNestedHash(
        bytes32 hash,
        string memory name,
        string memory version,
        address sender
    ) private view returns (bytes32) {
        return
            ERC7739Utils.toNestedPersonalSignHash(
                keccak256(
                    abi.encode(
                        EIP712_TYPE_HASH,
                        keccak256(bytes(name)),
                        keccak256(bytes(version)),
                        block.chainid,
                        sender
                    )
                ),
                hash
            );
    }

    /**
     * @dev Validates a signature for a specific sender.
     */
    function _validateSignatureWithSender(
        address sender,
        bytes32 nestedHash,
        bytes calldata signature
    ) internal view virtual returns (bool);
}
