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
 *   of size up to the bucket's capacity are allowed. Storage cost is constant regardless of consumption history.
 *
 * - {SlidingWindow}: a moving-window counter that caps the cumulative consumption over any `window`-second
 *   interval. Suitable when a strict cap on usage within a rolling window is required. Each successful consumption
 *   appends a checkpoint, making it a more expensive option with a larger storage footprint.
 *
 * === Limiter vs. entries ===
 *
 * Each storage struct is a _limiter_: it pairs a single, shared configuration (the `window`, together with the
 * `capacity` of a {RefillingBucket} or the `limit` of a {SlidingWindow}) with a mapping of independent _entries_
 * keyed by `bytes32`. Every operation takes a `key` and applies only to that entry.
 *
 * All entries in a limiter share the same configuration, but each entry tracks its own consumption independently:
 * consuming from one `key` never affects the availability of another. This lets a single limiter enforce the same
 * rate limit separately across many subjects--for example one entry per caller, per token, or per protected
 * function--simply by choosing the `key` accordingly. Using a constant `key` (e.g. `bytes32(0)`) reduces the
 * limiter to a single global rate limit.
 *
 * Configuration is changed for the whole limiter at once with {updateSettings}, whereas {state}, {used},
 * {available}, {tryConsume}, {consume} and {reset} act on the individual entry identified by `key`.
 *
 * Example usage (one independent rate limit per caller, all sharing the same capacity and window):
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
     * @dev The per-`key` state of a {RefillingBucket} entry.
     *
     * `lastUsed` and `lastTimepoint` record the used quantity and the time it was recorded at the entry's last
     * update. The current state is reconstructed lazily from these two fields on read (see {state}), keeping storage
     * cost constant at one packed slot per entry regardless of how many times the entry has been consumed.
     *
     * WARNING: Manually updating any of the parameters may result in incorrect behavior. Only interact with the
     * {RefillingBucket} through the dedicated functions.
     */
    struct RefillingBucketItem {
        uint208 _lastUsed;
        uint48 _lastTimepoint;
    }

    /**
     * @dev A token-bucket limiter: shared configuration plus a mapping of independent per-`key` buckets.
     *
     * `capacity` and `window` are shared by every entry: each bucket has a maximum `capacity` and refills at a rate
     * of `capacity / window` per second, so that an empty bucket fully refills in `window` seconds. `items` holds the
     * individual buckets, each tracking its own consumption under its `key` (see {RefillingBucketItem}).
     *
     * WARNING: Manually updating any of the parameters may result in incorrect behavior. Only interact with the
     * {RefillingBucket} through the dedicated functions.
     */
    struct RefillingBucket {
        uint208 _capacity;
        uint48 _window;
        mapping(bytes32 key => RefillingBucketItem) _items;
    }

    /**
     * @dev Returns the current `used` and `available` quantities for the `key` bucket, accounting for the time-based
     * refill that has accrued since that entry's last update.
     */
    function state(
        RefillingBucket storage self,
        bytes32 key
    ) internal view returns (uint256 used_, uint256 available_) {
        uint208 capacity_ = self._capacity; // cache
        uint48 window_ = self._window; // cache
        uint208 lastUsed_ = self._items[key]._lastUsed; // cache
        uint48 lastTimepoint_ = self._items[key]._lastTimepoint; // cache

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
     * @dev Attempts to consume `quantity` from the `key` bucket. Returns `true` on success, `false` if that entry's
     * available quantity is insufficient.
     *
     * A `quantity` of 0 is always accepted and does not modify storage.
     */
    function tryConsume(RefillingBucket storage self, bytes32 key, uint256 quantity) internal returns (bool) {
        if (quantity == 0) {
            return true;
        }
        (uint256 used_, uint256 available_) = state(self, key);
        if (quantity <= available_) {
            self._items[key] = RefillingBucketItem({
                _lastTimepoint: Time.timestamp(),
                _lastUsed: SafeCast.toUint208(used_ + quantity)
            });
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Consumes `quantity` from the `key` bucket. Reverts with {RateLimitExceeded} if that entry's available
     * quantity is insufficient. See {tryConsume-struct-RateLimiter-RefillingBucket-bytes32-uint256}.
     */
    function consume(RefillingBucket storage self, bytes32 key, uint256 quantity) internal {
        require(tryConsume(self, key, quantity), RateLimitExceeded());
    }

    /**
     * @dev Resets the `key` bucket to a fully-available state. Other entries are unaffected.
     */
    function reset(RefillingBucket storage self, bytes32 key) internal {
        delete self._items[key];
    }

    /**
     * @dev Updates the shared `capacity` and `window` of the limiter, affecting every entry.
     *
     * NOTE: The new settings will retroactively affect all the keys. The new replenishing rate (capacity / window) is
     * applied from the last update timepoint of each key. Therefore, if the new settings correspond to a faster
     * replenishing rate, some quantity may become available immediately. Conversely, if the new settings correspond
     * to a slower replenishing rate, some quantity that would otherwise be available immediately may become
     * unavailable. This side effect can be mitigated by calling {sync} on the relevant keys before updating the
     * settings. There is no mechanism to automatically sync all the keys in a single operation.
     */
    function updateSettings(RefillingBucket storage self, uint48 newWindow, uint208 newCapacity) internal {
        self._capacity = newCapacity;
        self._window = newWindow;
    }

    /**
     * @dev Refreshes the `key` bucket by applying the accrued refill since its last update timepoint to `lastUsed`
     * and `lastTimepoint`, effectively moving that entry's timepoint forward to now. This can be used to mitigate the
     * side effect of {updateSettings-struct-RateLimiter-RefillingBucket-uint48-uint208} when the replenishing rate is
     * modified. It must be called per key; there is no mechanism to sync all entries at once.
     */
    function sync(RefillingBucket storage self, bytes32 key) internal {
        self._items[key] = RefillingBucketItem({_lastTimepoint: Time.timestamp(), _lastUsed: uint208(used(self, key))});
    }

    // ================================================= SlidingWindow =================================================
    /**
     * @dev A moving-window limiter: shared configuration plus a mapping of independent per-`key` counters.
     *
     * `limit` and `window` are shared by every entry, and cap the cumulative consumption of each entry within any
     * `window`-second interval. `items` holds the individual counters: each entry keeps its own checkpoint history
     * (a `Checkpoints.Trace208`) under its `key`, recording the running cumulative total. An entry's current `used`
     * quantity is the difference between its cumulative total at `block.timestamp` and at `block.timestamp - window`.
     *
     * NOTE: The cumulative total of each entry is stored as a `uint208`. Once it reaches `2²⁰⁸ - 1`, further
     * consumption of that entry will revert in {SafeCast}. This bound is unreachable for any realistic `limit`, but
     * consumers should be aware of it.
     *
     * NOTE: An entry's checkpoint history is not a reliable log of past consumptions--previous entries may be
     * overwritten in place. The storage footprint of an entry grows with the number of
     * {tryConsume-struct-RateLimiter-SlidingWindow-bytes32-uint256} calls on that `key` that succeed with a non-zero
     * `quantity`.
     *
     * WARNING: Manually updating any of the parameters may result in incorrect behavior. Only interact with the
     * {SlidingWindow} through the dedicated functions.
     */
    struct SlidingWindow {
        uint208 _limit;
        uint48 _window;
        mapping(bytes32 key => Checkpoints.Trace208) _items;
    }

    /**
     * @dev Returns the current `used` and `available` quantities for the `key` counter, computed as that entry's
     * cumulative consumption over the last `window` seconds.
     */
    function state(SlidingWindow storage self, bytes32 key) internal view returns (uint256 used_, uint256 available_) {
        uint208 limit_ = self._limit; // cache
        uint48 window_ = self._window; // cache
        Checkpoints.Trace208 storage item_ = self._items[key]; // cache

        used_ = Math.saturatingSub(
            item_.latest(),
            item_.upperLookupRecent(uint48(Math.saturatingSub(Time.timestamp(), Math.max(window_, 1))))
        );
        available_ = Math.saturatingSub(limit_, used_);
    }

    /**
     * @dev Returns the quantity currently used by the `key` counter within the sliding window. See
     * {state-struct-RateLimiter-SlidingWindow-bytes32}.
     */
    function used(SlidingWindow storage self, bytes32 key) internal view returns (uint256 used_) {
        (used_, ) = state(self, key);
    }

    /**
     * @dev Returns the quantity currently available to the `key` counter within the rolling window. See
     * {state-struct-RateLimiter-SlidingWindow-bytes32}.
     */
    function available(SlidingWindow storage self, bytes32 key) internal view returns (uint256 available_) {
        (, available_) = state(self, key);
    }

    /**
     * @dev Attempts to record a consumption of `quantity` against the `key` counter. Returns `true` on success,
     * `false` if that entry's available quantity within the current window is insufficient.
     *
     * A `quantity` of 0 is always accepted and does not modify storage.
     */
    function tryConsume(SlidingWindow storage self, bytes32 key, uint256 quantity) internal returns (bool) {
        if (quantity == 0) {
            return true;
        }
        (uint256 used_, uint256 available_) = state(self, key);
        if (quantity <= available_) {
            if (used_ == 0) {
                reset(self, key);
            }
            Checkpoints.Trace208 storage item_ = self._items[key]; // cache
            item_.push(Time.timestamp(), SafeCast.toUint208(item_.latest() + quantity));
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Records a consumption of `quantity` against the `key` counter. Reverts with {RateLimitExceeded} if that
     * entry's available quantity within the current window is insufficient. See
     * {tryConsume-struct-RateLimiter-SlidingWindow-bytes32-uint256}.
     */
    function consume(SlidingWindow storage self, bytes32 key, uint256 quantity) internal {
        require(tryConsume(self, key, quantity), RateLimitExceeded());
    }

    /**
     * @dev Resets the `key` counter to a fully-available state. Other entries are unaffected.
     *
     * NOTE: This will reset that entry's entire history, meaning it can also be used to recover from the cumulative
     * total approaching the `uint208` ceiling. The underlying storage slots holding past checkpoints are not zeroed
     * out. As a consequence, there is no gas refunded, but future
     * {consume-struct-RateLimiter-SlidingWindow-bytes32-uint256} and
     * {tryConsume-struct-RateLimiter-SlidingWindow-bytes32-uint256} operations are cheaper from reusing "dirty" slots.
     */
    function reset(SlidingWindow storage self, bytes32 key) internal {
        Checkpoints.Checkpoint208[] storage trace = self._items[key]._checkpoints;
        assembly ("memory-safe") {
            sstore(trace.slot, 0)
        }
    }

    /**
     * @dev Updates the shared `limit` and `window` of the limiter, affecting every entry.
     *
     * NOTE: The history of past consumptions is not modified. Increasing `window` retroactively brings older
     * consumptions back into the rolling window until they age out under the new duration; decreasing `window`
     * conversely causes older consumptions to drop out sooner.
     */
    function updateSettings(SlidingWindow storage self, uint48 newWindow, uint208 newLimit) internal {
        self._limit = newLimit;
        self._window = newWindow;
    }
}
