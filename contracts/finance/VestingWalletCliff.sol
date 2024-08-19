// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {SafeCast} from "../utils/math/SafeCast.sol";
import {VestingWallet} from "./VestingWallet.sol";

/**
 * @dev Extension of {VestingWallet} that adds a cliff to the vesting schedule.
 */
abstract contract VestingWalletCliff is VestingWallet {
    using SafeCast for *;

    uint64 private immutable _cliff;

    /// @dev The specified cliff duration is larger than the vesting duration.
    error InvalidCliffDuration(uint64 cliffSeconds, uint64 durationSeconds);

    /**
     * @dev Sets the sender as the initial owner, the beneficiary as the pending owner, the start timestamp, the
     * vesting duration and the duration of the cliff of the vesting wallet.
     */
    constructor(uint64 cliffSeconds) {
        if (cliffSeconds > duration()) {
            revert InvalidCliffDuration(cliffSeconds, duration().toUint64());
        }
        _cliff = start().toUint64() + cliffSeconds;
    }

    /**
     * @dev Getter for the cliff timestamp.
     */
    function cliff() public view virtual returns (uint256) {
        return _cliff;
    }

    /**
     * @dev Virtual implementation of the vesting formula. This returns the amount vested, as a function of time, for
     * an asset given its total historical allocation. Returns 0 if the {cliff} timestamp is not met.
     *
     * IMPORTANT: The cliff not only makes the schedule return 0, but it also ignores every possible side
     * effect from calling the inherited implementation (i.e. `super._vestingSchedule`). Carefully consider
     * this caveat if the overridden implementation of this function has any (e.g. writing to memory or reverting).
     */
    function _vestingSchedule(
        uint256 totalAllocation,
        uint64 timestamp
    ) internal view virtual override returns (uint256) {
        return timestamp < cliff() ? 0 : super._vestingSchedule(totalAllocation, timestamp);
    }
}
