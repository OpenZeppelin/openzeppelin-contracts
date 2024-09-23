// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {AccountERC7579} from "./AccountERC7579.sol";
import {AccountSigner, EIP712ReadableSigner} from "./AccountSigner.sol";
import {SignerECDSA} from "./signers/SignerECDSA.sol";
import {ERC4337Utils} from "./utils/ERC4337Utils.sol";
import {EIP712ReadableSigner} from "./signers/EIP712ReadableSigner.sol";

abstract contract AccountSignerERC7579 is AccountERC7579, AccountSigner, SignerECDSA {
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    ) public view override(AccountERC7579, EIP712ReadableSigner) returns (bytes4) {
        bytes4 validModuleSignature = AccountERC7579.isValidSignature(hash, signature);
        bytes4 validAccountSignature = EIP712ReadableSigner.isValidSignature(hash, signature);
        bool isValid = validModuleSignature == IERC1271.isValidSignature.selector ||
            validAccountSignature == IERC1271.isValidSignature.selector;
        return isValid ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override(AccountERC7579, AccountSigner) returns (address signer, uint256 validationData) {
        (address accountSigner, uint256 accountValidationData) = AccountSigner._validateUserOp(userOp, userOpHash);
        if (accountValidationData == ERC4337Utils.SIG_VALIDATION_SUCCESS) return (accountSigner, accountValidationData);
        (address moduleSigner, uint256 moduleValidationData) = AccountERC7579._validateUserOp(userOp, userOpHash);
        return (moduleSigner, moduleValidationData);
    }
}
