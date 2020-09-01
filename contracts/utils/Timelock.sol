// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

/**
 * @dev Contract module provide tolling for building timelocked operation.
 *
 * This module is used through inheritance. It will make available the methods
 * `_schedule`, `_execute` and `_cancel`, which can be used to control the
 * lifecycle of timelocked operations identified using bytes32.
 */
abstract contract Timelock {
    mapping(bytes32 => uint256) private _timestamps;
    uint256 private _minDelay;

    /**
     * @dev Emitted when entity `id` is submitted.
     */
    event Scheduled(bytes32 indexed id);

    /**
    * @dev Emitted when entity `id` is revealed.
    */
    event Executed(bytes32 indexed id);

    /**
    * @dev Emitted when entity `id` is canceled.
    */
    event Cancel(bytes32 indexed id);

    /**
    * @dev Emitted when the minimum deplay for future operations is modified.
    */
    event MinDelayChange(uint256 newDuration, uint256 oldDuration);

    /**
     * @dev Initializes the contract with a given `minDelay`.
     */
    constructor(uint256 minDelay) public {
        _minDelay = minDelay;
    }

    /**
     * @dev Returns weither an entity is ready or not.
     */
    function isOperationReady(bytes32 id) public view returns (bool ready) {
        // solhint-disable-next-line not-rely-on-time
        return _timestamps[id] <= block.timestamp;
    }

    /**
     * @dev Returns the timestamp at with an entity becomes valid (0 for
     * unscheduled entity).
     */
    function viewTimestamp(bytes32 id) public view returns (uint256 timestamp) {
        return _timestamps[id];
    }

    /**
     * @dev Returns the minimum delay for a entity to become valid.
     */
    function viewMinDelay() public view returns (uint256 duration) {
        return _minDelay;
    }

    /**
     * @dev Schedule an entity that is to becomes valid after a given delay.
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
     * @dev Execute a ready entity.
     *
     * Emits a {Executed} event.
     */
    function _execute(bytes32 id) internal {
        require(_timestamps[id] != 0, "Timelock: no matching operation");
        require(isOperationReady(id), "Timelock: too early to execute");
        delete _timestamps[id];

        emit Executed(id);
    }

    /**
    * @dev Cancel a entity.
     *
     * Emits a {Cancel} event.
    */
    function _cancel(bytes32 id) internal {
        delete _timestamps[id];

        emit Cancel(id);
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
// 28/08: 3h+2h
// 30/08: 1h
//  1/09: 1h
