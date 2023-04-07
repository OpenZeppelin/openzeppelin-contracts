// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../patched/access/AccessControlDefaultAdminRules.sol";

contract AccessControlDefaultAdminRulesHarness is AccessControlDefaultAdminRules {
    constructor(
        uint48 initialDelay,
        address initialDefaultAdmin
    ) AccessControlDefaultAdminRules(initialDelay, initialDefaultAdmin) {}
}
