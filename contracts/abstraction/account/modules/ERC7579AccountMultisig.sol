// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";
import {IERC7579Validator, MODULE_TYPE_SIGNER, MODULE_TYPE_VALIDATOR} from "../../../interfaces/IERC7579Module.sol";
import {Math} from "./../../../utils/math/Math.sol";
import {ERC4337Utils} from "./../../utils/ERC4337Utils.sol";
import {Account} from "../Account.sol";
import {ERC7579Account} from "../ERC7579Account.sol";
import {AccountValidateECDSA} from "./validation/AccountValidateECDSA.sol";
import {AccountValidateERC7579} from "./validation/AccountValidateERC7579.sol";

abstract contract ERC7579AccountMultisig is ERC7579Account, AccountValidateECDSA, AccountValidateERC7579 {
    /// @dev Number of distinct signers/validators required for a userOperation to be valid
    function requiredSignatures() public view virtual returns (uint256);

    /// @inheritdoc AccountValidateECDSA
    function _isSigner(address signer) internal view virtual override returns (bool) {
        return isModuleInstalled(MODULE_TYPE_SIGNER, signer, _zeroBytesCalldata()) || super._isSigner(signer);
    }

    /// @inheritdoc AccountValidateERC7579
    function _isValidator(address module) internal view virtual override returns (bool) {
        return isModuleInstalled(MODULE_TYPE_VALIDATOR, module, _zeroBytesCalldata()) || super._isValidator(module);
    }

    /// @inheritdoc Account
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        bytes calldata userOpSignature
    )
        internal
        virtual
        override(Account, AccountValidateECDSA, AccountValidateERC7579)
        returns (address, uint256 validationData)
    {
        bytes[] calldata signatures = _decodeBytesArray(userOpSignature);
        if (signatures.length < requiredSignatures()) return (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);

        validationData = ERC4337Utils.SIG_VALIDATION_SUCCESS;

        address lastIdentity = address(0);
        for (uint256 i = 0; i < signatures.length; ++i) {
            bytes calldata signature = signatures[i];

            address sigIdentity;
            uint256 sigValidation;
            if (uint8(bytes1(signature)) == uint8(MODULE_TYPE_SIGNER)) {
                (sigIdentity, sigValidation) = AccountValidateECDSA._validateUserOp(
                    userOp,
                    userOpHash,
                    signature[0x01:]
                );
            } else if (uint8(bytes1(signature)) == uint8(MODULE_TYPE_VALIDATOR)) {
                (sigIdentity, sigValidation) = AccountValidateERC7579._validateUserOp(
                    userOp,
                    userOpHash,
                    signature[0x01:]
                );
            } else return (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);

            if (lastIdentity < sigIdentity) {
                lastIdentity = sigIdentity;
                validationData = ERC4337Utils.combineValidationData(validationData, sigValidation);
            } else return (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
        }

        return (address(this), validationData);
    }

    function _decodeBytesArray(bytes calldata input) private pure returns (bytes[] calldata output) {
        assembly ("memory-safe") {
            let ptr := add(input.offset, calldataload(input.offset))
            output.offset := add(ptr, 32)
            output.length := calldataload(ptr)
        }
    }

    function _zeroBytesCalldata() private pure returns (bytes calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }
}
