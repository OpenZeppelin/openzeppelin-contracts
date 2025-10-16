// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Time} from "../../utils/types/Time.sol";
import {IERC7579ModuleConfig, MODULE_TYPE_EXECUTOR} from "../../interfaces/draft-IERC7579.sol";
import {ERC7579Executor} from "./ERC7579Executor.sol";

/**
 * @dev Extension of {ERC7579Executor} that allows scheduling and executing delayed operations
 * with expiration. This module enables time-delayed execution patterns for smart accounts.
 *
 * ==== Operation Lifecycle
 *
 * 1. Scheduling: Operations are scheduled via {schedule} with a specified delay period.
 * The delay period is set during {onInstall} and can be customized via {setDelay}. Each
 * operation enters a `Scheduled` state and must wait for its delay period to elapse.
 *
 * 2. Security Window: During the delay period, operations remain in `Scheduled` state but
 * cannot be executed. Through this period, suspicious operations can be monitored and
 * canceled via {cancel} if appropriate.
 *
 * 3. Execution & Expiration: Once the delay period elapses, operations transition to `Ready` state.
 * Operations can be executed via {execute} and have an expiration period after becoming
 * executable. If an operation is not executed within the expiration period, it becomes `Expired`
 * and can't be executed. Expired operations must be rescheduled with a different salt.
 *
 * ==== Delay Management
 *
 * Accounts can set their own delay periods during installation or via {setDelay}.
 * The delay period is enforced even between installas and uninstalls to prevent
 * immediate downgrades. When setting a new delay period, the new delay takes effect
 * after a transition period defined by the current delay or {minSetback}, whichever
 * is longer.
 *
 * ==== Authorization
 *
 * Authorization for scheduling and canceling operations is controlled through the {_validateSchedule}
 * and {_validateCancel} functions. These functions can be overridden to implement custom
 * authorization logic, such as requiring specific signers or roles.
 *
 * TIP: Use {_scheduleAt} to schedule operations at a specific points in time. This is
 * useful to pre-schedule operations for non-deployed accounts (e.g. subscriptions).
 */
