// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.6.0) (finance/VestingWallet.sol)

pragma solidity ^0.8.20;

contract VestingWalletFactory {
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

    event VestingScheduleCreated(uint256 indexed scheduleId, address indexed beneficiary, address indexed token, uint64 start, uint64 duration, uint256 amount);
    event ERC20Released(uint256 indexed scheduleId, address indexed token, uint256 amount);
}