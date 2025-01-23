// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimelockController} from "../patched/governance/TimelockController.sol";

contract TimelockControllerHarness is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
