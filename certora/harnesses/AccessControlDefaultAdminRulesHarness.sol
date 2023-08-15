// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

    // FV
    function pendingDefaultAdmin_() external view returns (address) {
        (address newAdmin, ) = pendingDefaultAdmin();
        return newAdmin;
    }

    function pendingDefaultAdminSchedule_() external view returns (uint48) {
        (, uint48 schedule) = pendingDefaultAdmin();
        return schedule;
    }

    function pendingDelay_() external view returns (uint48) {
        (uint48 newDelay, ) = pendingDefaultAdminDelay();
        return newDelay;
    }

    function pendingDelaySchedule_() external view returns (uint48) {
        (, uint48 schedule) = pendingDefaultAdminDelay();
        return schedule;
    }

    function delayChangeWait_(uint48 newDelay) external view returns (uint48) {
        return _delayChangeWait(newDelay);
    }

    // Overrides
    function defaultAdminDelayIncreaseWait() public view override returns (uint48) {
        return _delayIncreaseWait;
    }
}
