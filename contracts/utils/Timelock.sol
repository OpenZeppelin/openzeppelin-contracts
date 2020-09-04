// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

/**
 * @dev Contract module provide tolling for building timelocked operation.
 *
 * This module is used through inheritance. It will make available the methods
 * {_schedule}, {_execute} and {_cancel}, which can be used to control the
 * lifecycle of timelocked operations identified using `bytes32`.
 */
abstract contract Timelock {
    uint256 constant internal _DONE_TIMESTAMP = uint256(1);

    mapping(bytes32 => uint256) private _timestamps;
    uint256 private _minDelay;

    /**
     * @dev Emitted when operation `id` is submitted.
     */
    event Scheduled(bytes32 indexed id);

    /**
     * @dev Emitted when operation `id` is revealed.
     */
    event Executed(bytes32 indexed id);

    /**
     * @dev Emitted when operation `id` is canceled.
     */
    event Canceled(bytes32 indexed id);

    /**
     * @dev Emitted when the minimum delay for future operations is modified.
     */
    event MinDelayChange(uint256 newDuration, uint256 oldDuration);

    /**
     * @dev Initializes the contract with a given `minDelay`.
     */
    constructor(uint256 minDelay) public {
        _minDelay = minDelay;
    }

    /**
     * @dev Returns weither an operation is pending or not.
     */
    function isOperationPending(bytes32 id) public view returns (bool pending) {
        return _timestamps[id] > _DONE_TIMESTAMP;
    }

    /**
     * @dev Returns weither an operation is ready or not.
     */
    function isOperationReady(bytes32 id) public view returns (bool ready) {
        // solhint-disable-next-line not-rely-on-time
        return _timestamps[id] > _DONE_TIMESTAMP && _timestamps[id] <= block.timestamp;
    }

    /**
     * @dev Returns weither an operation is done or not.
     */
    function isOperationDone(bytes32 id) public view returns (bool done) {
        return _timestamps[id] == _DONE_TIMESTAMP;
    }

    /**
     * @dev Returns the timestamp at with an operation becomes valid (0 for
     * unscheduled operation).
     */
    function viewTimestamp(bytes32 id) public view returns (uint256 timestamp) {
        return _timestamps[id];
    }

    /**
     * @dev Returns the minimum delay for a operation to become valid.
     */
    function viewMinDelay() public view returns (uint256 duration) {
        return _minDelay;
    }

    /**
     * @dev Schedule an operation that is to becomes valid after a given delay.
     *
     * Emits a {Scheduled} event.
     */
    function _schedule(bytes32 id, uint256 delay) internal {
        require(_timestamps[id] == 0, "Timelock: operation already scheduled");
        require(delay >= _minDelay, "Timelock: insufficient delay");
        // solhint-disable-next-line not-rely-on-time
        _timestamps[id] = block.timestamp + delay;

        emit Scheduled(id);
    }

    /**
     * @dev Execute an operation. Operation must be ready.
     *
     * Emits a {Executed} event.
     */
    function _execute(bytes32 id, bytes32 predecessor) internal {
        require(isOperationReady(id), "Timelock: operation is not ready");
        require(predecessor == bytes32(0) || isOperationDone(predecessor), "Timelock: missing dependency");
        _timestamps[id] = _DONE_TIMESTAMP;

        emit Executed(id);
    }

    /**
     * @dev Cancel an operation.
     *
     * Emits a {Canceled} event.
     */
    function _cancel(bytes32 id) internal {
        require(!isOperationDone(id), "Timelock: operation is already executed");
        delete _timestamps[id];

        emit Canceled(id);
    }

    /**
     * @dev Changes the timelock duration for future operations.
     *
     * Emits a {MinDelayChange} event.
     */
    function _updateDelay(uint256 newDelay) internal {
        emit MinDelayChange(newDelay, _minDelay);
        _minDelay = newDelay;
    }
}

// Time tracking
// 28/08: 5h (5h)
// 30/08: 1h (6h)
//  1/09: 2h (8h)
//  2/09: 1h (9h)
//  3/09: 1h (10h)
