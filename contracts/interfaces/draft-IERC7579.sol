// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (interfaces/draft-IERC7579.sol)
pragma solidity ^0.8.20;

import {PackedUserOperation} from "./draft-IERC4337.sol";

uint256 constant VALIDATION_SUCCESS = 0;
uint256 constant VALIDATION_FAILED = 1;
uint256 constant MODULE_TYPE_VALIDATOR = 1;
uint256 constant MODULE_TYPE_EXECUTOR = 2;
uint256 constant MODULE_TYPE_FALLBACK = 3;
uint256 constant MODULE_TYPE_HOOK = 4;

/// @dev Minimal configuration interface for ERC-7579 modules
interface IERC7579Module {
    /**
     * @dev This function is called by the smart account during installation of the module
     * @param data arbitrary data that may be passed to the module during `onInstall` initialization
     *
     * MUST revert on error (e.g. if module is already enabled)
     */
    function onInstall(bytes calldata data) external;

    /**
     * @dev This function is called by the smart account during uninstallation of the module
     * @param data arbitrary data that may be passed to the module during `onUninstall` de-initialization
     *
     * MUST revert on error
     */
    function onUninstall(bytes calldata data) external;

    /**
     * @dev Returns boolean value if module is a certain type
     * @param moduleTypeId the module type ID according the ERC-7579 spec
     *
     * MUST return true if the module is of the given type and false otherwise
     */
    function isModuleType(uint256 moduleTypeId) external view returns (bool);
}

/**
 * @dev ERC-7579 Validation module (type 1).
 *
 * A module that implements logic to validate user operations and signatures.
 */
interface IERC7579Validator is IERC7579Module {
    /**
     * @dev Validates a UserOperation
     * @param userOp the ERC-4337 PackedUserOperation
     * @param userOpHash the hash of the ERC-4337 PackedUserOperation
     *
     * MUST validate that the signature is a valid signature of the userOpHash
     * SHOULD return ERC-4337's SIG_VALIDATION_FAILED (and not revert) on signature mismatch
     * See {IAccount-validateUserOp} for additional information on the return value
     */
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash) external returns (uint256);

    /**
     * @dev Validates a signature using ERC-1271
     * @param sender the address that sent the ERC-1271 request to the smart account
     * @param hash the hash of the ERC-1271 request
     * @param signature the signature of the ERC-1271 request
     *
     * MUST return the ERC-1271 `MAGIC_VALUE` if the signature is valid
     * MUST NOT modify state
     */
    function isValidSignatureWithSender(
        address sender,
        bytes32 hash,
        bytes calldata signature
    ) external view returns (bytes4);
}

/**
 * @dev ERC-7579 Hooks module (type 4).
 *
 * A module that implements logic to execute before and after the account executes a user operation,
 * either individually or batched.
 */
interface IERC7579Hook is IERC7579Module {
    /**
     * @dev Called by the smart account before execution
     * @param msgSender the address that called the smart account
     * @param value the value that was sent to the smart account
     * @param msgData the data that was sent to the smart account
     *
     * MAY return arbitrary data in the `hookData` return value
     */
    function preCheck(
        address msgSender,
        uint256 value,
        bytes calldata msgData
    ) external returns (bytes memory hookData);

    /**
     * @dev Called by the smart account after execution
     * @param hookData the data that was returned by the `preCheck` function
     *
     * MAY validate the `hookData` to validate transaction context of the `preCheck` function
     */
    function postCheck(bytes calldata hookData) external;
}

struct Execution {
    address target;
    uint256 value;
    bytes callData;
}

/**
 * @dev ERC-7579 Execution.
 *
 * Accounts should implement this interface so that the Entrypoint and ERC-7579 modules can execute operations.
 */
interface IERC7579Execution {
    /**
     * @dev Executes a transaction on behalf of the account.
     * @param mode The encoded execution mode of the transaction. See ModeLib.sol for details
     * @param executionCalldata The encoded execution call data
     *
     * MUST ensure adequate authorization control: e.g. onlyEntryPointOrSelf if used with ERC-4337
     * If a mode is requested that is not supported by the Account, it MUST revert
     */
    function execute(bytes32 mode, bytes calldata executionCalldata) external payable;

    /**
     * @dev Executes a transaction on behalf of the account.
     *         This function is intended to be called by Executor Modules
     * @param mode The encoded execution mode of the transaction. See ModeLib.sol for details
     * @param executionCalldata The encoded execution call data
     * @return returnData An array with the returned data of each executed subcall
     *
     * MUST ensure adequate authorization control: i.e. onlyExecutorModule
     * If a mode is requested that is not supported by the Account, it MUST revert
     */
    function executeFromExecutor(
        bytes32 mode,
        bytes calldata executionCalldata
    ) external payable returns (bytes[] memory returnData);
}

/**
 * @dev ERC-7579 Account Config.
 *
 * Accounts should implement this interface to expose information that identifies the account, supported modules and capabilities.
 */
interface IERC7579AccountConfig {
    /**
     * @dev Returns the account id of the smart account
     * @return accountImplementationId the account id of the smart account
     *
     * MUST return a non-empty string
     * The accountId SHOULD be structured like so:
     *        "vendorname.accountname.semver"
     * The id SHOULD be unique across all smart accounts
     */
    function accountId() external view returns (string memory accountImplementationId);

    /**
     * @dev Function to check if the account supports a certain execution mode (see above)
     * @param encodedMode the encoded mode
     *
     * MUST return true if the account supports the mode and false otherwise
     */
    function supportsExecutionMode(bytes32 encodedMode) external view returns (bool);

    /**
     * @dev Function to check if the account supports a certain module typeId
     * @param moduleTypeId the module type ID according to the ERC-7579 spec
     *
     * MUST return true if the account supports the module type and false otherwise
     */
    function supportsModule(uint256 moduleTypeId) external view returns (bool);
}

/**
 * @dev ERC-7579 Module Config.
 *
 * Accounts should implement this interface to allow installing and uninstalling modules.
 */
interface IERC7579ModuleConfig {
    event ModuleInstalled(uint256 moduleTypeId, address module);
    event ModuleUninstalled(uint256 moduleTypeId, address module);

    /**
     * @dev Installs a Module of a certain type on the smart account
     * @param moduleTypeId the module type ID according to the ERC-7579 spec
     * @param module the module address
     * @param initData arbitrary data that may be passed to the module during `onInstall`
     * initialization.
     *
     * MUST implement authorization control
     * MUST call `onInstall` on the module with the `initData` parameter if provided
     * MUST emit ModuleInstalled event
     * MUST revert if the module is already installed or the initialization on the module failed
     */
    function installModule(uint256 moduleTypeId, address module, bytes calldata initData) external;

    /**
     * @dev Uninstalls a Module of a certain type on the smart account
     * @param moduleTypeId the module type ID according the ERC-7579 spec
     * @param module the module address
     * @param deInitData arbitrary data that may be passed to the module during `onUninstall`
     * deinitialization.
     *
     * MUST implement authorization control
     * MUST call `onUninstall` on the module with the `deInitData` parameter if provided
     * MUST emit ModuleUninstalled event
     * MUST revert if the module is not installed or the deInitialization on the module failed
     */
    function uninstallModule(uint256 moduleTypeId, address module, bytes calldata deInitData) external;

    /**
     * @dev Returns whether a module is installed on the smart account
     * @param moduleTypeId the module type ID according the ERC-7579 spec
     * @param module the module address
     * @param additionalContext arbitrary data that may be passed to determine if the module is installed
     *
     * MUST return true if the module is installed and false otherwise
     */
    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) external view returns (bool);
}
