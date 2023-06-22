// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

library Time {
    using Time for *;

    // Timepoint
    type Timepoint is uint48;

    Timepoint internal constant MAX_TIMEPOINT = Timepoint.wrap(type(uint48).max);
    function toTimepoint(uint48 t) internal pure returns (Timepoint) { return Timepoint.wrap(t);}
    function get(Timepoint t) internal pure returns (uint48) { return Timepoint.unwrap(t);}

    // Timepoint <> Clock
    function clock() internal view returns (Timepoint) { return uint48(block.timestamp).toTimepoint(); }
    function isSet(Timepoint t) internal pure returns (bool) { return t.get() != 0; }
    function isPast(Timepoint t) internal view returns (bool) { return t.get() < clock().get(); }
    function isSetAndPast(Timepoint t) internal view returns (bool) { return t.isSet() && t.isPast(); }

    // Duration
    type Duration is uint40;

    Duration internal constant MAX_DURATION = Duration.wrap(type(uint40).max);
    function toDuration(uint40 d) internal pure returns (Duration) { return Duration.wrap(d);}
    function get(Duration d) internal pure returns (uint40) { return Duration.unwrap(d);}

    // Operators for Timepoints and Durations
    function add(Timepoint t, Duration d) internal pure returns (Timepoint) { return (t.get() + d.get()).toTimepoint(); }
    function sub(Timepoint t, Duration d) internal pure returns (Timepoint) { return (t.get() - d.get()).toTimepoint(); }
    function add(Duration d1, Duration d2) internal pure returns (Duration) { return (d1.get() + d2.get()).toDuration(); }
    function sub(Duration d1, Duration d2) internal pure returns (Duration) { return (d1.get() - d2.get()).toDuration(); }
    function eq(Timepoint t1, Timepoint t2) internal pure returns (bool) { return t1.get() == t2.get(); }
    function eq(Duration d1, Duration d2) internal pure returns (bool) { return d1.get() == d2.get(); }

    // Delay is 128 bits long, and packs the following:
    // [000:039] uint40 for the current value (duration)
    // [040:079] uint40 for the pending value (duration)
    // [080:127] uint48 for the effect date (timepoint)
    type Delay is uint128;

    function toDelay(Duration d) internal pure returns (Delay) {
        return Delay.wrap(d.get());
    }

    function getAt(Delay self, Timepoint t) internal pure returns (Duration) {
        (Duration oldValue, Duration newValue, Timepoint effect) = self.split();
        return (effect.get() == 0 || effect.get() > t.get())
            ? oldValue
            : newValue;
    }

    function get(Delay self) internal view returns (Duration) {
        return self.getAt(clock());
    }

    function getPending(Delay self) internal pure returns (Duration, Timepoint) {
        (, Duration newValue, Timepoint effect) = self.split();
        return (newValue, effect);
    }

    function set(Duration delay) internal pure returns (Delay) {
        return join(delay, toDuration(0), toTimepoint(0));
    }

    function updateAt(Delay self, Duration newDelay, Timepoint effect) internal view returns (Delay) {
        return join(self.get(), newDelay, effect);
    }

    function update(Delay self, Duration newValue) internal view returns (Delay) {
        Duration value = self.get();
        Duration setback = value.get() > newValue.get() ? value.sub(newValue) : 0.toDuration(); // todo: 0 means immediate update. ACDAR does something more opinionated
        return self.updateAt(newValue, clock().add(setback));
    }

    function split(Delay self) internal pure returns (Duration, Duration, Timepoint) {
        uint128 pack = Delay.unwrap(self);
        return (
            uint40(pack      ).toDuration(), // oldValue
            uint40(pack >> 40).toDuration(), // newValue
            uint48(pack >> 80).toTimepoint() // effect
        );
    }

    function join(Duration oldValue, Duration newValue, Timepoint effect) internal pure returns (Delay) {
        return Delay.wrap(
            (uint128(oldValue.get())      ) |
            (uint128(newValue.get()) << 40) |
            (uint128(effect.get())   << 80)
        );
    }
}
