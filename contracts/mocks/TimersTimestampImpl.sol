// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Timers.sol";

contract TimersTimestampImpl {
    using Timers for uint64;
    using Timers for Timers.Timestamp;

    Timers.Timestamp private _timer;

    function getDeadline() public view returns (uint64) {
        return _timer.toUint64();
    }

    function setDeadline(uint64 timestamp) public {
        _timer = timestamp.toTimestamp();
    }

    function reset() public {
        _timer = uint64(0).toTimestamp();
    }

    function isUnset() public view returns (bool) {
        return _timer.isUnset();
    }

    function isStarted() public view returns (bool) {
        return _timer.isStarted();
    }

    function isPending() public view returns (bool) {
        return _timer.isPending();
    }

    function isExpired() public view returns (bool) {
        return _timer.isExpired();
    }
}
