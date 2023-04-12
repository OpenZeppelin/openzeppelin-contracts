// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../patched/access/AccessControlDefaultAdminRules.sol";

contract AccessControlDefaultAdminRulesHarness is AccessControlDefaultAdminRules {
    constructor(
        uint48 initialDelay,
        address initialDefaultAdmin
    ) AccessControlDefaultAdminRules(initialDelay, initialDefaultAdmin) {}

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
}
