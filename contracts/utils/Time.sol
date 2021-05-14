// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Tooling for timepoints, timers and delays
 */
library Time {
    uint256 internal constant _DONE_TIMESTAMP = uint256(1);

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

    function lock(Timer storage timer) internal {
        timer._deadline = _DONE_TIMESTAMP;
    }

    function isActive(Timer memory timer) internal pure returns (bool) {
        return timer._deadline > _DONE_TIMESTAMP;
    }

    function isLocked(Timer memory timer) internal pure returns (bool) {
        return timer._deadline == _DONE_TIMESTAMP;
    }

    function isBefore(Timer memory timer) internal pure returns (bool) {
        return timer._deadline == 0;
    }

    function isDuring(Timer memory timer) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return timer._deadline > block.timestamp;
    }

    function isAfter(Timer memory timer) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return _DONE_TIMESTAMP < timer._deadline && timer._deadline <= block.timestamp;
    }
}
