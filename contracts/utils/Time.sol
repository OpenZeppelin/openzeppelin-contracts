// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Tooling for timepoints, timers and delays
 */
library Time {
    enum ReservedTimestamps {
        Unset,  // 0
        Locked, // 1
        length
    }

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
        timer._deadline = uint256(ReservedTimestamps.Unset);
    }

    function lock(Timer storage timer) internal {
        timer._deadline = uint256(ReservedTimestamps.Locked);
    }

    function isUnset(Timer memory timer) internal pure returns (bool) {
        return timer._deadline == uint256(ReservedTimestamps.Unset);
    }

    function isLocked(Timer memory timer) internal pure returns (bool) {
        return timer._deadline == uint256(ReservedTimestamps.Locked);
    }

    function isStarted(Timer memory timer) internal pure returns (bool) {
        return timer._deadline >= uint256(ReservedTimestamps.length);
    }

    function isPending(Timer memory timer) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return timer._deadline > block.timestamp;
    }

    function isExpired(Timer memory timer) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return uint256(ReservedTimestamps.length) <= timer._deadline && timer._deadline <= block.timestamp;
    }
}
