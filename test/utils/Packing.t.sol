// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {PackingBytes32, PackingBytes16, PackingBytes8, PackingBytes4} from "@openzeppelin/contracts/utils/Packing.sol";

contract PackingBytes4Test is Test {
    using PackingBytes4 for *;

    /// @dev Pack a pair of arbitrary uint16, and check that split recovers the correct values
    function testUint16x2(uint16 arg0, uint16 arg1) external {
        PackingBytes4.Uint16x2 packed = PackingBytes4.pack(arg0, arg1);
        assertEq(packed.at(0), arg0);
        assertEq(packed.at(1), arg1);

        (uint16 recovered0, uint16 recovered1) = packed.split();
        assertEq(recovered0, arg0);
        assertEq(recovered1, arg1);
    }

    /// @dev Split an arbitrary bytes4 into a pair of uint16, and check that repack matches the input
    function testUint16x2(bytes4 input) external {
        (uint16 arg0, uint16 arg1) = input.asUint16x2().split();
        assertEq(PackingBytes4.pack(arg0, arg1).asBytes4(), input);
    }

    /// @dev Pack a pair of arbitrary uint8, and check that split recovers the correct values
    function testUint8x4(uint8 arg0, uint8 arg1, uint8 arg2, uint8 arg3) external {
        PackingBytes4.Uint8x4 packed = PackingBytes4.pack(arg0, arg1, arg2, arg3);
        assertEq(packed.at(0), arg0);
        assertEq(packed.at(1), arg1);
        assertEq(packed.at(2), arg2);
        assertEq(packed.at(3), arg3);

        (uint8 recovered0, uint8 recovered1, uint8 recovered2, uint8 recovered3) = packed.split();
        assertEq(recovered0, arg0);
        assertEq(recovered1, arg1);
        assertEq(recovered2, arg2);
        assertEq(recovered3, arg3);
    }

    /// @dev Split an arbitrary bytes4 into a pair of uint8, and check that repack matches the input
    function testUint8x4(bytes4 input) external {
        (uint8 arg0, uint8 arg1, uint8 arg2, uint8 arg3) = input.asUint8x4().split();
        assertEq(PackingBytes4.pack(arg0, arg1, arg2, arg3).asBytes4(), input);
    }
}

contract PackingBytes8Test is Test {
    using PackingBytes8 for *;

    /// @dev Pack a pair of arbitrary uint32, and check that split recovers the correct values
    function testUint32x2(uint32 arg0, uint32 arg1) external {
        PackingBytes8.Uint32x2 packed = PackingBytes8.pack(arg0, arg1);
        assertEq(packed.at(0), arg0);
        assertEq(packed.at(1), arg1);

        (uint32 recovered0, uint32 recovered1) = packed.split();
        assertEq(recovered0, arg0);
        assertEq(recovered1, arg1);
    }

    /// @dev Split an arbitrary bytes8 into a pair of uint32, and check that repack matches the input
    function testUint32x2(bytes8 input) external {
        (uint32 arg0, uint32 arg1) = input.asUint32x2().split();
        assertEq(PackingBytes8.pack(arg0, arg1).asBytes8(), input);
    }

    /// @dev Pack a pair of arbitrary uint16, and check that split recovers the correct values
    function testUint16x4(uint16 arg0, uint16 arg1, uint16 arg2, uint16 arg3) external {
        PackingBytes8.Uint16x4 packed = PackingBytes8.pack(arg0, arg1, arg2, arg3);
        assertEq(packed.at(0), arg0);
        assertEq(packed.at(1), arg1);
        assertEq(packed.at(2), arg2);
        assertEq(packed.at(3), arg3);

        (uint16 recovered0, uint16 recovered1, uint16 recovered2, uint16 recovered3) = packed.split();
        assertEq(recovered0, arg0);
        assertEq(recovered1, arg1);
        assertEq(recovered2, arg2);
        assertEq(recovered3, arg3);
    }

    /// @dev Split an arbitrary bytes8 into a pair of uint16, and check that repack matches the input
    function testUint16x4(bytes8 input) external {
        (uint16 arg0, uint16 arg1, uint16 arg2, uint16 arg3) = input.asUint16x4().split();
        assertEq(PackingBytes8.pack(arg0, arg1, arg2, arg3).asBytes8(), input);
    }
}

