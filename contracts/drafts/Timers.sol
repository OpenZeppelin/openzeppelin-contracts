// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../math/SafeMath.sol";

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
    using SafeMath for uint256;

    mapping(bytes32 => uint256) private _deadlines;

    event TimerStarted(bytes32 indexed timer, uint256 deadline);
    event TimerStopped(bytes32 indexed timer);
    event TimerReset(bytes32 indexed timer);

    modifier onlyBeforeTimer(bytes32 id) {
        require(_beforeTimer(id), "WithTimers: onlyBeforeTimer");
        _;
    }

    modifier onlyDuringTimer(bytes32 id) {
        require(_duringTimer(id), "WithTimers: onlyDuringTimer");
        _;
    }

    modifier onlyAfterTimer(bytes32 id) {
        require(_afterTimer(id), "WithTimers: onlyAfterTimer");
        _;
    }

    function _getDeadline(bytes32 id) internal view returns (uint256) {
        return _deadlines[id];
    }

    function _beforeTimer(bytes32 id) internal view returns (bool) {
        return _getDeadline(id) == 0;
    }

    function _duringTimer(bytes32 id) internal view returns (bool) {
        uint256 deadline = _getDeadline(id);
        // solhint-disable-next-line not-rely-on-time
        return deadline != 0 && deadline > block.timestamp;
    }

    function _afterTimer(bytes32 id) internal view returns (bool) {
        uint256 deadline = _getDeadline(id);
        // solhint-disable-next-line not-rely-on-time
        return deadline != 0 && deadline <= block.timestamp;
    }

    function _startTimer(bytes32 id, uint256 delay) internal virtual onlyBeforeTimer(id) {
        // solhint-disable-next-line not-rely-on-time
        uint256 deadline = block.timestamp.add(delay);

        _beforeTimer(id, deadline);

        _deadlines[id] = deadline;
        emit TimerStarted(id, deadline);
    }

    function _stopTimer(bytes32 id) internal virtual onlyDuringTimer(id) {
        _afterTimer(id, false);

        delete _deadlines[id];
        emit TimerStopped(id);
    }

    function _resetTimer(bytes32 id) internal virtual onlyAfterTimer(id) {
        _afterTimer(id, true);

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
    function _afterTimer(bytes32 id, bool success) internal virtual { }
}
