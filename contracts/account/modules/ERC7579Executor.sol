// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC7579Module, MODULE_TYPE_EXECUTOR, IERC7579Execution} from "../../interfaces/draft-IERC7579.sol";

/**
 * @dev Basic implementation for ERC-7579 executor modules that provides execution functionality
 * for smart accounts.
 *
 * The module enables accounts to execute arbitrary operations, leveraging the execution
 * capabilities defined in the ERC-7579 standard. Developers can customize whether an operation
 * can be executed with custom rules by implementing the {_validateExecution} function in
 * derived contracts.
 *
 * TIP: This is a simplified executor that directly executes operations without delay or expiration
 * mechanisms. For a more advanced implementation with time-delayed execution patterns and
 * security features, see {ERC7579DelayedExecutor}.
 */
abstract contract ERC7579Executor is IERC7579Module {
    /// @dev Emitted when an operation is executed.
    event ERC7579ExecutorOperationExecuted(
        address indexed account,
        bytes32 salt,
        bytes32 mode,
        bytes executionCalldata
    );

    /// @inheritdoc IERC7579Module
    function isModuleType(uint256 moduleTypeId) public pure virtual returns (bool) {
        return moduleTypeId == MODULE_TYPE_EXECUTOR;
    }

    /**
     * @dev Executes an operation and returns the result data from the executed operation.
     * Restricted to the account itself by default. See {_execute} for requirements and
     * {_validateExecution} for authorization checks.
     */
    function execute(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata data
    ) public virtual returns (bytes[] memory returnData) {
        bytes calldata executionCalldata = _validateExecution(account, salt, mode, data);
        returnData = _execute(account, mode, salt, executionCalldata); // Prioritize errors thrown in _execute
        return returnData;
    }

    /**
     * @dev Validates whether the execution can proceed. This function is called before executing
     * the operation and returns the execution calldata to be used.
     *
     * Example extension:
     *
     * ```solidity
     *  function _validateExecution(address account, bytes32 salt, bytes32 mode, bytes calldata data)
     *      internal
     *      override
     *      returns (bytes calldata)
     *  {
     *      // custom logic
     *      return data;
     *  }
     *```
     *
     * TIP: Pack extra data in the `data` arguments (e.g. a signature) to be used in the
     * validation process. Calldata can be sliced to extract it and return only the
     * execution calldata.
     */
    function _validateExecution(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata data
    ) internal virtual returns (bytes calldata);

    /**
     * @dev Internal version of {execute}. Emits {ERC7579ExecutorOperationExecuted} event.
     *
     * Requirements:
     *
     * * The `account` must implement the {IERC7579Execution-executeFromExecutor} function.
     */
    function _execute(
        address account,
        bytes32 mode,
        bytes32 salt,
        bytes calldata executionCalldata
    ) internal virtual returns (bytes[] memory returnData) {
        emit ERC7579ExecutorOperationExecuted(account, salt, mode, executionCalldata);
        return IERC7579Execution(account).executeFromExecutor(mode, executionCalldata);
    }
}
