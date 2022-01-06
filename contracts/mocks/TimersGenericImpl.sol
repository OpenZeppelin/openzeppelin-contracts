// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Timers.sol";

contract TimersGenericImpl {
    using Timers for Timers.Generic;

    Timers.Generic private _timer;

    function getDeadline() public view returns (uint64) {
        return _timer.getDeadline();
    }

    function setDeadline(uint64 generic) public {
        _timer.setDeadline(generic, Timers.Type.TIMESTAMP);
    }

    function reset() public {
        _timer.reset();
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
