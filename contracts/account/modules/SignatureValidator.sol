// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {IERC5267} from "../../interfaces/IERC5267.sol";
import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {IERC7579Validator, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {ERC4337Utils} from "../utils/ERC4337Utils.sol";
import {MessageEnvelopeUtils} from "../../utils/cryptography/MessageEnvelopeUtils.sol";

abstract contract SignatureValidator is IERC7579Validator {
    using MessageEnvelopeUtils for *;

    bytes32 private constant EIP712_TYPE_HASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

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

    function _isValidSignatureWithSender(
        address sender,
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual returns (bool) {
        (
            bytes32 senderSeparator,
            bytes32 appSeparator,
            bytes32 envelopeHash,
            bytes calldata sig
        ) = _unwrapTypedDataEnvelopeForSender(sender, signature);
        if (
            envelopeHash != hash || // Hash mismatch
            appSeparator != senderSeparator // App separator mismatch
        ) return false;

        return _validateSignatureWithSender(sender, envelopeHash, sig);
    }

    function _unwrapTypedDataEnvelopeForSender(
        address sender,
        bytes calldata signature
    )
        internal
        view
        virtual
        returns (bytes32 senderSeparator, bytes32 appSeparator, bytes32 envelopeHash, bytes calldata originalSig)
    {
        (
            ,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        ) = IERC5267(sender).eip712Domain();

        bytes32 senderDomainSeparator = keccak256(
            abi.encode(EIP712_TYPE_HASH, keccak256(bytes(name)), keccak256(bytes(version)), block.chainid, sender)
        );

        (bytes calldata sig, bytes32 appDomainSeparator, bytes32 contents, bytes calldata contentsType) = signature
            .unwrapTypedDataEnvelope();

        return (
            appDomainSeparator,
            senderDomainSeparator,
            senderSeparator.toTypedDataEnvelopeHash(
                contents,
                contentsType,
                name,
                version,
                chainId,
                verifyingContract,
                salt,
                extensions
            ),
            sig
        );
    }

    function _validateSignatureWithSender(
        address sender,
        bytes32 envelopeHash,
        bytes calldata signature
    ) internal view virtual returns (bool);
}
