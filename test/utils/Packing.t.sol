// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Packing} from "@openzeppelin/contracts/utils/Packing.sol";

contract PackingTest is Test {
    using Packing for *;

    /// forge-config: default.fuzz.runs = 100
    function testPack(uint8 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes1()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes1()).extract1(1).asUint8());
    }

    function testPack(uint16 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes2()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes2()).extract2(2).asUint16());
    }

    function testPack(uint32 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes4()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes4()).extract4(4).asUint32());
    }

    function testPack(uint32 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes8()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes8()).extract8(4).asUint64());
    }

    function testPack(uint32 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes12()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes12()).extract12(4).asUint96());
    }

    function testPack(uint32 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes16()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes16()).extract16(4).asUint128());
    }

    function testPack(uint32 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes20()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes20()).extract20(4).asUint160());
    }

    function testPack(uint32 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes24()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes24()).extract24(4).asUint192());
    }

    function testPack(uint32 left, uint224 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes28()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes28()).extract28(4).asUint224());
    }

    function testPack(uint64 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes4()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes4()).extract4(8).asUint32());
    }

    function testPack(uint64 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes8()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes8()).extract8(8).asUint64());
    }

    function testPack(uint64 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes12()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes12()).extract12(8).asUint96());
    }

    function testPack(uint64 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes16()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes16()).extract16(8).asUint128());
    }

    function testPack(uint64 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes20()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes20()).extract20(8).asUint160());
    }

    function testPack(uint64 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes24()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes24()).extract24(8).asUint192());
    }

    function testPack(uint96 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes4()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes4()).extract4(12).asUint32());
    }

    function testPack(uint96 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes8()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes8()).extract8(12).asUint64());
    }

    function testPack(uint96 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes12()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes12()).extract12(12).asUint96());
    }

    function testPack(uint96 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes16()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes16()).extract16(12).asUint128());
    }

    function testPack(uint96 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes20()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes20()).extract20(12).asUint160());
    }

    function testPack(uint128 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes4()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes4()).extract4(16).asUint32());
    }

    function testPack(uint128 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes8()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes8()).extract8(16).asUint64());
    }

    function testPack(uint128 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes12()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes12()).extract12(16).asUint96());
    }

    function testPack(uint128 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes16()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes16()).extract16(16).asUint128());
    }

    function testPack(uint160 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes4()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes4()).extract4(20).asUint32());
    }

    function testPack(uint160 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes8()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes8()).extract8(20).asUint64());
    }

    function testPack(uint160 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes12()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes12()).extract12(20).asUint96());
    }

    function testPack(uint192 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes4()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes4()).extract4(24).asUint32());
    }

    function testPack(uint192 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes8()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes8()).extract8(24).asUint64());
    }

    function testPack(uint224 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes28(), right.asPackedBytes4()).extract28(0).asUint224());
        assertEq(right, Packing.pack(left.asPackedBytes28(), right.asPackedBytes4()).extract4(28).asUint32());
    }

    function testReplace(uint16 outer, uint8 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 1));

        Packing.PackedBytes2 container = outer.asPackedBytes2();
        Packing.PackedBytes1 newValue = inner.asPackedBytes1();
        Packing.PackedBytes1 oldValue = container.extract1(offset);

        assertEq(container.replace(newValue, offset).extract1(offset).asUint8(), newValue.asUint8());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint16(), container.asUint16());
    }

    function testReplace(uint32 outer, uint8 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 3));

        Packing.PackedBytes4 container = outer.asPackedBytes4();
        Packing.PackedBytes1 newValue = inner.asPackedBytes1();
        Packing.PackedBytes1 oldValue = container.extract1(offset);

        assertEq(container.replace(newValue, offset).extract1(offset).asUint8(), newValue.asUint8());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint32(), container.asUint32());
    }

    function testReplace(uint32 outer, uint16 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 2));

        Packing.PackedBytes4 container = outer.asPackedBytes4();
        Packing.PackedBytes2 newValue = inner.asPackedBytes2();
        Packing.PackedBytes2 oldValue = container.extract2(offset);

        assertEq(container.replace(newValue, offset).extract2(offset).asUint16(), newValue.asUint16());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint32(), container.asUint32());
    }

    function testReplace(uint64 outer, uint8 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 7));

        Packing.PackedBytes8 container = outer.asPackedBytes8();
        Packing.PackedBytes1 newValue = inner.asPackedBytes1();
        Packing.PackedBytes1 oldValue = container.extract1(offset);

        assertEq(container.replace(newValue, offset).extract1(offset).asUint8(), newValue.asUint8());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint64(), container.asUint64());
    }

    function testReplace(uint64 outer, uint16 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 6));

        Packing.PackedBytes8 container = outer.asPackedBytes8();
        Packing.PackedBytes2 newValue = inner.asPackedBytes2();
        Packing.PackedBytes2 oldValue = container.extract2(offset);

        assertEq(container.replace(newValue, offset).extract2(offset).asUint16(), newValue.asUint16());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint64(), container.asUint64());
    }

    function testReplace(uint64 outer, uint32 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 4));

        Packing.PackedBytes8 container = outer.asPackedBytes8();
        Packing.PackedBytes4 newValue = inner.asPackedBytes4();
        Packing.PackedBytes4 oldValue = container.extract4(offset);

        assertEq(container.replace(newValue, offset).extract4(offset).asUint32(), newValue.asUint32());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint64(), container.asUint64());
    }

    function testReplace(uint96 outer, uint8 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 11));

        Packing.PackedBytes12 container = outer.asPackedBytes12();
        Packing.PackedBytes1 newValue = inner.asPackedBytes1();
        Packing.PackedBytes1 oldValue = container.extract1(offset);

        assertEq(container.replace(newValue, offset).extract1(offset).asUint8(), newValue.asUint8());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint96(), container.asUint96());
    }

    function testReplace(uint96 outer, uint16 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 10));

        Packing.PackedBytes12 container = outer.asPackedBytes12();
        Packing.PackedBytes2 newValue = inner.asPackedBytes2();
        Packing.PackedBytes2 oldValue = container.extract2(offset);

        assertEq(container.replace(newValue, offset).extract2(offset).asUint16(), newValue.asUint16());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint96(), container.asUint96());
    }

    function testReplace(uint96 outer, uint32 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 8));

        Packing.PackedBytes12 container = outer.asPackedBytes12();
        Packing.PackedBytes4 newValue = inner.asPackedBytes4();
        Packing.PackedBytes4 oldValue = container.extract4(offset);

        assertEq(container.replace(newValue, offset).extract4(offset).asUint32(), newValue.asUint32());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint96(), container.asUint96());
    }

    function testReplace(uint96 outer, uint64 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 4));

        Packing.PackedBytes12 container = outer.asPackedBytes12();
        Packing.PackedBytes8 newValue = inner.asPackedBytes8();
        Packing.PackedBytes8 oldValue = container.extract8(offset);

        assertEq(container.replace(newValue, offset).extract8(offset).asUint64(), newValue.asUint64());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint96(), container.asUint96());
    }

    function testReplace(uint128 outer, uint8 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 15));

        Packing.PackedBytes16 container = outer.asPackedBytes16();
        Packing.PackedBytes1 newValue = inner.asPackedBytes1();
        Packing.PackedBytes1 oldValue = container.extract1(offset);

        assertEq(container.replace(newValue, offset).extract1(offset).asUint8(), newValue.asUint8());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint128(), container.asUint128());
    }

    function testReplace(uint128 outer, uint16 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 14));

        Packing.PackedBytes16 container = outer.asPackedBytes16();
        Packing.PackedBytes2 newValue = inner.asPackedBytes2();
        Packing.PackedBytes2 oldValue = container.extract2(offset);

        assertEq(container.replace(newValue, offset).extract2(offset).asUint16(), newValue.asUint16());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint128(), container.asUint128());
    }

    function testReplace(uint128 outer, uint32 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 12));

        Packing.PackedBytes16 container = outer.asPackedBytes16();
        Packing.PackedBytes4 newValue = inner.asPackedBytes4();
        Packing.PackedBytes4 oldValue = container.extract4(offset);

        assertEq(container.replace(newValue, offset).extract4(offset).asUint32(), newValue.asUint32());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint128(), container.asUint128());
    }

    function testReplace(uint128 outer, uint64 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 8));

        Packing.PackedBytes16 container = outer.asPackedBytes16();
        Packing.PackedBytes8 newValue = inner.asPackedBytes8();
        Packing.PackedBytes8 oldValue = container.extract8(offset);

        assertEq(container.replace(newValue, offset).extract8(offset).asUint64(), newValue.asUint64());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint128(), container.asUint128());
    }

    function testReplace(uint128 outer, uint96 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 4));

        Packing.PackedBytes16 container = outer.asPackedBytes16();
        Packing.PackedBytes12 newValue = inner.asPackedBytes12();
        Packing.PackedBytes12 oldValue = container.extract12(offset);

        assertEq(container.replace(newValue, offset).extract12(offset).asUint96(), newValue.asUint96());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint128(), container.asUint128());
    }

    function testReplace(uint160 outer, uint8 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 19));

        Packing.PackedBytes20 container = outer.asPackedBytes20();
        Packing.PackedBytes1 newValue = inner.asPackedBytes1();
        Packing.PackedBytes1 oldValue = container.extract1(offset);

        assertEq(container.replace(newValue, offset).extract1(offset).asUint8(), newValue.asUint8());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint160(), container.asUint160());
    }

    function testReplace(uint160 outer, uint16 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 18));

        Packing.PackedBytes20 container = outer.asPackedBytes20();
        Packing.PackedBytes2 newValue = inner.asPackedBytes2();
        Packing.PackedBytes2 oldValue = container.extract2(offset);

        assertEq(container.replace(newValue, offset).extract2(offset).asUint16(), newValue.asUint16());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint160(), container.asUint160());
    }

    function testReplace(uint160 outer, uint32 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 16));

        Packing.PackedBytes20 container = outer.asPackedBytes20();
        Packing.PackedBytes4 newValue = inner.asPackedBytes4();
        Packing.PackedBytes4 oldValue = container.extract4(offset);

        assertEq(container.replace(newValue, offset).extract4(offset).asUint32(), newValue.asUint32());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint160(), container.asUint160());
    }

    function testReplace(uint160 outer, uint64 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 12));

        Packing.PackedBytes20 container = outer.asPackedBytes20();
        Packing.PackedBytes8 newValue = inner.asPackedBytes8();
        Packing.PackedBytes8 oldValue = container.extract8(offset);

        assertEq(container.replace(newValue, offset).extract8(offset).asUint64(), newValue.asUint64());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint160(), container.asUint160());
    }

    function testReplace(uint160 outer, uint96 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 8));

        Packing.PackedBytes20 container = outer.asPackedBytes20();
        Packing.PackedBytes12 newValue = inner.asPackedBytes12();
        Packing.PackedBytes12 oldValue = container.extract12(offset);

        assertEq(container.replace(newValue, offset).extract12(offset).asUint96(), newValue.asUint96());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint160(), container.asUint160());
    }

    function testReplace(uint160 outer, uint128 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 4));

        Packing.PackedBytes20 container = outer.asPackedBytes20();
        Packing.PackedBytes16 newValue = inner.asPackedBytes16();
        Packing.PackedBytes16 oldValue = container.extract16(offset);

        assertEq(container.replace(newValue, offset).extract16(offset).asUint128(), newValue.asUint128());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint160(), container.asUint160());
    }

    function testReplace(uint192 outer, uint8 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 23));

        Packing.PackedBytes24 container = outer.asPackedBytes24();
        Packing.PackedBytes1 newValue = inner.asPackedBytes1();
        Packing.PackedBytes1 oldValue = container.extract1(offset);

        assertEq(container.replace(newValue, offset).extract1(offset).asUint8(), newValue.asUint8());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint192(), container.asUint192());
    }

    function testReplace(uint192 outer, uint16 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 22));

        Packing.PackedBytes24 container = outer.asPackedBytes24();
        Packing.PackedBytes2 newValue = inner.asPackedBytes2();
        Packing.PackedBytes2 oldValue = container.extract2(offset);

        assertEq(container.replace(newValue, offset).extract2(offset).asUint16(), newValue.asUint16());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint192(), container.asUint192());
    }

    function testReplace(uint192 outer, uint32 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 20));

        Packing.PackedBytes24 container = outer.asPackedBytes24();
        Packing.PackedBytes4 newValue = inner.asPackedBytes4();
        Packing.PackedBytes4 oldValue = container.extract4(offset);

        assertEq(container.replace(newValue, offset).extract4(offset).asUint32(), newValue.asUint32());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint192(), container.asUint192());
    }

    function testReplace(uint192 outer, uint64 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 16));

        Packing.PackedBytes24 container = outer.asPackedBytes24();
        Packing.PackedBytes8 newValue = inner.asPackedBytes8();
        Packing.PackedBytes8 oldValue = container.extract8(offset);

        assertEq(container.replace(newValue, offset).extract8(offset).asUint64(), newValue.asUint64());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint192(), container.asUint192());
    }

    function testReplace(uint192 outer, uint96 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 12));

        Packing.PackedBytes24 container = outer.asPackedBytes24();
        Packing.PackedBytes12 newValue = inner.asPackedBytes12();
        Packing.PackedBytes12 oldValue = container.extract12(offset);

        assertEq(container.replace(newValue, offset).extract12(offset).asUint96(), newValue.asUint96());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint192(), container.asUint192());
    }

    function testReplace(uint192 outer, uint128 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 8));

        Packing.PackedBytes24 container = outer.asPackedBytes24();
        Packing.PackedBytes16 newValue = inner.asPackedBytes16();
        Packing.PackedBytes16 oldValue = container.extract16(offset);

        assertEq(container.replace(newValue, offset).extract16(offset).asUint128(), newValue.asUint128());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint192(), container.asUint192());
    }

    function testReplace(uint192 outer, uint160 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 4));

        Packing.PackedBytes24 container = outer.asPackedBytes24();
        Packing.PackedBytes20 newValue = inner.asPackedBytes20();
        Packing.PackedBytes20 oldValue = container.extract20(offset);

        assertEq(container.replace(newValue, offset).extract20(offset).asUint160(), newValue.asUint160());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint192(), container.asUint192());
    }

    function testReplace(uint224 outer, uint8 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 27));

        Packing.PackedBytes28 container = outer.asPackedBytes28();
        Packing.PackedBytes1 newValue = inner.asPackedBytes1();
        Packing.PackedBytes1 oldValue = container.extract1(offset);

        assertEq(container.replace(newValue, offset).extract1(offset).asUint8(), newValue.asUint8());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint224(), container.asUint224());
    }

    function testReplace(uint224 outer, uint16 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 26));

        Packing.PackedBytes28 container = outer.asPackedBytes28();
        Packing.PackedBytes2 newValue = inner.asPackedBytes2();
        Packing.PackedBytes2 oldValue = container.extract2(offset);

        assertEq(container.replace(newValue, offset).extract2(offset).asUint16(), newValue.asUint16());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint224(), container.asUint224());
    }

    function testReplace(uint224 outer, uint32 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 24));

        Packing.PackedBytes28 container = outer.asPackedBytes28();
        Packing.PackedBytes4 newValue = inner.asPackedBytes4();
        Packing.PackedBytes4 oldValue = container.extract4(offset);

        assertEq(container.replace(newValue, offset).extract4(offset).asUint32(), newValue.asUint32());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint224(), container.asUint224());
    }

    function testReplace(uint224 outer, uint64 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 20));

        Packing.PackedBytes28 container = outer.asPackedBytes28();
        Packing.PackedBytes8 newValue = inner.asPackedBytes8();
        Packing.PackedBytes8 oldValue = container.extract8(offset);

        assertEq(container.replace(newValue, offset).extract8(offset).asUint64(), newValue.asUint64());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint224(), container.asUint224());
    }

    function testReplace(uint224 outer, uint96 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 16));

        Packing.PackedBytes28 container = outer.asPackedBytes28();
        Packing.PackedBytes12 newValue = inner.asPackedBytes12();
        Packing.PackedBytes12 oldValue = container.extract12(offset);

        assertEq(container.replace(newValue, offset).extract12(offset).asUint96(), newValue.asUint96());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint224(), container.asUint224());
    }

    function testReplace(uint224 outer, uint128 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 12));

        Packing.PackedBytes28 container = outer.asPackedBytes28();
        Packing.PackedBytes16 newValue = inner.asPackedBytes16();
        Packing.PackedBytes16 oldValue = container.extract16(offset);

        assertEq(container.replace(newValue, offset).extract16(offset).asUint128(), newValue.asUint128());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint224(), container.asUint224());
    }

    function testReplace(uint224 outer, uint160 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 8));

        Packing.PackedBytes28 container = outer.asPackedBytes28();
        Packing.PackedBytes20 newValue = inner.asPackedBytes20();
        Packing.PackedBytes20 oldValue = container.extract20(offset);

        assertEq(container.replace(newValue, offset).extract20(offset).asUint160(), newValue.asUint160());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint224(), container.asUint224());
    }

    function testReplace(uint224 outer, uint192 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 4));

        Packing.PackedBytes28 container = outer.asPackedBytes28();
        Packing.PackedBytes24 newValue = inner.asPackedBytes24();
        Packing.PackedBytes24 oldValue = container.extract24(offset);

        assertEq(container.replace(newValue, offset).extract24(offset).asUint192(), newValue.asUint192());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint224(), container.asUint224());
    }

    function testReplace(uint256 outer, uint8 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 31));

        Packing.PackedBytes32 container = outer.asPackedBytes32();
        Packing.PackedBytes1 newValue = inner.asPackedBytes1();
        Packing.PackedBytes1 oldValue = container.extract1(offset);

        assertEq(container.replace(newValue, offset).extract1(offset).asUint8(), newValue.asUint8());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint256(), container.asUint256());
    }

    function testReplace(uint256 outer, uint16 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 30));

        Packing.PackedBytes32 container = outer.asPackedBytes32();
        Packing.PackedBytes2 newValue = inner.asPackedBytes2();
        Packing.PackedBytes2 oldValue = container.extract2(offset);

        assertEq(container.replace(newValue, offset).extract2(offset).asUint16(), newValue.asUint16());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint256(), container.asUint256());
    }

    function testReplace(uint256 outer, uint32 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 28));

        Packing.PackedBytes32 container = outer.asPackedBytes32();
        Packing.PackedBytes4 newValue = inner.asPackedBytes4();
        Packing.PackedBytes4 oldValue = container.extract4(offset);

        assertEq(container.replace(newValue, offset).extract4(offset).asUint32(), newValue.asUint32());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint256(), container.asUint256());
    }

    function testReplace(uint256 outer, uint64 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 24));

        Packing.PackedBytes32 container = outer.asPackedBytes32();
        Packing.PackedBytes8 newValue = inner.asPackedBytes8();
        Packing.PackedBytes8 oldValue = container.extract8(offset);

        assertEq(container.replace(newValue, offset).extract8(offset).asUint64(), newValue.asUint64());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint256(), container.asUint256());
    }

    function testReplace(uint256 outer, uint96 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 20));

        Packing.PackedBytes32 container = outer.asPackedBytes32();
        Packing.PackedBytes12 newValue = inner.asPackedBytes12();
        Packing.PackedBytes12 oldValue = container.extract12(offset);

        assertEq(container.replace(newValue, offset).extract12(offset).asUint96(), newValue.asUint96());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint256(), container.asUint256());
    }

    function testReplace(uint256 outer, uint128 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 16));

        Packing.PackedBytes32 container = outer.asPackedBytes32();
        Packing.PackedBytes16 newValue = inner.asPackedBytes16();
        Packing.PackedBytes16 oldValue = container.extract16(offset);

        assertEq(container.replace(newValue, offset).extract16(offset).asUint128(), newValue.asUint128());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint256(), container.asUint256());
    }

    function testReplace(uint256 outer, uint160 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 12));

        Packing.PackedBytes32 container = outer.asPackedBytes32();
        Packing.PackedBytes20 newValue = inner.asPackedBytes20();
        Packing.PackedBytes20 oldValue = container.extract20(offset);

        assertEq(container.replace(newValue, offset).extract20(offset).asUint160(), newValue.asUint160());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint256(), container.asUint256());
    }

    function testReplace(uint256 outer, uint192 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 8));

        Packing.PackedBytes32 container = outer.asPackedBytes32();
        Packing.PackedBytes24 newValue = inner.asPackedBytes24();
        Packing.PackedBytes24 oldValue = container.extract24(offset);

        assertEq(container.replace(newValue, offset).extract24(offset).asUint192(), newValue.asUint192());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint256(), container.asUint256());
    }

    function testReplace(uint256 outer, uint224 inner, uint8 offset) external {
        offset = uint8(bound(offset, 0, 4));

        Packing.PackedBytes32 container = outer.asPackedBytes32();
        Packing.PackedBytes28 newValue = inner.asPackedBytes28();
        Packing.PackedBytes28 oldValue = container.extract28(offset);

        assertEq(container.replace(newValue, offset).extract28(offset).asUint224(), newValue.asUint224());
        assertEq(container.replace(newValue, offset).replace(oldValue, offset).asUint256(), container.asUint256());
    }
}
