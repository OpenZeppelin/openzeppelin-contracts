// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/draft-Timers.sol";

/**
 * @dev TODO
 */
abstract contract Timelock is Timers {
    /**
     * @dev Emitted when a call is scheduled as part of operation `id`.
     */
    event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay);

    /**
     * @dev Emitted when a call is performed as part of operation `id`.
     */
    event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);

    /**
     * @dev Emitted when operation `id` is cancelled.
     */
    event Cancelled(bytes32 indexed id);

    /**
     * @dev Override modifier to customize revert reason
     */
    modifier onlyActiveTimer(bytes32 id) virtual override {
        require(_isTimerActive(id), "Timelock: operation not scheduled yet");
        _;
    }

    /**
     * @dev Override modifier to customize revert reason
     */
    modifier onlyBeforeTimer(bytes32 id) virtual override {
        require(_isTimerBefore(id), "Timelock: operation already scheduled");
        _;
    }

    /**
     * @dev Returns whether an id correspond to a registered operation. This
     * includes both Pending, Ready and Done operations.
     */
    function isOperation(bytes32 id) public view virtual returns (bool pending) {
        return !_isTimerBefore(id);
    }

    /**
     * @dev Returns whether an operation is pending or not.
     */
    function isOperationPending(bytes32 id) public view virtual returns (bool pending) {
        return _isTimerDuring(id);
    }

    /**
     * @dev Returns whether an operation is ready or not.
     */
    function isOperationReady(bytes32 id) public view virtual returns (bool ready) {
        return _isTimerAfter(id);
    }

    /**
     * @dev Returns whether an operation is done or not.
     */
    function isOperationDone(bytes32 id) public view virtual returns (bool done) {
        return _isTimerLocked(id);
    }

    /**
     * @dev Returns the timestamp at with an operation becomes ready (0 for
     * unset operations, 1 for done operations).
     */
    function getTimestamp(bytes32 id) public view virtual returns (uint256 timestamp) {
        return _getDeadline(id);
    }

    /**
     * @dev Returns the identifier of an operation containing a single
     * transaction.
     */
    function _hashOperation(address target, uint256 value, bytes memory data, bytes32 predecessor, bytes32 salt) internal pure returns (bytes32 hash) {
        return keccak256(abi.encode(target, value, data, predecessor, salt));
    }

    /**
     * @dev Returns the identifier of an operation containing a batch of
     * transactions.
     */
    function _hashOperationBatch(address[] memory targets, uint256[] memory values, bytes[] memory datas, bytes32 predecessor, bytes32 salt) internal pure returns (bytes32 hash) {
        return keccak256(abi.encode(targets, values, datas, predecessor, salt));
    }

    /**
     * @dev Schedule an operation containing a single transaction.
     *
     * Emits a {CallScheduled} event.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function _schedule(address target, uint256 value, bytes memory data, bytes32 predecessor, bytes32 salt, uint256 delay) internal virtual {
        bytes32 id = _hashOperation(target, value, data, predecessor, salt);
        _startTimer(id, delay);
        emit CallScheduled(id, 0, target, value, data, predecessor, delay);
    }

    /**
     * @dev Schedule an operation containing a batch of transactions.
     *
     * Emits one {CallScheduled} event per transaction in the batch.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function _scheduleBatch(address[] memory targets, uint256[] memory values, bytes[] memory datas, bytes32 predecessor, bytes32 salt, uint256 delay) internal virtual {
        require(targets.length == values.length, "Timelock: length mismatch");
        require(targets.length == datas.length, "Timelock: length mismatch");

        bytes32 id = _hashOperationBatch(targets, values, datas, predecessor, salt);
        _startTimer(id, delay);
        for (uint256 i = 0; i < targets.length; ++i) {
            emit CallScheduled(id, i, targets[i], values[i], datas[i], predecessor, delay);
        }
    }

    /**
     * @dev Cancel an operation.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function _cancel(bytes32 id) internal virtual {
        _resetTimer(id);
        emit Cancelled(id);
    }

    /**
     * @dev Execute an (ready) operation containing a single transaction.
     *
     * Emits a {CallExecuted} event.
     *
     * Requirements:
     *
     * - the caller must have the 'executor' role.
     */
    function _execute(address target, uint256 value, bytes memory data, bytes32 predecessor, bytes32 salt) internal virtual {
        bytes32 id = _hashOperation(target, value, data, predecessor, salt);
        _beforeCall(predecessor);
        _call(id, 0, target, value, data);
        _afterCall(id);
    }

    /**
     * @dev Execute an (ready) operation containing a batch of transactions.
     *
     * Emits one {CallExecuted} event per transaction in the batch.
     *
     * Requirements:
     *
     * - the caller must have the 'executor' role.
     */
    function _executeBatch(address[] memory targets, uint256[] memory values, bytes[] memory datas, bytes32 predecessor, bytes32 salt) internal virtual {
        require(targets.length == values.length, "Timelock: length mismatch");
        require(targets.length == datas.length, "Timelock: length mismatch");

        bytes32 id = _hashOperationBatch(targets, values, datas, predecessor, salt);
        _beforeCall(predecessor);
        _callBatch(id, targets, values, datas);
        _afterCall(id);
    }

    /**
     * @dev Checks before execution of an operation's calls.
     */
    function _beforeCall(bytes32 predecessor) internal view virtual {
        require(predecessor == bytes32(0) || isOperationDone(predecessor), "Timelock: missing dependency");
    }

    /**
     * @dev Checks after execution of an operation's calls.
     */
    function _afterCall(bytes32 id) internal virtual {
        require(isOperationReady(id), "Timelock: operation is not ready");
        _resetTimer(id);
        _lockTimer(id);
    }

    /**
     * @dev Execute an operation's call.
     *
     * Emits a {CallExecuted} event.
     */
    function _call(bytes32 id, uint256 index, address target, uint256 value, bytes memory data) internal virtual {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = target.call{value: value}(data);
        require(success, "Timelock: underlying transaction reverted");

        emit CallExecuted(id, index, target, value, data);
    }

    /**
     * @dev Execute a batch of calls.
     *
     * Emits a {CallExecuted} event per call.
     */
    function _callBatch(bytes32 id, address[] memory targets, uint256[] memory values, bytes[] memory datas) internal virtual {
        for (uint256 i = 0; i < targets.length; ++i) {
            _call(id, i, targets[i], values[i], datas[i]);
        }
    }
}
