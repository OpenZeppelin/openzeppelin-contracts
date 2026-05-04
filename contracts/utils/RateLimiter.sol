// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Math} from "./math/Math.sol";
import {SafeCast} from "./math/SafeCast.sol";
import {Checkpoints} from "./structs/Checkpoints.sol";
import {Time} from "./types/Time.sol";

/**
 * @dev This library provides primitives for limiting the rate at which an action can be performed.
 *
 * Two complementary strategies are available, each represented by a storage struct that the consumer keeps in its
 * own storage:
 *
 * - {RefillingBucket}: a token bucket that refills linearly over time. Suitable when the protected resource is
 *   expected to regenerate continuously and short bursts up to the bucket capacity are acceptable. Storage cost is
 *   constant regardless of consumption history.
 *
 * - {SlidingWindow}: a moving-window counter that caps the cumulative consumption over any `window`-second
 *   interval. Suitable when a strict cap on usage within a rolling window is required. Each successful consumption
 *   appends a checkpoint, making it a most expensive option with a larger storage footprint.
 *
 * Both strategies expose the same set of operations ({state}, {used}, {available}, {tryConsume}, {consume} and
 * {updateSettings}), distinguished by the storage struct passed as the first argument.
 *
 * Example usage:
 *
 * ```solidity
 * using RateLimiter for RateLimiter.RefillingBucket;
 *
 * mapping(address user => RateLimiter.RefillingBucket) private _withdrawLimits;
 *
 * function withdraw(uint256 amount) external {
 *     _withdrawLimits[msg.sender].consume(amount);
 *     // ...
 * }
 * ```
 */
