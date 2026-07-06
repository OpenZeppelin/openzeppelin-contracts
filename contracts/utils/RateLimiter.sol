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
 * - {RefillingBucket}: a token bucket that refills linearly over time. The bucket starts full; each consumption
 *   draws from it and time refills it. Suitable when the protected resource regenerates continuously and bursts
 *   of size up to the bucket's capacity are acceptable. Storage cost is constant regardless of consumption history.
 *
 * - {SlidingWindow}: a moving-window counter that caps the cumulative consumption over any `window`-second
 *   interval. Suitable when a strict cap on usage within a rolling window is required. Each successful consumption
 *   appends a checkpoint, making it a most expensive option with a larger storage footprint.
 *
 * Both strategies expose the same base set of operations ({state}, {used}, {available}, {tryConsume}, {consume} and
 * {updateSettings}), distinguished by the storage struct passed as the first argument.
 *
 * Example usage:
 *
 * ```solidity
 * using RateLimiter for RateLimiter.RefillingBucket;
 *
 * RateLimiter.RefillingBucket private _rateLimiter;
 *
 * function withdraw(uint256 amount) external {
 *     _rateLimiter.consume(bytes32(bytes20(msg.sender)), amount);
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
     * `lastTimepoint` on read, keeping storage cost constant (1 packed slot per item).
     */
    struct RefillingBucketItem {
        uint208 lastUsed;
        uint48 lastTimepoint;
    }
    struct RefillingBucket {
        uint208 capacity;
        uint48 window;
        mapping(bytes32 key => RefillingBucketItem) items;
    }

    /**
     * @dev Returns the current `used` and `available` quantities for a {RefillingBucket}, accounting for the
     * time-based refill that has accrued since the last update.
     */
    function state(
        RefillingBucket storage self,
        bytes32 key
    ) internal view returns (uint256 used_, uint256 available_) {
        uint208 capacity_ = self.capacity; // cache
        uint48 window_ = self.window; // cache
        uint208 lastUsed_ = self.items[key].lastUsed; // cache
        uint48 lastTimepoint_ = self.items[key].lastTimepoint; // cache

        used_ = Math.saturatingSub(
            lastUsed_,
            Math.mulDiv(Time.timestamp() - lastTimepoint_, capacity_, Math.max(window_, 1))
        );
        available_ = Math.saturatingSub(capacity_, used_);
    }

    /**
     * @dev Returns the currently used quantity. See {state-struct-RateLimiter-RefillingBucket-bytes32}.
     */
    function used(RefillingBucket storage self, bytes32 key) internal view returns (uint256 used_) {
        (used_, ) = state(self, key);
    }

    /**
     * @dev Returns the currently available quantity. See {state-struct-RateLimiter-RefillingBucket-bytes32}.
     */
    function available(RefillingBucket storage self, bytes32 key) internal view returns (uint256 available_) {
        (, available_) = state(self, key);
    }

    /**
     * @dev Attempts to consume `quantity` from the bucket. Returns `true` on success, `false` if the available
     * quantity is insufficient.
     *
     * A `quantity` of 0 is always accepted and does not modify storage.
     */
    function tryConsume(RefillingBucket storage self, bytes32 key, uint256 quantity) internal returns (bool) {
        if (quantity == 0) {
            return true;
        }
        (uint256 used_, uint256 available_) = state(self, key);
        if (quantity <= available_) {
            self.items[key] = RefillingBucketItem({
                lastTimepoint: Time.timestamp(),
                lastUsed: SafeCast.toUint208(used_ + quantity)
            });
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Consumes `quantity` from the bucket. Reverts with {RateLimitExceeded} if the available quantity is
     * insufficient. See {tryConsume-struct-RateLimiter-RefillingBucket-bytes32-uint256}.
     */
    function consume(RefillingBucket storage self, bytes32 key, uint256 quantity) internal {
        require(tryConsume(self, key, quantity), RateLimitExceeded());
    }

    /**
     * @dev Resets the bucket to a fully-available state.
     *
     * The `capacity` and `window` settings are preserved; only the consumed quantity is cleared.
     */
    function reset(RefillingBucket storage self, bytes32 key) internal {
        delete self.items[key];
    }

    /**
     * @dev Updates the `capacity` and `window` of the bucket.
     *
     * NOTE: The new settings will retroactively affect all the keys. The new replenishing rate (capacity / window) is
     * applied from the last update timepoint of each key. Therefore, if the new settings correspond to a faster
     * replenishing rate, some quantity may become available immediately. Conversely, if the new settings correspond
     * to a slower replenishing rate, some quantity that would otherwise be available immediately may become
     * unavailable. This side effect can be mitigated by calling {sync} on the relevant keys before updating the
     * settings. There is no mechanism to automatically sync all the keys in a single operation.
     */
    function updateSettings(RefillingBucket storage self, uint48 newWindow, uint208 newCapacity) internal {
        self.capacity = newCapacity;
        self.window = newWindow;
    }

    /**
     * @dev Refreshes the bucket by applying the accrued refill since the last update timepoint to `lastUsed` and
     * `lastTimepoint`, effectively moving the timepoint forward to now. This can be used to mitigate the side effect
     * of {updateSettings-struct-RateLimiter-RefillingBucket-uint48-uint208} when the replenishing rate is modified.
     */
    function sync(RefillingBucket storage self, bytes32 key) internal {
        self.items[key] = RefillingBucketItem({
            lastTimepoint: Time.timestamp(),
            lastUsed: uint208(used(self, key))
        });
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
     * NOTE: The checkpoint history is not a reliable log of past consumptions--previous entries may be overwritten
     * in place. The storage footprint grows with the number of
     * {tryConsume-struct-RateLimiter-SlidingWindow-bytes32-uint256} calls that succeed with a non-zero `quantity`.
     */
    struct SlidingWindow {
        uint208 limit;
        uint48 window;
        mapping(bytes32 key => Checkpoints.Trace208) items;
    }

    /**
     * @dev Returns the current `used` and `available` quantities for a {SlidingWindow}, computed as the cumulative
     * consumption over the last `window` seconds.
     */
    function state(SlidingWindow storage self, bytes32 key) internal view returns (uint256 used_, uint256 available_) {
        uint208 limit_ = self.limit; // cache
        uint48 window_ = self.window; // cache

        used_ = Math.saturatingSub(
            self.items[key].latest(),
            self.items[key].upperLookupRecent(uint48(Math.saturatingSub(Time.timestamp(), Math.max(window_, 1))))
        );
        available_ = Math.saturatingSub(limit_, used_);
    }

    /**
     * @dev Returns the currently used quantity within the sliding window. See
     * {state-struct-RateLimiter-SlidingWindow-bytes32}.
     */
    function used(SlidingWindow storage self, bytes32 key) internal view returns (uint256 used_) {
        (used_, ) = state(self, key);
    }

    /**
     * @dev Returns the currently available quantity within the rolling window. See
     * {state-struct-RateLimiter-SlidingWindow-bytes32}.
     */
    function available(SlidingWindow storage self, bytes32 key) internal view returns (uint256 available_) {
        (, available_) = state(self, key);
    }

    /**
     * @dev Attempts to record a consumption of `quantity`. Returns `true` on success, `false` if the available
     * quantity within the current window is insufficient.
     *
     * A `quantity` of 0 is always accepted and does not modify storage.
     */
    function tryConsume(SlidingWindow storage self, bytes32 key, uint256 quantity) internal returns (bool) {
        if (quantity == 0) {
            return true;
        }
        (uint256 used_, uint256 available_) = state(self, key);
        if (used_ == 0) {
            reset(self, key);
        }
        if (quantity <= available_) {
            self.items[key].push(Time.timestamp(), SafeCast.toUint208(self.items[key].latest() + quantity));
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Records a consumption of `quantity`. Reverts with {RateLimitExceeded} if the available quantity within
     * the current window is insufficient. See {tryConsume-struct-RateLimiter-SlidingWindow-bytes32-uint256}.
     */
    function consume(SlidingWindow storage self, bytes32 key, uint256 quantity) internal {
        require(tryConsume(self, key, quantity), RateLimitExceeded());
    }

    /**
     * @dev Resets the rolling window to a fully-available state.
     *
     * The `limit` and `window` settings are preserved; only the consumed quantity is cleared.
     *
     * NOTE: This will reset the entire history, meaning it can also be used to recover from the cumulative total
     * approaching the `uint208` ceiling. The underlying storage slots holding past checkpoints are not zeroed out.
     * As a consequence, there is no gas refunded, but future {consume-struct-RateLimiter-SlidingWindow-bytes32-uint256}
     * /{tryConsume-struct-RateLimiter-SlidingWindow-bytes32-uint256} operations are cheaper from reusing "dirty" slots.
     */
    function reset(SlidingWindow storage self, bytes32 key) internal {
        Checkpoints.Checkpoint208[] storage trace = self.items[key]._checkpoints;
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
