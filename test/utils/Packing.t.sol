// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Packing} from "@openzeppelin/contracts/utils/Packing.sol";

contract PackingTest is Test {
    using Packing for *;

    // Pack a pair of arbitrary uint128, and check that split recovers the correct values
    function testUint128x2(uint128 high, uint128 low) external {
        Packing.Uint128x2 packed = Packing.pack(high, low);
        assertEq(packed.high(), high);
        assertEq(packed.low(), low);

        (uint128 recoveredHigh, uint128 recoveredLow) = packed.split();
        assertEq(recoveredHigh, high);
        assertEq(recoveredLow, low);
    }

    // split an arbitrary bytes32 into a pair of uint128, and check that repack matches the input
    function testUint128x2(bytes32 input) external {
        (uint128 high, uint128 low) = input.asUint128x2().split();
        assertEq(Packing.pack(high, low).asBytes32(), input);
    }
}
