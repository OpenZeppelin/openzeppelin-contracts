// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Accumulators} from "@openzeppelin/contracts/utils/structs/Accumulators.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

contract AccumulatorsTest is Test {
    using Accumulators for *;

    // Accumulator
    function testAccumulatorPushShift() public pure {
        Accumulators.Accumulator memory acc = Accumulators.accumulator(); // <empty>
        acc.push(hex"11"); // 11
        acc.push(hex"22"); // 1122
        acc.shift(hex"33"); // 331122
        acc.shift(hex"44"); // 44331122
        acc.push(hex"55"); // 4433112255
        acc.shift(hex"66"); // 664433112255
        assertEq(acc.flatten(), hex"664433112255");
    }

    function testAccumulatorPush(bytes[] calldata input) public pure {
        Accumulators.Accumulator memory acc = Accumulators.accumulator();
        for (uint256 i = 0; i < input.length; ++i) acc.push(input[i]);
        assertEq(acc.flatten(), Bytes.concat(input));
    }

    function testAccumulatorShift(bytes[] calldata input) public pure {
        Accumulators.Accumulator memory acc = Accumulators.accumulator();
        for (uint256 i = input.length; i > 0; --i) acc.shift(input[i - 1]);
        assertEq(acc.flatten(), Bytes.concat(input));
    }
}
