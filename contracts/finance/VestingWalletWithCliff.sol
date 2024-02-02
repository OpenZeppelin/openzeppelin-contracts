// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {VestingWallet} from "./VestingWallet.sol";

/**
 * @dev Extension of {VestingWallet} that adds a cliff to the vesting schedule.
 */
contract VestingWalletWithCliff is VestingWallet {
    uint64 private immutable _cliff;

    error InvalidCliffDuration(uint64 cliffSeconds, uint64 durationSeconds);

    /**
     * @dev Sets the sender as the initial owner, the beneficiary as the pending owner, the start timestamp, the
     * vesting duration and the duration of the cliff of the vesting wallet.
     */
    constructor(
        address beneficiary,
        uint64 startTimestamp,
        uint64 durationSeconds,
        uint64 cliffSeconds
    ) VestingWallet(beneficiary, startTimestamp, durationSeconds) {
        if (cliffSeconds > durationSeconds) {
            revert InvalidCliffDuration(cliffSeconds, durationSeconds);
        }
        _cliff = startTimestamp + cliffSeconds;
    }

    /**
     * @dev Getter for the cliff timestamp.
     */
    function cliff() public view virtual returns (uint256) {
        return _cliff;
    }

    /**
     * @dev Virtual implementation of the vesting formula. This returns the amount vested, as a function of time, for
     * an asset given its total historical allocation.
     */
    function _vestingSchedule(
        uint256 totalAllocation,
        uint64 timestamp
    ) internal view virtual override returns (uint256) {
        return timestamp < cliff() ? 0 : super._vestingSchedule(totalAllocation, timestamp);
    }
}
