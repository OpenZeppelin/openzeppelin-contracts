// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Time.sol";

contract TimeImpl {
    using Time for Time.Timer;

    Time.Timer private _timer;

    function getDeadline() public view returns (uint256) {
        return _timer.getDeadline();
    }

    function setDeadline(uint256 timestamp) public {
        _timer.setDeadline(timestamp);
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
