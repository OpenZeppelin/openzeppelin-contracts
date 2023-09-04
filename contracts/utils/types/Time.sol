// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";
import {SafeCast} from "../math/SafeCast.sol";

/**
 * @dev This library provides helpers for manipulating time-related objects.
 *
 * It uses the following types:
 * - `uint48` for timepoints
 * - `uint32` for durations
 *
 * While the library doesn't provide specific types for timepoints and duration, it does provide:
 * - a `Delay` type to represent duration that can be programmed to change value automatically at a given point
 * - additional helper functions
 */
library Time {
    using Time for *;

    /**
     * @dev Get the block timestamp as a Timepoint.
     */
    function timestamp() internal view returns (uint48) {
        return SafeCast.toUint48(block.timestamp);
    }

    /**
     * @dev Get the block number as a Timepoint.
     */
    function blockNumber() internal view returns (uint48) {
        return SafeCast.toUint48(block.number);
    }

    /**
     * @dev Check if a timepoint is set, and in the past.
     */
    function isSetAndPast(uint48 timepoint, uint48 ref) internal pure returns (bool) {
        return timepoint != 0 && timepoint <= ref;
    }

    // ==================================================== Delay =====================================================
    /**
     * @dev A `Delay` is a uint32 duration that can be programmed to change value automatically at a given point in the
     * future. The "effect" timepoint describes when the transitions happens from the "old" value to the "new" value.
     * This allows updating the delay applied to some operation while keeping some guarantees.
     *
     * In particular, the {update} function guarantees that if the delay is reduced, the old delay still applies for
     * some time. For example if the delay is currently 7 days to do an upgrade, the admin should not be able to set
     * the delay to 0 and upgrade immediately. If the admin wants to reduce the delay, the old delay (7 days) should
     * still apply for some time.
     *
     *
     * The `Delay` type is 128 bits long, and packs the following:
     *
     * ```
     *   | [uint48]: effect date (timepoint)
     *   |           | [uint32]: current value (duration)
     *   ↓           ↓       ↓ [uint32]: pending value (duration)
     * 0xAAAAAAAAAAAABBBBBBBBCCCCCCCC
     * ```
     *
     * NOTE: The {get} and {update} function operate using timestamps. Block number based delays should use the
     * {getAt} and {withUpdateAt} variants of these functions.
     */
    type Delay is uint112;

    /**
     * @dev Wrap a duration into a Delay to add the one-step "update in the future" feature
     */
    function toDelay(uint32 duration) internal pure returns (Delay) {
        return Delay.wrap(duration);
    }

    /**
     * @dev Get the value at a given timepoint plus the pending value and effect timepoint if there is a scheduled
     * change after this timepoint. If the effect timepoint is 0, then the pending value should not be considered.
     */
    function getFullAt(Delay self, uint48 timepoint) internal pure returns (uint32, uint32, uint48) {
        (uint32 oldValue, uint32 newValue, uint48 effect) = self.unpack();
        return effect.isSetAndPast(timepoint) ? (newValue, 0, 0) : (oldValue, newValue, effect);
    }

    /**
     * @dev Get the current value plus the pending value and effect timepoint if there is a scheduled change. If the
     * effect timepoint is 0, then the pending value should not be considered.
     */
    function getFull(Delay self) internal view returns (uint32, uint32, uint48) {
        return self.getFullAt(timestamp());
    }

    /**
     * @dev Get the value the Delay will be at a given timepoint.
     */
    function getAt(Delay self, uint48 timepoint) internal pure returns (uint32) {
        (uint32 delay, , ) = getFullAt(self, timepoint);
        return delay;
    }

    /**
     * @dev Get the current value.
     */
    function get(Delay self) internal view returns (uint32) {
        return self.getAt(timestamp());
    }

    /**
     * @dev Update a Delay object so that a new duration takes effect at a given timepoint.
     */
    function withUpdateAt(Delay self, uint32 newValue, uint48 effect) internal view returns (Delay) {
        return pack(self.get(), newValue, effect);
    }

    /**
     * @dev Update a Delay object so that it takes a new duration after a timepoint that is automatically computed to
     * enforce the old delay at the moment of the update. Returns the updated Delay object and the timestamp when the
     * new delay becomes effective.
     */
    function withUpdate(Delay self, uint32 newValue, uint32 minSetback) internal view returns (Delay, uint48) {
        uint32 value = self.get();
        uint32 setback = uint32(Math.max(minSetback, value > newValue ? value - newValue : 0));
        uint48 effect = timestamp() + setback;
        return (self.withUpdateAt(newValue, effect), effect);
    }

    /**
     * @dev Split a delay into its components: oldValue, newValue and effect (transition timepoint).
     */
    function unpack(Delay self) internal pure returns (uint32, uint32, uint48) {
        uint112 raw = Delay.unwrap(self);
        return (
            uint32(raw), // oldValue
            uint32(raw >> 32), // newValue
            uint48(raw >> 64) // effect
        );
    }

    /**
     * @dev pack the components into a Delay object.
     */
    function pack(uint32 oldValue, uint32 newValue, uint48 effect) internal pure returns (Delay) {
        return Delay.wrap(uint112(oldValue) | (uint112(newValue) << 32) | (uint112(effect) << 64));
    }
}
