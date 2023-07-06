// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

library Time {
    using Time for *;

    // ================================================== Timepoint ===================================================
    type Timepoint is uint48;

    Timepoint internal constant MAX_TIMEPOINT = Timepoint.wrap(type(uint48).max);

    /**
     * @dev Wrap a uint48 into a Timepoint for type safety
     */
    function toTimepoint(uint48 timepoint) internal pure returns (Timepoint) { return Timepoint.wrap(timepoint); }

    /**
     * @dev Unwrap a Timepoint into a uint48 for easy arithmetics and comparison
     */
    function get(Timepoint self) internal pure returns (uint48) { return Timepoint.unwrap(self);}

    // ============================================== Timepoint <> Clock ==============================================
    /**
     * @dev Get the block timestamp as a Timepoint
     */
    function clock() internal view returns (Timepoint) { return uint48(block.timestamp).toTimepoint(); }

    /**
     * @dev check is a Timepoint is set (0 is considered an invalid Timepoint, though its a valid Duration)
     */
    function isSet(Timepoint self) internal pure returns (bool) { return self.get() != 0; }

    /**
     * @dev Check if a Timepoint is before another
     */
    function isBefore(Timepoint self, Timepoint ref) internal pure returns (bool) { return self.get() < ref.get(); }

    /**
     * @dev Check if a Timepoint is in the past
     */
    function isPast(Timepoint self) internal view returns (bool) { return self.isBefore(clock()); }

    /**
     * @dev Check if a Timepoint is set and in the past
     */
    function isSetAndPast(Timepoint self) internal view returns (bool) { return self.isSet() && self.isPast(); }

    // =================================================== Duration ===================================================
    type Duration is uint32;

    Duration internal constant MAX_DURATION = Duration.wrap(type(uint32).max);

    /**
     * @dev Wrap a uint32 into a Duration for type safety
     */
    function toDuration(uint32 duration) internal pure returns (Duration) { return Duration.wrap(duration);}

    /**
     * @dev Unwrap a Duration into an uint32 for easy arithmetics and comparison
     */
    function get(Duration self) internal pure returns (uint32) { return Duration.unwrap(self);}

    // ==================================== Operators for Timepoints and Durations ====================================
    /// @dev Typed arithmetics: Timepoint + Duration → Timepoint
    function add(Timepoint t, Duration d) internal pure returns (Timepoint) { return (t.get() + d.get()).toTimepoint(); }

    /// @dev Typed arithmetics: Timepoint - Duration → Timepoint
    function sub(Timepoint t, Duration d) internal pure returns (Timepoint) { return (t.get() - d.get()).toTimepoint(); }

    /// @dev Typed arithmetics: Duration + Duration → Duration
    function add(Duration d1, Duration d2) internal pure returns (Duration) { return (d1.get() + d2.get()).toDuration(); }

    /// @dev Typed arithmetics: Duration - Duration → Duration
    function sub(Duration d1, Duration d2) internal pure returns (Duration) { return (d1.get() - d2.get()).toDuration(); }

    /// @dev Typed comparaison: Timepoint equality
    function eq(Timepoint t1, Timepoint t2) internal pure returns (bool) { return t1.get() == t2.get(); }

    /// @dev Typed comparaison: Duration equality
    function eq(Duration d1, Duration d2) internal pure returns (bool) { return d1.get() == d2.get(); }

    // ==================================================== Delay =====================================================
    /**
     * @dev A `Delay` is a `Duration` that can be programmed to change value automatically at a given point in the
     * future. The "effect" timepoint describes when the transitions happens from the "old" value to the "new" value.
     * This allows updating the delay applied to some operation while keeping so guarantees.
     *
     * In particular, the {update} function guarantees that is the delay is reduced, the old delay still applies for
     * some time. For example if the delay is currently 7 days to do an upgrade, the admin should not be able to set
     * the delay to 0 and upgrade immediatly. If the admin wants to reduce the delay, the old delay (7 days) should
     * still apply for some time.
     *
     *
     * The `Delay` type is 128 bits long, and packs the following:
     * [000:031] uint32 for the current value (duration)
     * [032:063] uint32 for the pending value (duration)
     * [064:111] uint48 for the effect date (timepoint)
     */
    type Delay is uint112;

    /**
     * @dev Wrap a Duration into a Delay to add the one-step "update in the future" feature
     */
    function toDelay(Duration duration) internal pure returns (Delay) {
        return Delay.wrap(duration.get());
    }

    /**
     * @dev Get the value the Delay will be at a given timepoint
     */
    function getAt(Delay self, Timepoint timepoint) internal pure returns (Duration) {
        (Duration oldValue, Duration newValue, Timepoint effect) = self.split();
        return (effect.get() == 0 || effect.get() > timepoint.get())
            ? oldValue
            : newValue;
    }

    /**
     * @dev Get the current value.
     */
    function get(Delay self) internal view returns (Duration) {
        return self.getAt(clock());
    }

    /**
     * @dev Get the pending value, and effect timepoint. If the effect timepoint is 0, then the pending value should
     * not be considered.
     */
    function getPending(Delay self) internal pure returns (Duration, Timepoint) {
        (, Duration newValue, Timepoint effect) = self.split();
        return (newValue, effect);
    }

    /**
     * @dev Build a Delay object from a Duration. This duration as immediat effect.
     */
    function set(Duration delay) internal pure returns (Delay) {
        return pack(delay, toDuration(0), toTimepoint(0));
    }

    /**
     * @dev Update a Delay object so that a new duration takes effect at a given timepoint.
     */
    function updateAt(Delay self, Duration newValue, Timepoint effect) internal view returns (Delay) {
        return pack(self.get(), newValue, effect);
    }

    /**
     * @dev Update a Delay object so that it takes a new duration after at a timepoint that is automatically computed
     * to enforce the old delay at the moment of the update.
     */
    function update(Delay self, Duration newValue) internal view returns (Delay) {
        Duration value = self.get();
        Duration setback = value.get() > newValue.get() ? value.sub(newValue) : 0.toDuration(); // todo: 0 means immediate update. ACDAR does something more opinionated
        return self.updateAt(newValue, clock().add(setback));
    }

    /**
     * @dev Split a delay into its components: oldValue, newValue and effect (transition timepoint).
     */
    function split(Delay self) internal pure returns (Duration, Duration, Timepoint) {
        uint128 raw = Delay.unwrap(self);
        return (
            uint32(raw      ).toDuration(), // oldValue
            uint32(raw >> 32).toDuration(), // newValue
            uint48(raw >> 64).toTimepoint() // effect
        );
    }

    /**
     * @dev pack the components into a Delay object.
     */
    function pack(Duration oldValue, Duration newValue, Timepoint effect) internal pure returns (Delay) {
        return Delay.wrap(
            (uint112(oldValue.get())      ) |
            (uint112(newValue.get()) << 32) |
            (uint112(effect.get())   << 64)
        );
    }
}