contract PackingBytes16Test is Test {
    using PackingBytes16 for *;

    /// @dev Pack a pair of arbitrary uint64, and check that split recovers the correct values
    function testUint64x2(uint64 arg0, uint64 arg1) external {
        PackingBytes16.Uint64x2 packed = PackingBytes16.pack(arg0, arg1);
        assertEq(packed.at(0), arg0);
        assertEq(packed.at(1), arg1);

        (uint64 recovered0, uint64 recovered1) = packed.split();
        assertEq(recovered0, arg0);
        assertEq(recovered1, arg1);
    }

    /// @dev Split an arbitrary bytes16 into a pair of uint64, and check that repack matches the input
    function testUint64x2(bytes16 input) external {
        (uint64 arg0, uint64 arg1) = input.asUint64x2().split();
        assertEq(PackingBytes16.pack(arg0, arg1).asBytes16(), input);
    }

    /// @dev Pack a pair of arbitrary uint32, and check that split recovers the correct values
    function testUint32x4(uint32 arg0, uint32 arg1, uint32 arg2, uint32 arg3) external {
        PackingBytes16.Uint32x4 packed = PackingBytes16.pack(arg0, arg1, arg2, arg3);
        assertEq(packed.at(0), arg0);
        assertEq(packed.at(1), arg1);
        assertEq(packed.at(2), arg2);
        assertEq(packed.at(3), arg3);

        (uint32 recovered0, uint32 recovered1, uint32 recovered2, uint32 recovered3) = packed.split();
        assertEq(recovered0, arg0);
        assertEq(recovered1, arg1);
        assertEq(recovered2, arg2);
        assertEq(recovered3, arg3);
    }

    /// @dev Split an arbitrary bytes16 into a pair of uint32, and check that repack matches the input
    function testUint32x4(bytes16 input) external {
        (uint32 arg0, uint32 arg1, uint32 arg2, uint32 arg3) = input.asUint32x4().split();
        assertEq(PackingBytes16.pack(arg0, arg1, arg2, arg3).asBytes16(), input);
    }
}

contract PackingBytes32Test is Test {
    using PackingBytes32 for *;

    /// @dev Pack a pair of arbitrary uint128, and check that split recovers the correct values
    function testUint128x2(uint128 arg0, uint128 arg1) external {
        PackingBytes32.Uint128x2 packed = PackingBytes32.pack(arg0, arg1);
        assertEq(packed.at(0), arg0);
        assertEq(packed.at(1), arg1);

        (uint128 recovered0, uint128 recovered1) = packed.split();
        assertEq(recovered0, arg0);
        assertEq(recovered1, arg1);
    }

    /// @dev Split an arbitrary bytes32 into a pair of uint128, and check that repack matches the input
    function testUint128x2(bytes32 input) external {
        (uint128 arg0, uint128 arg1) = input.asUint128x2().split();
        assertEq(PackingBytes32.pack(arg0, arg1).asBytes32(), input);
    }

    /// @dev Pack a pair of arbitrary uint64, and check that split recovers the correct values
    function testUint64x4(uint64 arg0, uint64 arg1, uint64 arg2, uint64 arg3) external {
        PackingBytes32.Uint64x4 packed = PackingBytes32.pack(arg0, arg1, arg2, arg3);
        assertEq(packed.at(0), arg0);
        assertEq(packed.at(1), arg1);
        assertEq(packed.at(2), arg2);
        assertEq(packed.at(3), arg3);

        (uint64 recovered0, uint64 recovered1, uint64 recovered2, uint64 recovered3) = packed.split();
        assertEq(recovered0, arg0);
        assertEq(recovered1, arg1);
        assertEq(recovered2, arg2);
        assertEq(recovered3, arg3);
    }

    /// @dev Split an arbitrary bytes32 into a pair of uint64, and check that repack matches the input
    function testUint64x4(bytes32 input) external {
        (uint64 arg0, uint64 arg1, uint64 arg2, uint64 arg3) = input.asUint64x4().split();
        assertEq(PackingBytes32.pack(arg0, arg1, arg2, arg3).asBytes32(), input);
    }
}
