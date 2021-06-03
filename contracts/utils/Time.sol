// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Tooling for timepoints, timers and delays
 */
library Time {
    struct Timer {
        uint256 _deadline;
    }

    function getDeadline(Timer memory timer) internal pure returns (uint256) {
        return timer._deadline;
    }

    function setDeadline(Timer storage timer, uint256 timestamp) internal {
        timer._deadline = timestamp;
    }

    function reset(Timer storage timer) internal {
        timer._deadline = 0;
    }

    function isUnset(Timer memory timer) internal pure returns (bool) {
        return timer._deadline == 0;
    }

    function isStarted(Timer memory timer) internal pure returns (bool) {
        return timer._deadline > 0;
    }

    function isPending(Timer memory timer) internal view returns (bool) {
        return timer._deadline > block.timestamp;
    }

    function isExpired(Timer memory timer) internal view returns (bool) {
        return isStarted(timer) && timer._deadline <= block.timestamp;
    }
}
