// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../patched/access/AccessControlDefaultAdminRules.sol";

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
    function _pendingDefaultAdmin() external view returns (address) {
        (address newAdmin, ) = pendingDefaultAdmin();
        return newAdmin;
    }

    function _pendingDefaultAdminSchedule() external view returns (uint48) {
        (, uint48 schedule) = pendingDefaultAdmin();
        return schedule;
    }

    function _pendingDelay() external view returns (uint48) {
        (uint48 newDelay, ) = pendingDefaultAdminDelay();
        return newDelay;
    }

    function _pendingDelaySchedule() external view returns (uint48) {
        (, uint48 schedule) = pendingDefaultAdminDelay();
        return schedule;
    }

    function delayChangeWait(uint48 newDelay) external view returns (uint48) {
        return _delayChangeWait(newDelay);
    }

    // Overrides
    function defaultAdminDelayIncreaseWait() public view override returns (uint48) {
        return _delayIncreaseWait;
    }
}
