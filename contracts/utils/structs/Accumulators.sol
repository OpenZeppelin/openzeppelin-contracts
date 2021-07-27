// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Timers.sol";

library Accumulators {
    using Timers for Timers.Timestamp;

    struct TimestampAccumulator {
        uint64 timestamp;
        uint192 sum;
    }

    function initialize(Timers.Timestamp memory timestamp, uint128 value)
        internal
        pure
        returns (TimestampAccumulator memory)
    {
        return TimestampAccumulator({
            timestamp: timestamp.getDeadline(),
            sum: value
        });
    }

    function initialize(uint128 value) internal view returns (TimestampAccumulator memory) {
        return initialize(Timers.Timestamp({ _deadline: uint64(block.timestamp) }), value);
    }

    function increment(TimestampAccumulator storage accumulator, Timers.Timestamp memory timestamp, uint128 value)
        internal
    {
        require(timestamp.getDeadline() > accumulator.timestamp, "Accumulators: no time passed");
        uint192 incrementalSum;
        // neither underflow nor overflow are possible, so save some gas by doing unchecked arithmetic
        unchecked {
            uint64 timeElapsed = timestamp.getDeadline() - accumulator.timestamp;
            incrementalSum = uint192(value) * timeElapsed;
        }
        accumulator.timestamp = timestamp.getDeadline();
        // the addition below never overflows with correct use, but uses safe math to ward off misuse
        accumulator.sum += incrementalSum;
    }

    function increment(TimestampAccumulator storage accumulator, uint128 value)
        internal
    {
        increment(accumulator, Timers.Timestamp({_deadline: uint64(block.timestamp)}), value);
    }

    function getArithmeticMean(TimestampAccumulator memory a, TimestampAccumulator memory b)
        internal pure returns (uint128)
    {
        // ensure that accumulators are sorted in ascending order by timestamp
        if (a.timestamp > b.timestamp) {
            (a, b) = (b, a);
        }
        // the first subtraction below never underflows with correct use, but uses safe math to ward off misuse
        // the second subtraction below never underflows because of the sorting logic above
        // the division fails iff the timestamps of a and b are equal, which indicates misuse
        // the cast cannot truncate
        return uint128((b.sum - a.sum) / (b.timestamp - a.timestamp));
    }
}
