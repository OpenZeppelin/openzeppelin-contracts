// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.6.0) (finance/VestingWallet.sol)

pragma solidity ^0.8.20;

struct VestingSchedule {
    address beneficiary;
    address token;
    uint64  start;
    uint64  duration;
    uint256 totalAllocation;
    uint256 released;
}

mapping(uint256 scheduleId => VestingSchedule) private _schedules;
uint256 private _scheduleCount;