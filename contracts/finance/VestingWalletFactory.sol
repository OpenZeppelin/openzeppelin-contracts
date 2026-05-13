// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.6.0) (finance/VestingWallet.sol)

pragma solidity ^0.8.20;

import {IERC20} from "../token/ERC20/IERC20.sol";
import {SafeERC20} from "../token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "../access/Ownable.sol";

contract VestingWalletFactory is Ownable {
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

    constructor(address owner) Ownable(owner) {}

    event VestingScheduleCreated(uint256 indexed scheduleId, address indexed beneficiary, address indexed token, uint64 start, uint64 duration, uint256 amount);
    event ERC20Released(uint256 indexed scheduleId, address indexed token, uint256 amount);

    function createVestingSchedule(
        address beneficiary,
        address token,
        uint64 startTimestamp,
        uint64 durationSeconds,
        uint256 amount
    ) external onlyOwner returns (uint256 scheduleId) {
        require(beneficiary != address(0), "VestingWalletFactory: beneficiary is zero address");
        require(amount > 0, "VestingWalletFactory: amount is zero");
        require(durationSeconds > 0, "VestingWalletFactory: duration is zero");

        scheduleId = _scheduleCount;

        _schedules[scheduleId] = VestingSchedule({
            beneficiary: beneficiary,
            token: token,
            start: startTimestamp,
            duration: durationSeconds,
            totalAllocation: amount,
            released: 0
        });

        _scheduleCount++;

        SafeERC20.safeTransferFrom(IERC20(token), msg.sender, address(this), amount);

        emit VestingScheduleCreated(scheduleId, beneficiary, token, startTimestamp, durationSeconds, amount);
    }

    function _vestingSchedule(uint256 totalAllocation, uint64 start, uint64 duration, uint64 timestamp) internal pure virtual returns (uint256) {
        uint64 end = start + duration;
        if (timestamp < start) {
            return 0;
        }
        else if (timestamp >= end) {
            return totalAllocation;
        }
        else {
            return (totalAllocation * (timestamp - start)) / duration;
        }
    }
}