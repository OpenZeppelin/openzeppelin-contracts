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
        require(_activeTimer(id), "Timers: onlyActiveTimer");
        _;
    }

    modifier onlyLockedTimer(bytes32 id) virtual {
        require(_lockedTimer(id), "Timers: onlyLockedTimer");
        _;
    }

    modifier onlyBeforeTimer(bytes32 id) virtual {
        require(_beforeTimer(id), "Timers: onlyBeforeTimer");
        _;
    }

    modifier onlyDuringTimer(bytes32 id) virtual {
        require(_duringTimer(id), "Timers: onlyDuringTimer");
        _;
    }

    modifier onlyAfterTimer(bytes32 id) virtual {
        require(_afterTimer(id), "Timers: onlyAfterTimer");
        _;
    }

    function _getDeadline(bytes32 id) internal view returns (uint256) {
        return _deadlines[id];
    }

    function _activeTimer(bytes32 id) internal view returns (bool) {
        return _getDeadline(id) > _DONE_TIMESTAMP;
    }

    function _lockedTimer(bytes32 id) internal view returns (bool) {
        return _getDeadline(id) == _DONE_TIMESTAMP;
    }

    function _beforeTimer(bytes32 id) internal view returns (bool) {
        return _getDeadline(id) == 0;
    }

    function _duringTimer(bytes32 id) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return _activeTimer(id) && _getDeadline(id) > block.timestamp;
    }

    function _afterTimer(bytes32 id) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return _activeTimer(id) && _getDeadline(id) <= block.timestamp;
    }

    function _startTimer(bytes32 id, uint256 delay) internal virtual onlyBeforeTimer(id) {
        // solhint-disable-next-line not-rely-on-time
        uint256 deadline = block.timestamp + delay;

        _beforeTimerHook(id, deadline);

        _deadlines[id] = deadline;
        emit TimerStarted(id, deadline);
    }

    function _lockTimer(bytes32 id) internal virtual onlyBeforeTimer(id) {
        _deadlines[id] = _DONE_TIMESTAMP;
        emit TimerLocked(id);
    }

    function _resetTimer(bytes32 id) internal virtual onlyActiveTimer(id) {
        _afterTimerHook(id, _afterTimer(id));

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
    function _beforeTimerHook(bytes32 id, uint256 deadline) internal virtual { }

    /**
     * @dev Hook that is called when a timmer stops or is reset.
     *
     * Parameters:
     *
     * - id: the timmer identifier
     * - success: indication weither the timer was still running (stop) or if
     *   it had reached its deadline (reset)
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTimerHook(bytes32 id, bool success) internal virtual { }
}
