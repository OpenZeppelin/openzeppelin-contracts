// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import { CallType, ExecType, ModeCode } from "../lib/ModeLib.sol";
import {IERC165} from "./IERC165.sol";
import {IERC1271} from "./IERC1271.sol";

struct Execution {
    address target;
    uint256 value;
    bytes callData;
}

interface IERC7579Execution {
    /**
     * @dev Executes a transaction on behalf of the account.
     * @param mode The encoded execution mode of the transaction. See ModeLib.sol for details
     * @param executionCalldata The encoded execution call data
     *
     * MUST ensure adequate authorization control: e.g. onlyEntryPointOrSelf if used with ERC-4337
     * If a mode is requested that is not supported by the Account, it MUST revert
     */
    function execute(bytes32 mode, bytes calldata executionCalldata) external;

    /**
     * @dev Executes a transaction on behalf of the account.
     *         This function is intended to be called by Executor Modules
     * @param mode The encoded execution mode of the transaction. See ModeLib.sol for details
     * @param executionCalldata The encoded execution call data
     *
     * MUST ensure adequate authorization control: i.e. onlyExecutorModule
     * If a mode is requested that is not supported by the Account, it MUST revert
     */
    function executeFromExecutor(
        bytes32 mode,
        bytes calldata executionCalldata
    ) external returns (bytes[] memory returnData);
}

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

interface IERC7579ModuleConfig {
    event ModuleInstalled(uint256 moduleTypeId, address module);
    event ModuleUninstalled(uint256 moduleTypeId, address module);

    /**
     * @dev Installs a Module of a certain type on the smart account
     * @param moduleTypeId the module type ID according to the ERC-7579 spec
     * @param module the module address
     * @param initData arbitrary data that may be required on the module during `onInstall`
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
     * @param deInitData arbitrary data that may be required on the module during `onInstall`
     * initialization.
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
     * @param additionalContext arbitrary data that may be required to determine if the module is installed
     *
     * MUST return true if the module is installed and false otherwise
     */
    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) external view returns (bool);
}
