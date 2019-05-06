pragma solidity ^0.5.0;

import "../lifecycle/TimeFrame.sol";


contract TimeFrameMock {
    using TimeFrame for TimeFrame.Epoch;

    TimeFrame.Epoch private _epoch;

    constructor(uint256 start, uint256 end) public {
        _epoch = TimeFrame.create(start, end);
    }

    function hasStarted() external view returns (bool) {
        return _epoch.hasStarted();
    }

    function isActive() external view returns (bool) {
        return _epoch.isActive();
    }

    function hasEnded() external view returns (bool) {
        return _epoch.hasEnded();
    }

    function timeUntilStart() external view returns (uint256) {
        return _epoch.timeUntilStart();
    }

    function elapsedSinceStart() external view returns (uint256) {
        return _epoch.elapsedSinceStart();
    }

    function timeUntilEnd() external view returns (uint256) {
        return _epoch.timeUntilEnd();
    }

    function elapsedSinceEnd() external view returns (uint256) {
        return _epoch.elapsedSinceEnd();
    }

    function length() external view returns (uint256) {
        return _epoch.length();
    }

    function terminate() public {
        _epoch.terminate();
    }
}
