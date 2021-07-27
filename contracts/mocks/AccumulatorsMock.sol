// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/structs/Accumulators.sol";
import "../utils/Timers.sol";

contract AccumulatorsMock {
    using Accumulators for Accumulators.TimestampAccumulator;

    Accumulators.TimestampAccumulator public timestampAccumulator;

    function prepareForFailingTestUNSAFE() external {
        timestampAccumulator.sum = type(uint192).max;
    }

    function initialize(uint64 timestamp, uint128 value) external {
        timestampAccumulator = Accumulators.initialize(Timers.Timestamp({ _deadline: timestamp }), value);
    }

    function increment(uint64 timestamp, uint128 value) external {
        timestampAccumulator.increment(Timers.Timestamp({ _deadline: timestamp }), value);
    }

    function getArithmeticMean(Accumulators.TimestampAccumulator calldata a) external view returns (uint128) {
        return timestampAccumulator.getArithmeticMean(a);
    }
}
