// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Packing} from "@openzeppelin/contracts/utils/Packing.sol";

contract PackingTest is Test {
    using Packing for *;

    /// forge-config: default.fuzz.runs = 100
    function testPackExtract(uint8 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes1()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes1()).extract1(1).asUint8());
    }

    function testPackExtract(uint16 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes2()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes2()).extract2(2).asUint16());
    }

    function testPackExtract(uint32 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes4()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes4()).extract4(4).asUint32());
    }

    function testPackExtract(uint32 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes8()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes8()).extract8(4).asUint64());
    }

    function testPackExtract(uint32 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes12()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes12()).extract12(4).asUint96());
    }

    function testPackExtract(uint32 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes16()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes16()).extract16(4).asUint128());
    }

    function testPackExtract(uint32 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes20()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes20()).extract20(4).asUint160());
    }

    function testPackExtract(uint32 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes24()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes24()).extract24(4).asUint192());
    }

    function testPackExtract(uint32 left, uint224 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes28()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes28()).extract28(4).asUint224());
    }

    function testPackExtract(uint64 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes4()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes4()).extract4(8).asUint32());
    }

    function testPackExtract(uint64 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes8()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes8()).extract8(8).asUint64());
    }

    function testPackExtract(uint64 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes12()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes12()).extract12(8).asUint96());
    }

    function testPackExtract(uint64 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes16()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes16()).extract16(8).asUint128());
    }

    function testPackExtract(uint64 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes20()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes20()).extract20(8).asUint160());
    }

    function testPackExtract(uint64 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes24()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes24()).extract24(8).asUint192());
    }

    function testPackExtract(uint96 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes4()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes4()).extract4(12).asUint32());
    }

    function testPackExtract(uint96 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes8()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes8()).extract8(12).asUint64());
    }

    function testPackExtract(uint96 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes12()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes12()).extract12(12).asUint96());
    }

    function testPackExtract(uint96 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes16()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes16()).extract16(12).asUint128());
    }

    function testPackExtract(uint96 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes20()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes20()).extract20(12).asUint160());
    }

    function testPackExtract(uint128 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes4()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes4()).extract4(16).asUint32());
    }

    function testPackExtract(uint128 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes8()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes8()).extract8(16).asUint64());
    }

    function testPackExtract(uint128 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes12()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes12()).extract12(16).asUint96());
    }

    function testPackExtract(uint128 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes16()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes16()).extract16(16).asUint128());
    }

    function testPackExtract(uint160 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes4()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes4()).extract4(20).asUint32());
    }

    function testPackExtract(uint160 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes8()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes8()).extract8(20).asUint64());
    }

    function testPackExtract(uint160 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes12()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes12()).extract12(20).asUint96());
    }

    function testPackExtract(uint192 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes4()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes4()).extract4(24).asUint32());
    }

    function testPackExtract(uint192 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes8()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes8()).extract8(24).asUint64());
    }

    function testPackExtract(uint224 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes28(), right.asPackedBytes4()).extract28(0).asUint224());
        assertEq(right, Packing.pack(left.asPackedBytes28(), right.asPackedBytes4()).extract4(28).asUint32());
    }
}