abstract contract ERC7579DelayedExecutor is ERC7579Executor {
    using Time for *;

    struct Schedule {
        // 1 slot = 48 + 32 + 32 + 1 + 1 = 114 bits ~ 14 bytes
        uint48 scheduledAt; // The time when the operation was scheduled
        uint32 executableAfter; // Time after the operation becomes executable
        uint32 expiresAfter; // Time after the operation expires
        bool executed;
        bool canceled;
    }

    struct ExecutionConfig {
        // 1 slot = 112 + 32 + 1 = 145 bits ~ 18 bytes
        Time.Delay delay;
        uint32 expiration; // Time after operation is OperationState.Ready to expire
        bool installed;
    }

    enum OperationState {
        Unknown,
        Scheduled,
        Ready,
        Expired,
        Executed,
        Canceled
    }

    /// @dev Emitted when a new operation is scheduled.
    event ERC7579ExecutorOperationScheduled(
        address indexed account,
        bytes32 indexed operationId,
        bytes32 salt,
        bytes32 mode,
        bytes executionCalldata,
        uint48 schedule
    );

    /// @dev Emitted when a new operation is canceled.
    event ERC7579ExecutorOperationCanceled(address indexed account, bytes32 indexed operationId);

    /// @dev Emitted when the execution delay is updated.
    event ERC7579ExecutorDelayUpdated(address indexed account, uint32 newDelay, uint48 effectTime);

    /// @dev Emitted when the expiration delay is updated.
    event ERC7579ExecutorExpirationUpdated(address indexed account, uint32 newExpiration);

    /**
     * @dev The current state of a operation is not the expected. The `expectedStates` is a bitmap with the
     * bits enabled for each OperationState enum position counting from right to left. See {_encodeStateBitmap}.
     *
     * NOTE: If `expectedState` is `bytes32(0)`, the operation is expected to not be in any state (i.e. not exist).
     */
    error ERC7579ExecutorUnexpectedOperationState(
        bytes32 operationId,
        OperationState currentState,
        bytes32 allowedStates
    );

    /// @dev The module is not installed on the account.
    error ERC7579ExecutorModuleNotInstalled();

    mapping(address account => ExecutionConfig) private _config;
    mapping(bytes32 operationId => Schedule) private _schedules;

    /// @dev Current state of an operation.
    function state(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata executionCalldata
    ) public view returns (OperationState) {
        return state(hashOperation(account, salt, mode, executionCalldata));
    }

    /// @dev Same as {state}, but for a specific operation id.
    function state(bytes32 operationId) public view returns (OperationState) {
        if (_schedules[operationId].scheduledAt == 0) return OperationState.Unknown;
        if (_schedules[operationId].canceled) return OperationState.Canceled;
        if (_schedules[operationId].executed) return OperationState.Executed;
        (, uint48 executableAt, uint48 expiresAt) = getSchedule(operationId);
        if (block.timestamp < executableAt) return OperationState.Scheduled;
        if (block.timestamp >= expiresAt) return OperationState.Expired;
        return OperationState.Ready;
    }

    /**
     * @dev Minimum delay after which {setDelay} takes effect.
     * Set as default delay if not provided during {onInstall}.
     */
    function minSetback() public view virtual returns (uint32) {
        return 5 days; // Up to ~136 years
    }

    /// @dev Delay for a specific account.
    function getDelay(
        address account
    ) public view virtual returns (uint32 delay, uint32 pendingDelay, uint48 effectTime) {
        return _config[account].delay.getFull();
    }

    /// @dev Expiration delay for account operations.
    function getExpiration(address account) public view virtual returns (uint32 expiration) {
        return _config[account].expiration;
    }

    /// @dev Schedule for an operation. Returns default values if not set (i.e. `uint48(0)`, `uint48(0)`, `uint48(0)`).
    function getSchedule(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata executionCalldata
    ) public view virtual returns (uint48 scheduledAt, uint48 executableAt, uint48 expiresAt) {
        return getSchedule(hashOperation(account, salt, mode, executionCalldata));
    }

    /// @dev Same as {getSchedule} but with the operation id.
    function getSchedule(
        bytes32 operationId
    ) public view virtual returns (uint48 scheduledAt, uint48 executableAt, uint48 expiresAt) {
        scheduledAt = _schedules[operationId].scheduledAt;
        executableAt = scheduledAt + _schedules[operationId].executableAfter;
        return (scheduledAt, executableAt, executableAt + _schedules[operationId].expiresAfter);
    }

    /// @dev Returns the operation id.
    function hashOperation(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata executionCalldata
    ) public view virtual returns (bytes32) {
        return keccak256(abi.encode(account, salt, mode, executionCalldata));
    }

    /// @dev Default expiration for account operations. Set if not provided during {onInstall}.
    function defaultExpiration() public view virtual returns (uint32) {
        return 60 days;
    }

    /**
     * @dev Sets up the module's initial configuration when installed by an account.
     * The account calling this function becomes registered with the module.
     *
     * The `initData` may be `abi.encodePacked(uint32(initialDelay), uint32(initialExpiration))`.
     * The delay will be set to the maximum of this value and the minimum delay if provided.
     * Otherwise, the delay will be set to {minSetback} and {defaultExpiration} respectively.
     *
     * Behaves as a no-op if the module is already installed.
     *
     * Requirements:
     *
     * * The account (i.e `msg.sender`) must implement the {IERC7579ModuleConfig} interface.
     * * `initData` must be empty or decode correctly to `(uint32, uint32)`.
     */
    function onInstall(bytes calldata initData) public virtual {
        if (!_config[msg.sender].installed) {
            _config[msg.sender].installed = true;
            (uint32 initialDelay, uint32 initialExpiration) = _decodeDelayedExecutorInitData(initData);
            // An old delay might be still present
            // So we set 0 for the minimum setback relying on any old value as the minimum delay
            _setDelay(msg.sender, initialDelay, 0);
            _setExpiration(msg.sender, initialExpiration);
        }
    }

    /**
     * @dev Allows an account to update its execution delay (see {getDelay}).
     *
     * The new delay will take effect after a transition period defined by the current delay
     * or {minSetback}, whichever is longer. This prevents immediate security downgrades.
     * Can only be called by the account itself.
     */
    function setDelay(uint32 newDelay) public virtual {
        _setDelay(msg.sender, newDelay, minSetback());
    }

    /// @dev Allows an account to update its execution expiration (see {getExpiration}).
    function setExpiration(uint32 newExpiration) public virtual {
        _setExpiration(msg.sender, newExpiration);
    }

    /**
     * @dev Schedules an operation to be executed after the account's delay period (see {getDelay}).
     * Operations are uniquely identified by the combination of `salt`, `mode`, and `data`.
     * See {_validateSchedule} for authorization checks.
     */
    function schedule(address account, bytes32 salt, bytes32 mode, bytes calldata data) public virtual {
        require(_config[account].installed, ERC7579ExecutorModuleNotInstalled());
        _validateSchedule(account, salt, mode, data);
        (uint32 executableAfter, , ) = getDelay(account);
        _scheduleAt(account, salt, mode, data, Time.timestamp(), executableAfter);
    }

    /**
     * @dev Cancels a previously scheduled operation. Can only be called by the account that
     * scheduled the operation. See {_cancel}.
     */
    function cancel(address account, bytes32 salt, bytes32 mode, bytes calldata data) public virtual {
        _validateCancel(account, salt, mode, data);
        _cancel(account, salt, mode, data); // Prioritize errors thrown in _cancel
    }

    /**
     * @dev Cleans up the {getDelay} and {getExpiration} values by scheduling them to `0`
     * and respecting the previous delay and expiration values.
     *
     * IMPORTANT: This function does not clean up scheduled operations. This means operations
     * could potentially be re-executed if the module is reinstalled later. This is a deliberate
     * design choice for efficiency, but module implementations may want to override this behavior
     * to clear scheduled operations during uninstallation for their specific use cases.
     *
     * NOTE: Calling this function directly will remove the expiration ({getExpiration}) value and
     * will schedule a reset of the delay ({getDelay}) to `0` for the account. Reinstalling the
     * module will not immediately reset the delay if the delay reset hasn't taken effect yet.
     */
    function onUninstall(bytes calldata) public virtual {
        _config[msg.sender].installed = false;
        _setDelay(msg.sender, 0, minSetback()); // Avoids immediate downgrades
        _setExpiration(msg.sender, 0);
    }

    /**
     * @dev Returns `data` as the execution calldata. See {ERC7579Executor-_execute}.
     *
     * NOTE: This function relies on the operation state validation in {_execute} for
     * authorization. Extensions of this module should override this function to implement
     * additional validation logic if needed.
     */
    function _validateExecution(
        address /* account */,
        bytes32 /* salt */,
        bytes32 /* mode */,
        bytes calldata data
    ) internal virtual override returns (bytes calldata) {
        return data;
    }

    /**
     * @dev Validates whether an operation can be canceled.
     *
     * Example extension:
     *
     * ```solidity
     *  function _validateCancel(address account, bytes32 salt, bytes32 mode, bytes calldata data) internal override {
     *    // e.g. require(msg.sender == account);
     *  }
     *```
     */
    function _validateCancel(
        address account,
        bytes32 /* salt */,
        bytes32 /* mode */,
        bytes calldata /* data */
    ) internal virtual;

    /**
     * @dev Validates whether an operation can be scheduled.
     *
     * Example extension:
     *
     * ```solidity
     *  function _validateSchedule(address account, bytes32 salt, bytes32 mode, bytes calldata data) internal override {
     *    // e.g. require(msg.sender == account);
     *  }
     *```
     */
    function _validateSchedule(
        address account,
        bytes32 /* salt */,
        bytes32 /* mode */,
        bytes calldata /* data */
    ) internal virtual;

    /**
     * @dev Internal implementation for setting an account's delay. See {getDelay}.
     *
     * Emits an {ERC7579ExecutorDelayUpdated} event.
     */
    function _setDelay(address account, uint32 newDelay, uint32 minimumSetback) internal virtual {
        uint48 effect;
        (_config[account].delay, effect) = _config[account].delay.withUpdate(newDelay, minimumSetback);
        emit ERC7579ExecutorDelayUpdated(account, newDelay, effect);
    }

    /**
     * @dev Internal implementation for setting an account's expiration. See {getExpiration}.
     *
     * Emits an {ERC7579ExecutorExpirationUpdated} event.
     */
    function _setExpiration(address account, uint32 newExpiration) internal virtual {
        // Safe downcast since both arguments are uint32
        _config[account].expiration = newExpiration;
        emit ERC7579ExecutorExpirationUpdated(account, newExpiration);
    }

    /**
     * @dev Internal version of {schedule} that takes an `account` address to schedule
     * an operation that starts its security window at `at` and expires after `delay`.
     *
     * Requirements:
     *
     * * The operation must be `Unknown`.
     *
     * Emits an {ERC7579ExecutorOperationScheduled} event.
     */
    function _scheduleAt(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata executionCalldata,
        uint48 timepoint,
        uint32 delay
    ) internal virtual returns (bytes32 operationId, Schedule memory schedule_) {
        bytes32 id = hashOperation(account, salt, mode, executionCalldata);
        _validateStateBitmap(id, _encodeStateBitmap(OperationState.Unknown));

        _schedules[id].scheduledAt = timepoint;
        _schedules[id].executableAfter = delay;
        _schedules[id].expiresAfter = getExpiration(account);

        emit ERC7579ExecutorOperationScheduled(account, id, salt, mode, executionCalldata, timepoint + delay);
        return (id, schedule_);
    }

    /**
     * @dev See {ERC7579Executor-_execute}.
     *
     * Requirements:
     *
     * * The operation must be `Ready`.
     */
    function _execute(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata executionCalldata
    ) internal virtual override returns (bytes[] memory returnData) {
        bytes32 id = hashOperation(account, salt, mode, executionCalldata);
        _validateStateBitmap(id, _encodeStateBitmap(OperationState.Ready));

        _schedules[id].executed = true;

        return super._execute(account, salt, mode, executionCalldata);
    }

    /**
     * @dev Internal version of {cancel} that takes an `account` address as an argument.
     *
     * Requirements:
     *
     * * The operation must be `Scheduled` or `Ready`.
     *
     * Canceled operations can't be rescheduled. Emits an {ERC7579ExecutorOperationCanceled} event.
     */
    function _cancel(address account, bytes32 salt, bytes32 mode, bytes calldata executionCalldata) internal virtual {
        bytes32 id = hashOperation(account, salt, mode, executionCalldata);
        bytes32 allowedStates = _encodeStateBitmap(OperationState.Scheduled) | _encodeStateBitmap(OperationState.Ready);
        _validateStateBitmap(id, allowedStates);

        _schedules[id].canceled = true;

        emit ERC7579ExecutorOperationCanceled(account, id);
    }

    /// @dev Decodes the init data into a delay and expiration.
    function _decodeDelayedExecutorInitData(
        bytes calldata initData
    ) internal virtual returns (uint32 delay, uint32 expiration) {
        return
            initData.length > 7
                ? (uint32(bytes4(initData[:4])), uint32(bytes4(initData[4:8])))
                : (minSetback(), defaultExpiration());
    }

    /**
     * @dev Check that the current state of a operation matches the requirements described by the `allowedStates` bitmap.
     * This bitmap should be built using {_encodeStateBitmap}.
     *
     * If requirements are not met, reverts with a {ERC7579ExecutorUnexpectedOperationState} error.
     */
    function _validateStateBitmap(bytes32 operationId, bytes32 allowedStates) internal view returns (OperationState) {
        OperationState currentState = state(operationId);
        require(
            _encodeStateBitmap(currentState) & allowedStates != bytes32(0),
            ERC7579ExecutorUnexpectedOperationState(operationId, currentState, allowedStates)
        );
        return currentState;
    }

    /**
     * @dev Encodes a `OperationState` into a `bytes32` representation where each bit enabled corresponds to
     * the underlying position in the `OperationState` enum. For example:
     *
     * ```
     * 0x000...10000
     *   ^^^^^^------ ...
     *         ^----- Canceled
     *          ^---- Executed
     *           ^--- Ready
     *            ^-- Scheduled
     *             ^- Unknown
     * ```
     */
    function _encodeStateBitmap(OperationState operationState) internal pure returns (bytes32) {
        return bytes32(1 << uint8(operationState));
    }
}
