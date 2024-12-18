// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import patched contract version
import {AccessControlDefaultAdminRules} from "../patched/access/extensions/AccessControlDefaultAdminRules.sol";

contract AccessControlDefaultAdminRulesHarness is AccessControlDefaultAdminRules {
    uint48 private _delayIncreaseWait;

    constructor(
        uint48 initialDelay,
        address initialDefaultAdmin,
        uint48 delayIncreaseWait
    ) AccessControlDefaultAdminRules(initialDelay, initialDefaultAdmin) {
        _delayIncreaseWait = delayIncreaseWait;
    }

    // Formal Verification (FV) Helpers

    /// @notice Get the pending default admin address
    function pendingDefaultAdmin_() external view returns (address) {
        (address newAdmin, ) = pendingDefaultAdmin();
        return newAdmin;
    }

    /// @notice Get the schedule for the pending default admin
    function pendingDefaultAdminSchedule_() external view returns (uint48) {
        (, uint48 schedule) = pendingDefaultAdmin();
        return schedule;
    }

    /// @notice Get the pending delay
    function pendingDelay_() external view returns (uint48) {
        (uint48 newDelay, ) = pendingDefaultAdminDelay();
        return newDelay;
    }

    /// @notice Get the schedule for the pending delay
    function pendingDelaySchedule_() external view returns (uint48) {
        (, uint48 schedule) = pendingDefaultAdminDelay();
        return schedule;
    }

    /// @notice Get the wait time for changing delay
    /// @param newDelay The proposed new delay
    function delayChangeWait_(uint48 newDelay) external view returns (uint48) {
        return _delayChangeWait(newDelay);
    }

    // Overrides

    /// @notice Returns the configured wait time for default admin delay increases
    function defaultAdminDelayIncreaseWait() public view override returns (uint48) {
        return _delayIncreaseWait;
    }
}
