// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {IERC7579Module, IERC7579Validator, MODULE_TYPE_VALIDATOR} from "../../interfaces/draft-IERC7579.sol";
import {PackedUserOperation} from "../../interfaces/draft-IERC4337.sol";
import {ERC4337Utils} from "../../account/utils/draft-ERC4337Utils.sol";
import {IERC1271} from "../../interfaces/IERC1271.sol";

/**
 * @dev Abstract validator module for ERC-7579 accounts.
 *
 * This contract provides the base implementation for signature validation in ERC-7579 accounts.
 * Developers must implement the onInstall, onUninstall, and {_rawERC7579Validation}
 * functions in derived contracts to define the specific signature validation logic.
 *
 * Example usage:
 *
 * ```solidity
 * contract MyValidatorModule is ERC7579Validator {
 *     function onInstall(bytes calldata data) public {
 *         // Install logic here
 *     }
 *
 *     function onUninstall(bytes calldata data) public {
 *         // Uninstall logic here
 *     }
 *
 *     function _rawERC7579Validation(
 *         address account,
 *         bytes32 hash,
 *         bytes calldata signature
 *     ) internal view override returns (bool) {
 *         // Signature validation logic here
 *     }
 * }
 * ```
 *
 * Developers can restrict other operations by using the internal {_rawERC7579Validation}.
 * Example usage:
 *
 * ```solidity
 * function execute(
 *     address account,
 *     Mode mode,
 *     bytes calldata executionCalldata,
 *     bytes32 salt,
 *     bytes calldata signature
 * ) public virtual {
 *     require(_rawERC7579Validation(account, hash, signature));
 *     // ... rest of execute logic
 * }
 * ```
 */
abstract contract ERC7579Validator is IERC7579Module, IERC7579Validator {
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
            _rawERC7579Validation(msg.sender, userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    /**
     * @dev See {IERC7579Validator-isValidSignatureWithSender}.
     *
     * Ignores the `sender` parameter and validates using {_rawERC7579Validation}.
     * Consider overriding this function to implement custom validation logic
     * based on the original sender.
     */
    function isValidSignatureWithSender(
        address /* sender */,
        bytes32 hash,
        bytes calldata signature
    ) public view virtual returns (bytes4) {
        return
            _rawERC7579Validation(msg.sender, hash, signature)
                ? IERC1271.isValidSignature.selector
                : bytes4(0xffffffff);
    }

    /**
     * @dev Validation algorithm.
     *
     * WARNING: Validation is a critical security function. Implementations must carefully
     * handle cryptographic verification to prevent unauthorized access.
     */
    function _rawERC7579Validation(
        address account,
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual returns (bool);
}
