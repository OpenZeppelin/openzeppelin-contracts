// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Packing} from "@openzeppelin/contracts/utils/Packing.sol";

contract PackingTest is Test {
    using Packing for *;

    // Pack a pair of arbitrary uint128, and check that split recovers the correct values
    function testUint128x2(uint128 first, uint128 second) external {
        Packing.Uint128x2 packed = Packing.pack(first, second);
        assertEq(packed.first(), first);
        assertEq(packed.second(), second);

        (uint128 recoveredFirst, uint128 recoveredSecond) = packed.split();
        assertEq(recoveredFirst, first);
        assertEq(recoveredSecond, second);
    }

    // split an arbitrary bytes32 into a pair of uint128, and check that repack matches the input
    function testUint128x2(bytes32 input) external {
        (uint128 first, uint128 second) = input.asUint128x2().split();
        assertEq(Packing.pack(first, second).asBytes32(), input);
    }
}