library RateLimiter {
    using Checkpoints for Checkpoints.Trace208;

    /**
     * @dev The requested quantity exceeds the currently available capacity.
     */
    error RateLimitExceeded();

    // ================================================ RefillingBucket ================================================
    /**
     * @dev A token bucket that refills linearly over time.
     *
     * The bucket has a maximum `capacity` and refills at a rate of `capacity / window` per second, so that an empty
     * bucket fully refills in `window` seconds. The current state is reconstructed lazily from `lastUsed` and
     * `lastTimepoint` on read, keeping storage cost constant (2 packed slots).
     */
    struct RefillingBucket {
        uint208 capacity;
        uint48 window;
        uint208 lastUsed;
        uint48 lastTimepoint;
    }

    /**
     * @dev Returns the current `used` and `available` quantities for a {RefillingBucket}, accounting for the
     * time-based refill that has accrued since the last update.
     */
    function state(RefillingBucket storage self) internal view returns (uint256 used_, uint256 available_) {
        uint208 cacheCapacity = self.capacity;
        uint48 cacheWindow = self.window;
        uint208 cacheLastUsed = self.lastUsed;
        uint48 cacheLastTimepoint = self.lastTimepoint;

        used_ = Math.saturatingSub(
            cacheLastUsed,
            Math.mulDiv(Time.timestamp() - cacheLastTimepoint, cacheCapacity, Math.max(cacheWindow, 1))
        );
        available_ = Math.saturatingSub(cacheCapacity, used_);
    }

    /**
     * @dev Returns the currently used quantity. See {state}.
     */
    function used(RefillingBucket storage self) internal view returns (uint256 used_) {
        (used_, ) = state(self);
    }

    /**
     * @dev Returns the currently available quantity. See {state}.
     */
    function available(RefillingBucket storage self) internal view returns (uint256 available_) {
        (, available_) = state(self);
    }

    /**
     * @dev Attempts to consume `quantity` from the bucket. Returns `true` on success, `false` if the available
     * quantity is insufficient.
     *
     * A `quantity` of 0 is always accepted and does not modify storage.
     */
    function tryConsume(RefillingBucket storage self, uint256 quantity) internal returns (bool) {
        (uint256 used_, uint256 available_) = state(self);
        if (quantity == 0) {
            return true;
        } else if (quantity <= available_) {
            self.lastTimepoint = Time.timestamp();
            self.lastUsed = SafeCast.toUint208(used_ + quantity);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Consumes `quantity` from the bucket. Reverts with {RateLimitExceeded} if the available quantity is
     * insufficient. See {tryConsume}.
     */
    function consume(RefillingBucket storage self, uint256 quantity) internal {
        bool success = tryConsume(self, quantity);
        require(success, RateLimitExceeded());
    }

    /**
     * @dev Resets the bucket to a fully-available state.
     *
     * The `capacity` and `window` settings are preserved; only the consumed quantity is cleared.
     */
    function reset(RefillingBucket storage self) internal {
        self.lastUsed = 0;
    }

    /**
     * @dev Updates the `capacity` and `window` of the bucket.
     *
     * The current usage is frozen before the new parameters take effect, so the refill that has accrued up to this
     * point is preserved and future refill happens at the new rate. If `newCapacity` is smaller than the currently
     * used quantity, the bucket starts with zero available quantity until the new rate refills it.
     */
    function updateSettings(RefillingBucket storage self, uint48 newWindow, uint208 newCapacity) internal {
        // Important: compute used before updating anything else in the structure
        self.lastUsed = uint208(used(self));
        self.lastTimepoint = Time.timestamp();
        self.capacity = newCapacity;
        self.window = newWindow;
    }

    // ================================================= SlidingWindow =================================================
    /**
     * @dev A moving-window counter that caps cumulative consumption within any `window`-second interval.
     *
     * Each successful consumption appends a checkpoint to `history` recording the running cumulative total. The
     * current `used` quantity is the difference between the cumulative total at `block.timestamp` and the cumulative
     * total at `block.timestamp - window`.
     *
     * NOTE: The cumulative total is stored as a `uint208`. Once it reaches `2²⁰⁸ - 1`, further consumption will
     * revert in {SafeCast}. This bound is unreachable for any realistic `limit`, but consumers should be aware of it.
     *
     * NOTE: Old checkpoints are never pruned. The storage footprint grows with the number of {tryConsume} calls
     * that succeed with a non-zero `quantity`.
     */
    struct SlidingWindow {
        uint208 limit;
        uint48 window;
        Checkpoints.Trace208 history;
    }

    /**
     * @dev Returns the current `used` and `available` quantities for a {SlidingWindow}, computed as the cumulative
     * consumption over the last `window` seconds.
     */
    function state(SlidingWindow storage self) internal view returns (uint256 used_, uint256 available_) {
        uint208 cacheLimit = self.limit;
        uint48 cacheWindow = self.window;

        used_ = Math.saturatingSub(
            self.history.upperLookupRecent(Time.timestamp()),
            self.history.upperLookupRecent(uint48(Math.saturatingSub(Time.timestamp(), Math.max(cacheWindow, 1))))
        );
        available_ = Math.saturatingSub(cacheLimit, used_);
    }

    /**
     * @dev Returns the currently used quantity within the rolling window. See {state}.
     */
    function used(SlidingWindow storage self) internal view returns (uint256 used_) {
        (used_, ) = state(self);
    }

    /**
     * @dev Returns the currently available quantity within the rolling window. See {state}.
     */
    function available(SlidingWindow storage self) internal view returns (uint256 available_) {
        (, available_) = state(self);
    }

    /**
     * @dev Attempts to record a consumption of `quantity`. Returns `true` on success, `false` if the available
     * quantity within the current window is insufficient.
     *
     * A `quantity` of 0 is always accepted and does not modify storage.
     */
    function tryConsume(SlidingWindow storage self, uint256 quantity) internal returns (bool) {
        if (quantity == 0) {
            return true;
        } else if (quantity <= available(self)) {
            self.history.push(Time.timestamp(), SafeCast.toUint208(self.history.latest() + quantity));
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Records a consumption of `quantity`. Reverts with {RateLimitExceeded} if the available quantity within
     * the current window is insufficient. See {tryConsume}.
     */
    function consume(SlidingWindow storage self, uint256 quantity) internal {
        bool success = tryConsume(self, quantity);
        require(success, RateLimitExceeded());
    }

    /**
     * @dev Resets the rolling window to a fully-available state.
     *
     * The `limit` and `window` settings are preserved; only the consumed quantity is cleared.
     *
     * NOTE: This will reset the entire history, meaning it can also be used to recover from the cumulative total
     * approaching the `uint208` ceiling. The underlying storage slots holding past checkpoints are not zeroed out.
     * As a consequence, there is no gas refunded, but future {consume}/{tryConsume} operations are cheaper from
     * reusing "dirty" slots.
     */
    function reset(SlidingWindow storage self) internal {
        Checkpoints.Checkpoint208[] storage trace = self.history._checkpoints;
        assembly ("memory-safe") {
            sstore(trace.slot, 0)
        }
    }

    /**
     * @dev Updates the `limit` and `window` of the rate limiter.
     *
     * NOTE: The history of past consumptions is not modified. Increasing `window` retroactively brings older
     * consumptions back into the rolling window until they age out under the new duration; decreasing `window`
     * conversely causes older consumptions to drop out sooner.
     */
    function updateSettings(SlidingWindow storage self, uint48 newWindow, uint208 newLimit) internal {
        self.limit = newLimit;
        self.window = newWindow;
    }
}
