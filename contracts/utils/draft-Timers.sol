// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Tooling for timming delays
 *
 * Provides a mechanism to start, stop, and reset timmers. Timmers are
 * identified through bytes32 identifiers.
 *
 * Timmers operation are triggered using the `_startTimer`, `_stopTimer` and
 * `_resetTimer` internal functions. Timmers status can be checked using the
 * `_beforeTimer`, `_duringTimer` and `_afterTimer`. Function modifier are
 * also available.
 *
 * Timmer's deadline are available in the event data. It is also accessible
 * through the internal `_getDeadline` function. It is up to each devired
 * contract to publicly expose this data or not.
 */
abstract contract Timers {
    uint256 internal constant _DONE_TIMESTAMP = uint256(1);
    mapping(bytes32 => uint256) private _deadlines;

    event TimerStarted(bytes32 indexed timer, uint256 deadline);
    event TimerStopped(bytes32 indexed timer);
    event TimerReset(bytes32 indexed timer);
    event TimerLocked(bytes32 indexed timer);

    modifier onlyActiveTimer(bytes32 id) virtual {
        require(_isTimerActive(id), "Timers: onlyActiveTimer");
        _;
    }

    modifier onlyLockedTimer(bytes32 id) virtual {
        require(_isTimerLocked(id), "Timers: onlyLockedTimer");
        _;
    }

    modifier onlyBeforeTimer(bytes32 id) virtual {
        require(_isTimerBefore(id), "Timers: onlyBeforeTimer");
        _;
    }

    modifier onlyDuringTimer(bytes32 id) virtual {
        require(_isTimerDuring(id), "Timers: onlyDuringTimer");
        _;
    }

    modifier onlyAfterTimer(bytes32 id) virtual {
        require(_isTimerAfter(id), "Timers: onlyAfterTimer");
        _;
    }

    function _getDeadline(bytes32 id) internal view returns (uint256) {
        return _deadlines[id];
    }

    function _isTimerActive(bytes32 id) internal view returns (bool) {
        return _getDeadline(id) > _DONE_TIMESTAMP;
    }

    function _isTimerLocked(bytes32 id) internal view returns (bool) {
        return _getDeadline(id) == _DONE_TIMESTAMP;
    }

    function _isTimerBefore(bytes32 id) internal view returns (bool) {
        return _getDeadline(id) == 0;
    }

    function _isTimerDuring(bytes32 id) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return _isTimerActive(id) && _getDeadline(id) > block.timestamp;
    }

    function _isTimerAfter(bytes32 id) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return _isTimerActive(id) && _getDeadline(id) <= block.timestamp;
    }

    function _startTimer(bytes32 id, uint256 delay) internal virtual onlyBeforeTimer(id) {
        // solhint-disable-next-line not-rely-on-time
        uint256 deadline = block.timestamp + delay;

        _beforeTimer(id, deadline);

        _deadlines[id] = deadline;
        emit TimerStarted(id, deadline);
    }

    function _lockTimer(bytes32 id) internal virtual onlyBeforeTimer(id) {
        _deadlines[id] = _DONE_TIMESTAMP;
        emit TimerLocked(id);
    }

    function _resetTimer(bytes32 id) internal virtual onlyActiveTimer(id) {
        _afterTimer(id);

        delete _deadlines[id];
        emit TimerReset(id);
    }

    /**
     * @dev Hook that is called when a timmer starts.
     *
     * Parameters:
     *
     * - id: the timmer identifier
     * - deadline: (futur) timestamp at which the timer stops
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTimer(bytes32 id, uint256 deadline) internal virtual { }

    /**
     * @dev Hook that is called when a timmer is reset.
     *
     * Parameters:
     *
     * - id: the timmer identifier
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTimer(bytes32 id) internal virtual { }
}
