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

    function testPackExtract(uint8 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes2()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes2()).extract2(1).asUint16());
    }

    function testPackExtract(uint8 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes3()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes3()).extract3(1).asUint24());
    }

    function testPackExtract(uint8 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes4()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes4()).extract4(1).asUint32());
    }

    function testPackExtract(uint8 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes5()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes5()).extract5(1).asUint40());
    }

    function testPackExtract(uint8 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes6()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes6()).extract6(1).asUint48());
    }

    function testPackExtract(uint8 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes7()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes7()).extract7(1).asUint56());
    }

    function testPackExtract(uint8 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes8()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes8()).extract8(1).asUint64());
    }

    function testPackExtract(uint8 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes9()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes9()).extract9(1).asUint72());
    }

    function testPackExtract(uint8 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes10()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes10()).extract10(1).asUint80());
    }

    function testPackExtract(uint8 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes11()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes11()).extract11(1).asUint88());
    }

    function testPackExtract(uint8 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes12()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes12()).extract12(1).asUint96());
    }

    function testPackExtract(uint8 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes13()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes13()).extract13(1).asUint104());
    }

    function testPackExtract(uint8 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes14()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes14()).extract14(1).asUint112());
    }

    function testPackExtract(uint8 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes15()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes15()).extract15(1).asUint120());
    }

    function testPackExtract(uint8 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes16()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes16()).extract16(1).asUint128());
    }

    function testPackExtract(uint8 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes17()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes17()).extract17(1).asUint136());
    }

    function testPackExtract(uint8 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes18()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes18()).extract18(1).asUint144());
    }

    function testPackExtract(uint8 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes19()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes19()).extract19(1).asUint152());
    }

    function testPackExtract(uint8 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes20()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes20()).extract20(1).asUint160());
    }

    function testPackExtract(uint8 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes21()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes21()).extract21(1).asUint168());
    }

    function testPackExtract(uint8 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes22()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes22()).extract22(1).asUint176());
    }

    function testPackExtract(uint8 left, uint184 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes23()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes23()).extract23(1).asUint184());
    }

    function testPackExtract(uint8 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes24()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes24()).extract24(1).asUint192());
    }

    function testPackExtract(uint8 left, uint200 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes25()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes25()).extract25(1).asUint200());
    }

    function testPackExtract(uint8 left, uint208 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes26()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes26()).extract26(1).asUint208());
    }

    function testPackExtract(uint8 left, uint216 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes27()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes27()).extract27(1).asUint216());
    }

    function testPackExtract(uint8 left, uint224 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes28()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes28()).extract28(1).asUint224());
    }

    function testPackExtract(uint8 left, uint232 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes29()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes29()).extract29(1).asUint232());
    }

    function testPackExtract(uint8 left, uint240 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes30()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes30()).extract30(1).asUint240());
    }

    function testPackExtract(uint8 left, uint248 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes1(), right.asPackedBytes31()).extract1(0).asUint8());
        assertEq(right, Packing.pack(left.asPackedBytes1(), right.asPackedBytes31()).extract31(1).asUint248());
    }

    function testPackExtract(uint16 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes1()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes1()).extract1(2).asUint8());
    }

    function testPackExtract(uint16 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes2()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes2()).extract2(2).asUint16());
    }

    function testPackExtract(uint16 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes3()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes3()).extract3(2).asUint24());
    }

    function testPackExtract(uint16 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes4()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes4()).extract4(2).asUint32());
    }

    function testPackExtract(uint16 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes5()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes5()).extract5(2).asUint40());
    }

    function testPackExtract(uint16 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes6()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes6()).extract6(2).asUint48());
    }

    function testPackExtract(uint16 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes7()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes7()).extract7(2).asUint56());
    }

    function testPackExtract(uint16 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes8()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes8()).extract8(2).asUint64());
    }

    function testPackExtract(uint16 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes9()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes9()).extract9(2).asUint72());
    }

    function testPackExtract(uint16 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes10()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes10()).extract10(2).asUint80());
    }

    function testPackExtract(uint16 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes11()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes11()).extract11(2).asUint88());
    }

    function testPackExtract(uint16 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes12()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes12()).extract12(2).asUint96());
    }

    function testPackExtract(uint16 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes13()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes13()).extract13(2).asUint104());
    }

    function testPackExtract(uint16 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes14()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes14()).extract14(2).asUint112());
    }

    function testPackExtract(uint16 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes15()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes15()).extract15(2).asUint120());
    }

    function testPackExtract(uint16 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes16()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes16()).extract16(2).asUint128());
    }

    function testPackExtract(uint16 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes17()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes17()).extract17(2).asUint136());
    }

    function testPackExtract(uint16 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes18()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes18()).extract18(2).asUint144());
    }

    function testPackExtract(uint16 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes19()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes19()).extract19(2).asUint152());
    }

    function testPackExtract(uint16 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes20()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes20()).extract20(2).asUint160());
    }

    function testPackExtract(uint16 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes21()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes21()).extract21(2).asUint168());
    }

    function testPackExtract(uint16 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes22()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes22()).extract22(2).asUint176());
    }

    function testPackExtract(uint16 left, uint184 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes23()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes23()).extract23(2).asUint184());
    }

    function testPackExtract(uint16 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes24()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes24()).extract24(2).asUint192());
    }

    function testPackExtract(uint16 left, uint200 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes25()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes25()).extract25(2).asUint200());
    }

    function testPackExtract(uint16 left, uint208 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes26()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes26()).extract26(2).asUint208());
    }

    function testPackExtract(uint16 left, uint216 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes27()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes27()).extract27(2).asUint216());
    }

    function testPackExtract(uint16 left, uint224 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes28()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes28()).extract28(2).asUint224());
    }

    function testPackExtract(uint16 left, uint232 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes29()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes29()).extract29(2).asUint232());
    }

    function testPackExtract(uint16 left, uint240 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes2(), right.asPackedBytes30()).extract2(0).asUint16());
        assertEq(right, Packing.pack(left.asPackedBytes2(), right.asPackedBytes30()).extract30(2).asUint240());
    }

    function testPackExtract(uint24 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes1()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes1()).extract1(3).asUint8());
    }

    function testPackExtract(uint24 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes2()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes2()).extract2(3).asUint16());
    }

    function testPackExtract(uint24 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes3()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes3()).extract3(3).asUint24());
    }

    function testPackExtract(uint24 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes4()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes4()).extract4(3).asUint32());
    }

    function testPackExtract(uint24 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes5()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes5()).extract5(3).asUint40());
    }

    function testPackExtract(uint24 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes6()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes6()).extract6(3).asUint48());
    }

    function testPackExtract(uint24 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes7()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes7()).extract7(3).asUint56());
    }

    function testPackExtract(uint24 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes8()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes8()).extract8(3).asUint64());
    }

    function testPackExtract(uint24 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes9()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes9()).extract9(3).asUint72());
    }

    function testPackExtract(uint24 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes10()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes10()).extract10(3).asUint80());
    }

    function testPackExtract(uint24 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes11()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes11()).extract11(3).asUint88());
    }

    function testPackExtract(uint24 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes12()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes12()).extract12(3).asUint96());
    }

    function testPackExtract(uint24 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes13()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes13()).extract13(3).asUint104());
    }

    function testPackExtract(uint24 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes14()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes14()).extract14(3).asUint112());
    }

    function testPackExtract(uint24 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes15()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes15()).extract15(3).asUint120());
    }

    function testPackExtract(uint24 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes16()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes16()).extract16(3).asUint128());
    }

    function testPackExtract(uint24 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes17()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes17()).extract17(3).asUint136());
    }

    function testPackExtract(uint24 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes18()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes18()).extract18(3).asUint144());
    }

    function testPackExtract(uint24 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes19()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes19()).extract19(3).asUint152());
    }

    function testPackExtract(uint24 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes20()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes20()).extract20(3).asUint160());
    }

    function testPackExtract(uint24 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes21()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes21()).extract21(3).asUint168());
    }

    function testPackExtract(uint24 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes22()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes22()).extract22(3).asUint176());
    }

    function testPackExtract(uint24 left, uint184 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes23()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes23()).extract23(3).asUint184());
    }

    function testPackExtract(uint24 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes24()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes24()).extract24(3).asUint192());
    }

    function testPackExtract(uint24 left, uint200 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes25()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes25()).extract25(3).asUint200());
    }

    function testPackExtract(uint24 left, uint208 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes26()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes26()).extract26(3).asUint208());
    }

    function testPackExtract(uint24 left, uint216 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes27()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes27()).extract27(3).asUint216());
    }

    function testPackExtract(uint24 left, uint224 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes28()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes28()).extract28(3).asUint224());
    }

    function testPackExtract(uint24 left, uint232 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes3(), right.asPackedBytes29()).extract3(0).asUint24());
        assertEq(right, Packing.pack(left.asPackedBytes3(), right.asPackedBytes29()).extract29(3).asUint232());
    }

    function testPackExtract(uint32 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes1()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes1()).extract1(4).asUint8());
    }

    function testPackExtract(uint32 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes2()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes2()).extract2(4).asUint16());
    }

    function testPackExtract(uint32 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes3()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes3()).extract3(4).asUint24());
    }

    function testPackExtract(uint32 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes4()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes4()).extract4(4).asUint32());
    }

    function testPackExtract(uint32 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes5()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes5()).extract5(4).asUint40());
    }

    function testPackExtract(uint32 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes6()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes6()).extract6(4).asUint48());
    }

    function testPackExtract(uint32 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes7()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes7()).extract7(4).asUint56());
    }

    function testPackExtract(uint32 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes8()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes8()).extract8(4).asUint64());
    }

    function testPackExtract(uint32 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes9()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes9()).extract9(4).asUint72());
    }

    function testPackExtract(uint32 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes10()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes10()).extract10(4).asUint80());
    }

    function testPackExtract(uint32 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes11()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes11()).extract11(4).asUint88());
    }

    function testPackExtract(uint32 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes12()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes12()).extract12(4).asUint96());
    }

    function testPackExtract(uint32 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes13()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes13()).extract13(4).asUint104());
    }

    function testPackExtract(uint32 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes14()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes14()).extract14(4).asUint112());
    }

    function testPackExtract(uint32 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes15()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes15()).extract15(4).asUint120());
    }

    function testPackExtract(uint32 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes16()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes16()).extract16(4).asUint128());
    }

    function testPackExtract(uint32 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes17()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes17()).extract17(4).asUint136());
    }

    function testPackExtract(uint32 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes18()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes18()).extract18(4).asUint144());
    }

    function testPackExtract(uint32 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes19()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes19()).extract19(4).asUint152());
    }

    function testPackExtract(uint32 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes20()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes20()).extract20(4).asUint160());
    }

    function testPackExtract(uint32 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes21()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes21()).extract21(4).asUint168());
    }

    function testPackExtract(uint32 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes22()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes22()).extract22(4).asUint176());
    }

    function testPackExtract(uint32 left, uint184 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes23()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes23()).extract23(4).asUint184());
    }

    function testPackExtract(uint32 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes24()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes24()).extract24(4).asUint192());
    }

    function testPackExtract(uint32 left, uint200 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes25()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes25()).extract25(4).asUint200());
    }

    function testPackExtract(uint32 left, uint208 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes26()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes26()).extract26(4).asUint208());
    }

    function testPackExtract(uint32 left, uint216 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes27()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes27()).extract27(4).asUint216());
    }

    function testPackExtract(uint32 left, uint224 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes4(), right.asPackedBytes28()).extract4(0).asUint32());
        assertEq(right, Packing.pack(left.asPackedBytes4(), right.asPackedBytes28()).extract28(4).asUint224());
    }

    function testPackExtract(uint40 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes1()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes1()).extract1(5).asUint8());
    }

    function testPackExtract(uint40 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes2()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes2()).extract2(5).asUint16());
    }

    function testPackExtract(uint40 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes3()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes3()).extract3(5).asUint24());
    }

    function testPackExtract(uint40 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes4()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes4()).extract4(5).asUint32());
    }

    function testPackExtract(uint40 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes5()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes5()).extract5(5).asUint40());
    }

    function testPackExtract(uint40 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes6()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes6()).extract6(5).asUint48());
    }

    function testPackExtract(uint40 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes7()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes7()).extract7(5).asUint56());
    }

    function testPackExtract(uint40 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes8()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes8()).extract8(5).asUint64());
    }

    function testPackExtract(uint40 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes9()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes9()).extract9(5).asUint72());
    }

    function testPackExtract(uint40 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes10()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes10()).extract10(5).asUint80());
    }

    function testPackExtract(uint40 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes11()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes11()).extract11(5).asUint88());
    }

    function testPackExtract(uint40 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes12()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes12()).extract12(5).asUint96());
    }

    function testPackExtract(uint40 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes13()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes13()).extract13(5).asUint104());
    }

    function testPackExtract(uint40 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes14()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes14()).extract14(5).asUint112());
    }

    function testPackExtract(uint40 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes15()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes15()).extract15(5).asUint120());
    }

    function testPackExtract(uint40 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes16()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes16()).extract16(5).asUint128());
    }

    function testPackExtract(uint40 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes17()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes17()).extract17(5).asUint136());
    }

    function testPackExtract(uint40 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes18()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes18()).extract18(5).asUint144());
    }

    function testPackExtract(uint40 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes19()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes19()).extract19(5).asUint152());
    }

    function testPackExtract(uint40 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes20()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes20()).extract20(5).asUint160());
    }

    function testPackExtract(uint40 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes21()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes21()).extract21(5).asUint168());
    }

    function testPackExtract(uint40 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes22()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes22()).extract22(5).asUint176());
    }

    function testPackExtract(uint40 left, uint184 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes23()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes23()).extract23(5).asUint184());
    }

    function testPackExtract(uint40 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes24()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes24()).extract24(5).asUint192());
    }

    function testPackExtract(uint40 left, uint200 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes25()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes25()).extract25(5).asUint200());
    }

    function testPackExtract(uint40 left, uint208 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes26()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes26()).extract26(5).asUint208());
    }

    function testPackExtract(uint40 left, uint216 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes5(), right.asPackedBytes27()).extract5(0).asUint40());
        assertEq(right, Packing.pack(left.asPackedBytes5(), right.asPackedBytes27()).extract27(5).asUint216());
    }

    function testPackExtract(uint48 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes1()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes1()).extract1(6).asUint8());
    }

    function testPackExtract(uint48 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes2()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes2()).extract2(6).asUint16());
    }

    function testPackExtract(uint48 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes3()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes3()).extract3(6).asUint24());
    }

    function testPackExtract(uint48 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes4()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes4()).extract4(6).asUint32());
    }

    function testPackExtract(uint48 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes5()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes5()).extract5(6).asUint40());
    }

    function testPackExtract(uint48 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes6()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes6()).extract6(6).asUint48());
    }

    function testPackExtract(uint48 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes7()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes7()).extract7(6).asUint56());
    }

    function testPackExtract(uint48 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes8()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes8()).extract8(6).asUint64());
    }

    function testPackExtract(uint48 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes9()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes9()).extract9(6).asUint72());
    }

    function testPackExtract(uint48 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes10()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes10()).extract10(6).asUint80());
    }

    function testPackExtract(uint48 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes11()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes11()).extract11(6).asUint88());
    }

    function testPackExtract(uint48 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes12()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes12()).extract12(6).asUint96());
    }

    function testPackExtract(uint48 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes13()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes13()).extract13(6).asUint104());
    }

    function testPackExtract(uint48 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes14()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes14()).extract14(6).asUint112());
    }

    function testPackExtract(uint48 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes15()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes15()).extract15(6).asUint120());
    }

    function testPackExtract(uint48 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes16()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes16()).extract16(6).asUint128());
    }

    function testPackExtract(uint48 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes17()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes17()).extract17(6).asUint136());
    }

    function testPackExtract(uint48 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes18()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes18()).extract18(6).asUint144());
    }

    function testPackExtract(uint48 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes19()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes19()).extract19(6).asUint152());
    }

    function testPackExtract(uint48 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes20()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes20()).extract20(6).asUint160());
    }

    function testPackExtract(uint48 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes21()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes21()).extract21(6).asUint168());
    }

    function testPackExtract(uint48 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes22()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes22()).extract22(6).asUint176());
    }

    function testPackExtract(uint48 left, uint184 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes23()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes23()).extract23(6).asUint184());
    }

    function testPackExtract(uint48 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes24()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes24()).extract24(6).asUint192());
    }

    function testPackExtract(uint48 left, uint200 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes25()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes25()).extract25(6).asUint200());
    }

    function testPackExtract(uint48 left, uint208 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes6(), right.asPackedBytes26()).extract6(0).asUint48());
        assertEq(right, Packing.pack(left.asPackedBytes6(), right.asPackedBytes26()).extract26(6).asUint208());
    }

    function testPackExtract(uint56 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes1()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes1()).extract1(7).asUint8());
    }

    function testPackExtract(uint56 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes2()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes2()).extract2(7).asUint16());
    }

    function testPackExtract(uint56 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes3()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes3()).extract3(7).asUint24());
    }

    function testPackExtract(uint56 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes4()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes4()).extract4(7).asUint32());
    }

    function testPackExtract(uint56 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes5()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes5()).extract5(7).asUint40());
    }

    function testPackExtract(uint56 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes6()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes6()).extract6(7).asUint48());
    }

    function testPackExtract(uint56 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes7()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes7()).extract7(7).asUint56());
    }

    function testPackExtract(uint56 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes8()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes8()).extract8(7).asUint64());
    }

    function testPackExtract(uint56 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes9()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes9()).extract9(7).asUint72());
    }

    function testPackExtract(uint56 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes10()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes10()).extract10(7).asUint80());
    }

    function testPackExtract(uint56 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes11()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes11()).extract11(7).asUint88());
    }

    function testPackExtract(uint56 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes12()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes12()).extract12(7).asUint96());
    }

    function testPackExtract(uint56 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes13()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes13()).extract13(7).asUint104());
    }

    function testPackExtract(uint56 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes14()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes14()).extract14(7).asUint112());
    }

    function testPackExtract(uint56 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes15()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes15()).extract15(7).asUint120());
    }

    function testPackExtract(uint56 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes16()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes16()).extract16(7).asUint128());
    }

    function testPackExtract(uint56 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes17()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes17()).extract17(7).asUint136());
    }

    function testPackExtract(uint56 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes18()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes18()).extract18(7).asUint144());
    }

    function testPackExtract(uint56 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes19()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes19()).extract19(7).asUint152());
    }

    function testPackExtract(uint56 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes20()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes20()).extract20(7).asUint160());
    }

    function testPackExtract(uint56 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes21()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes21()).extract21(7).asUint168());
    }

    function testPackExtract(uint56 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes22()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes22()).extract22(7).asUint176());
    }

    function testPackExtract(uint56 left, uint184 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes23()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes23()).extract23(7).asUint184());
    }

    function testPackExtract(uint56 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes24()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes24()).extract24(7).asUint192());
    }

    function testPackExtract(uint56 left, uint200 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes7(), right.asPackedBytes25()).extract7(0).asUint56());
        assertEq(right, Packing.pack(left.asPackedBytes7(), right.asPackedBytes25()).extract25(7).asUint200());
    }

    function testPackExtract(uint64 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes1()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes1()).extract1(8).asUint8());
    }

    function testPackExtract(uint64 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes2()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes2()).extract2(8).asUint16());
    }

    function testPackExtract(uint64 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes3()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes3()).extract3(8).asUint24());
    }

    function testPackExtract(uint64 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes4()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes4()).extract4(8).asUint32());
    }

    function testPackExtract(uint64 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes5()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes5()).extract5(8).asUint40());
    }

    function testPackExtract(uint64 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes6()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes6()).extract6(8).asUint48());
    }

    function testPackExtract(uint64 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes7()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes7()).extract7(8).asUint56());
    }

    function testPackExtract(uint64 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes8()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes8()).extract8(8).asUint64());
    }

    function testPackExtract(uint64 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes9()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes9()).extract9(8).asUint72());
    }

    function testPackExtract(uint64 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes10()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes10()).extract10(8).asUint80());
    }

    function testPackExtract(uint64 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes11()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes11()).extract11(8).asUint88());
    }

    function testPackExtract(uint64 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes12()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes12()).extract12(8).asUint96());
    }

    function testPackExtract(uint64 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes13()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes13()).extract13(8).asUint104());
    }

    function testPackExtract(uint64 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes14()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes14()).extract14(8).asUint112());
    }

    function testPackExtract(uint64 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes15()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes15()).extract15(8).asUint120());
    }

    function testPackExtract(uint64 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes16()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes16()).extract16(8).asUint128());
    }

    function testPackExtract(uint64 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes17()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes17()).extract17(8).asUint136());
    }

    function testPackExtract(uint64 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes18()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes18()).extract18(8).asUint144());
    }

    function testPackExtract(uint64 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes19()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes19()).extract19(8).asUint152());
    }

    function testPackExtract(uint64 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes20()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes20()).extract20(8).asUint160());
    }

    function testPackExtract(uint64 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes21()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes21()).extract21(8).asUint168());
    }

    function testPackExtract(uint64 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes22()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes22()).extract22(8).asUint176());
    }

    function testPackExtract(uint64 left, uint184 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes23()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes23()).extract23(8).asUint184());
    }

    function testPackExtract(uint64 left, uint192 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes8(), right.asPackedBytes24()).extract8(0).asUint64());
        assertEq(right, Packing.pack(left.asPackedBytes8(), right.asPackedBytes24()).extract24(8).asUint192());
    }

    function testPackExtract(uint72 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes1()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes1()).extract1(9).asUint8());
    }

    function testPackExtract(uint72 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes2()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes2()).extract2(9).asUint16());
    }

    function testPackExtract(uint72 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes3()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes3()).extract3(9).asUint24());
    }

    function testPackExtract(uint72 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes4()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes4()).extract4(9).asUint32());
    }

    function testPackExtract(uint72 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes5()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes5()).extract5(9).asUint40());
    }

    function testPackExtract(uint72 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes6()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes6()).extract6(9).asUint48());
    }

    function testPackExtract(uint72 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes7()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes7()).extract7(9).asUint56());
    }

    function testPackExtract(uint72 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes8()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes8()).extract8(9).asUint64());
    }

    function testPackExtract(uint72 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes9()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes9()).extract9(9).asUint72());
    }

    function testPackExtract(uint72 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes10()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes10()).extract10(9).asUint80());
    }

    function testPackExtract(uint72 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes11()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes11()).extract11(9).asUint88());
    }

    function testPackExtract(uint72 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes12()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes12()).extract12(9).asUint96());
    }

    function testPackExtract(uint72 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes13()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes13()).extract13(9).asUint104());
    }

    function testPackExtract(uint72 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes14()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes14()).extract14(9).asUint112());
    }

    function testPackExtract(uint72 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes15()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes15()).extract15(9).asUint120());
    }

    function testPackExtract(uint72 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes16()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes16()).extract16(9).asUint128());
    }

    function testPackExtract(uint72 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes17()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes17()).extract17(9).asUint136());
    }

    function testPackExtract(uint72 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes18()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes18()).extract18(9).asUint144());
    }

    function testPackExtract(uint72 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes19()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes19()).extract19(9).asUint152());
    }

    function testPackExtract(uint72 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes20()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes20()).extract20(9).asUint160());
    }

    function testPackExtract(uint72 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes21()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes21()).extract21(9).asUint168());
    }

    function testPackExtract(uint72 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes22()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes22()).extract22(9).asUint176());
    }

    function testPackExtract(uint72 left, uint184 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes9(), right.asPackedBytes23()).extract9(0).asUint72());
        assertEq(right, Packing.pack(left.asPackedBytes9(), right.asPackedBytes23()).extract23(9).asUint184());
    }

    function testPackExtract(uint80 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes1()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes1()).extract1(10).asUint8());
    }

    function testPackExtract(uint80 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes2()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes2()).extract2(10).asUint16());
    }

    function testPackExtract(uint80 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes3()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes3()).extract3(10).asUint24());
    }

    function testPackExtract(uint80 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes4()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes4()).extract4(10).asUint32());
    }

    function testPackExtract(uint80 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes5()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes5()).extract5(10).asUint40());
    }

    function testPackExtract(uint80 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes6()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes6()).extract6(10).asUint48());
    }

    function testPackExtract(uint80 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes7()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes7()).extract7(10).asUint56());
    }

    function testPackExtract(uint80 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes8()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes8()).extract8(10).asUint64());
    }

    function testPackExtract(uint80 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes9()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes9()).extract9(10).asUint72());
    }

    function testPackExtract(uint80 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes10()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes10()).extract10(10).asUint80());
    }

    function testPackExtract(uint80 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes11()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes11()).extract11(10).asUint88());
    }

    function testPackExtract(uint80 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes12()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes12()).extract12(10).asUint96());
    }

    function testPackExtract(uint80 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes13()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes13()).extract13(10).asUint104());
    }

    function testPackExtract(uint80 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes14()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes14()).extract14(10).asUint112());
    }

    function testPackExtract(uint80 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes15()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes15()).extract15(10).asUint120());
    }

    function testPackExtract(uint80 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes16()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes16()).extract16(10).asUint128());
    }

    function testPackExtract(uint80 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes17()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes17()).extract17(10).asUint136());
    }

    function testPackExtract(uint80 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes18()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes18()).extract18(10).asUint144());
    }

    function testPackExtract(uint80 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes19()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes19()).extract19(10).asUint152());
    }

    function testPackExtract(uint80 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes20()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes20()).extract20(10).asUint160());
    }

    function testPackExtract(uint80 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes21()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes21()).extract21(10).asUint168());
    }

    function testPackExtract(uint80 left, uint176 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes10(), right.asPackedBytes22()).extract10(0).asUint80());
        assertEq(right, Packing.pack(left.asPackedBytes10(), right.asPackedBytes22()).extract22(10).asUint176());
    }

    function testPackExtract(uint88 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes1()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes1()).extract1(11).asUint8());
    }

    function testPackExtract(uint88 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes2()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes2()).extract2(11).asUint16());
    }

    function testPackExtract(uint88 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes3()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes3()).extract3(11).asUint24());
    }

    function testPackExtract(uint88 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes4()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes4()).extract4(11).asUint32());
    }

    function testPackExtract(uint88 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes5()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes5()).extract5(11).asUint40());
    }

    function testPackExtract(uint88 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes6()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes6()).extract6(11).asUint48());
    }

    function testPackExtract(uint88 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes7()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes7()).extract7(11).asUint56());
    }

    function testPackExtract(uint88 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes8()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes8()).extract8(11).asUint64());
    }

    function testPackExtract(uint88 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes9()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes9()).extract9(11).asUint72());
    }

    function testPackExtract(uint88 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes10()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes10()).extract10(11).asUint80());
    }

    function testPackExtract(uint88 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes11()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes11()).extract11(11).asUint88());
    }

    function testPackExtract(uint88 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes12()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes12()).extract12(11).asUint96());
    }

    function testPackExtract(uint88 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes13()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes13()).extract13(11).asUint104());
    }

    function testPackExtract(uint88 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes14()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes14()).extract14(11).asUint112());
    }

    function testPackExtract(uint88 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes15()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes15()).extract15(11).asUint120());
    }

    function testPackExtract(uint88 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes16()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes16()).extract16(11).asUint128());
    }

    function testPackExtract(uint88 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes17()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes17()).extract17(11).asUint136());
    }

    function testPackExtract(uint88 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes18()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes18()).extract18(11).asUint144());
    }

    function testPackExtract(uint88 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes19()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes19()).extract19(11).asUint152());
    }

    function testPackExtract(uint88 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes20()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes20()).extract20(11).asUint160());
    }

    function testPackExtract(uint88 left, uint168 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes11(), right.asPackedBytes21()).extract11(0).asUint88());
        assertEq(right, Packing.pack(left.asPackedBytes11(), right.asPackedBytes21()).extract21(11).asUint168());
    }

    function testPackExtract(uint96 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes1()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes1()).extract1(12).asUint8());
    }

    function testPackExtract(uint96 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes2()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes2()).extract2(12).asUint16());
    }

    function testPackExtract(uint96 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes3()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes3()).extract3(12).asUint24());
    }

    function testPackExtract(uint96 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes4()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes4()).extract4(12).asUint32());
    }

    function testPackExtract(uint96 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes5()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes5()).extract5(12).asUint40());
    }

    function testPackExtract(uint96 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes6()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes6()).extract6(12).asUint48());
    }

    function testPackExtract(uint96 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes7()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes7()).extract7(12).asUint56());
    }

    function testPackExtract(uint96 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes8()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes8()).extract8(12).asUint64());
    }

    function testPackExtract(uint96 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes9()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes9()).extract9(12).asUint72());
    }

    function testPackExtract(uint96 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes10()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes10()).extract10(12).asUint80());
    }

    function testPackExtract(uint96 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes11()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes11()).extract11(12).asUint88());
    }

    function testPackExtract(uint96 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes12()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes12()).extract12(12).asUint96());
    }

    function testPackExtract(uint96 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes13()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes13()).extract13(12).asUint104());
    }

    function testPackExtract(uint96 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes14()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes14()).extract14(12).asUint112());
    }

    function testPackExtract(uint96 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes15()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes15()).extract15(12).asUint120());
    }

    function testPackExtract(uint96 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes16()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes16()).extract16(12).asUint128());
    }

    function testPackExtract(uint96 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes17()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes17()).extract17(12).asUint136());
    }

    function testPackExtract(uint96 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes18()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes18()).extract18(12).asUint144());
    }

    function testPackExtract(uint96 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes19()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes19()).extract19(12).asUint152());
    }

    function testPackExtract(uint96 left, uint160 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes12(), right.asPackedBytes20()).extract12(0).asUint96());
        assertEq(right, Packing.pack(left.asPackedBytes12(), right.asPackedBytes20()).extract20(12).asUint160());
    }

    function testPackExtract(uint104 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes1()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes1()).extract1(13).asUint8());
    }

    function testPackExtract(uint104 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes2()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes2()).extract2(13).asUint16());
    }

    function testPackExtract(uint104 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes3()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes3()).extract3(13).asUint24());
    }

    function testPackExtract(uint104 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes4()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes4()).extract4(13).asUint32());
    }

    function testPackExtract(uint104 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes5()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes5()).extract5(13).asUint40());
    }

    function testPackExtract(uint104 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes6()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes6()).extract6(13).asUint48());
    }

    function testPackExtract(uint104 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes7()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes7()).extract7(13).asUint56());
    }

    function testPackExtract(uint104 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes8()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes8()).extract8(13).asUint64());
    }

    function testPackExtract(uint104 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes9()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes9()).extract9(13).asUint72());
    }

    function testPackExtract(uint104 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes10()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes10()).extract10(13).asUint80());
    }

    function testPackExtract(uint104 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes11()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes11()).extract11(13).asUint88());
    }

    function testPackExtract(uint104 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes12()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes12()).extract12(13).asUint96());
    }

    function testPackExtract(uint104 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes13()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes13()).extract13(13).asUint104());
    }

    function testPackExtract(uint104 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes14()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes14()).extract14(13).asUint112());
    }

    function testPackExtract(uint104 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes15()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes15()).extract15(13).asUint120());
    }

    function testPackExtract(uint104 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes16()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes16()).extract16(13).asUint128());
    }

    function testPackExtract(uint104 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes17()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes17()).extract17(13).asUint136());
    }

    function testPackExtract(uint104 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes18()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes18()).extract18(13).asUint144());
    }

    function testPackExtract(uint104 left, uint152 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes13(), right.asPackedBytes19()).extract13(0).asUint104());
        assertEq(right, Packing.pack(left.asPackedBytes13(), right.asPackedBytes19()).extract19(13).asUint152());
    }

    function testPackExtract(uint112 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes1()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes1()).extract1(14).asUint8());
    }

    function testPackExtract(uint112 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes2()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes2()).extract2(14).asUint16());
    }

    function testPackExtract(uint112 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes3()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes3()).extract3(14).asUint24());
    }

    function testPackExtract(uint112 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes4()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes4()).extract4(14).asUint32());
    }

    function testPackExtract(uint112 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes5()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes5()).extract5(14).asUint40());
    }

    function testPackExtract(uint112 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes6()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes6()).extract6(14).asUint48());
    }

    function testPackExtract(uint112 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes7()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes7()).extract7(14).asUint56());
    }

    function testPackExtract(uint112 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes8()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes8()).extract8(14).asUint64());
    }

    function testPackExtract(uint112 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes9()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes9()).extract9(14).asUint72());
    }

    function testPackExtract(uint112 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes10()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes10()).extract10(14).asUint80());
    }

    function testPackExtract(uint112 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes11()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes11()).extract11(14).asUint88());
    }

    function testPackExtract(uint112 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes12()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes12()).extract12(14).asUint96());
    }

    function testPackExtract(uint112 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes13()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes13()).extract13(14).asUint104());
    }

    function testPackExtract(uint112 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes14()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes14()).extract14(14).asUint112());
    }

    function testPackExtract(uint112 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes15()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes15()).extract15(14).asUint120());
    }

    function testPackExtract(uint112 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes16()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes16()).extract16(14).asUint128());
    }

    function testPackExtract(uint112 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes17()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes17()).extract17(14).asUint136());
    }

    function testPackExtract(uint112 left, uint144 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes14(), right.asPackedBytes18()).extract14(0).asUint112());
        assertEq(right, Packing.pack(left.asPackedBytes14(), right.asPackedBytes18()).extract18(14).asUint144());
    }

    function testPackExtract(uint120 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes1()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes1()).extract1(15).asUint8());
    }

    function testPackExtract(uint120 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes2()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes2()).extract2(15).asUint16());
    }

    function testPackExtract(uint120 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes3()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes3()).extract3(15).asUint24());
    }

    function testPackExtract(uint120 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes4()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes4()).extract4(15).asUint32());
    }

    function testPackExtract(uint120 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes5()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes5()).extract5(15).asUint40());
    }

    function testPackExtract(uint120 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes6()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes6()).extract6(15).asUint48());
    }

    function testPackExtract(uint120 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes7()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes7()).extract7(15).asUint56());
    }

    function testPackExtract(uint120 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes8()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes8()).extract8(15).asUint64());
    }

    function testPackExtract(uint120 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes9()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes9()).extract9(15).asUint72());
    }

    function testPackExtract(uint120 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes10()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes10()).extract10(15).asUint80());
    }

    function testPackExtract(uint120 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes11()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes11()).extract11(15).asUint88());
    }

    function testPackExtract(uint120 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes12()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes12()).extract12(15).asUint96());
    }

    function testPackExtract(uint120 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes13()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes13()).extract13(15).asUint104());
    }

    function testPackExtract(uint120 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes14()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes14()).extract14(15).asUint112());
    }

    function testPackExtract(uint120 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes15()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes15()).extract15(15).asUint120());
    }

    function testPackExtract(uint120 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes16()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes16()).extract16(15).asUint128());
    }

    function testPackExtract(uint120 left, uint136 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes15(), right.asPackedBytes17()).extract15(0).asUint120());
        assertEq(right, Packing.pack(left.asPackedBytes15(), right.asPackedBytes17()).extract17(15).asUint136());
    }

    function testPackExtract(uint128 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes1()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes1()).extract1(16).asUint8());
    }

    function testPackExtract(uint128 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes2()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes2()).extract2(16).asUint16());
    }

    function testPackExtract(uint128 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes3()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes3()).extract3(16).asUint24());
    }

    function testPackExtract(uint128 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes4()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes4()).extract4(16).asUint32());
    }

    function testPackExtract(uint128 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes5()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes5()).extract5(16).asUint40());
    }

    function testPackExtract(uint128 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes6()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes6()).extract6(16).asUint48());
    }

    function testPackExtract(uint128 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes7()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes7()).extract7(16).asUint56());
    }

    function testPackExtract(uint128 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes8()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes8()).extract8(16).asUint64());
    }

    function testPackExtract(uint128 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes9()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes9()).extract9(16).asUint72());
    }

    function testPackExtract(uint128 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes10()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes10()).extract10(16).asUint80());
    }

    function testPackExtract(uint128 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes11()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes11()).extract11(16).asUint88());
    }

    function testPackExtract(uint128 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes12()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes12()).extract12(16).asUint96());
    }

    function testPackExtract(uint128 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes13()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes13()).extract13(16).asUint104());
    }

    function testPackExtract(uint128 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes14()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes14()).extract14(16).asUint112());
    }

    function testPackExtract(uint128 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes15()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes15()).extract15(16).asUint120());
    }

    function testPackExtract(uint128 left, uint128 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes16(), right.asPackedBytes16()).extract16(0).asUint128());
        assertEq(right, Packing.pack(left.asPackedBytes16(), right.asPackedBytes16()).extract16(16).asUint128());
    }

    function testPackExtract(uint136 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes1()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes1()).extract1(17).asUint8());
    }

    function testPackExtract(uint136 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes2()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes2()).extract2(17).asUint16());
    }

    function testPackExtract(uint136 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes3()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes3()).extract3(17).asUint24());
    }

    function testPackExtract(uint136 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes4()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes4()).extract4(17).asUint32());
    }

    function testPackExtract(uint136 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes5()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes5()).extract5(17).asUint40());
    }

    function testPackExtract(uint136 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes6()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes6()).extract6(17).asUint48());
    }

    function testPackExtract(uint136 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes7()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes7()).extract7(17).asUint56());
    }

    function testPackExtract(uint136 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes8()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes8()).extract8(17).asUint64());
    }

    function testPackExtract(uint136 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes9()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes9()).extract9(17).asUint72());
    }

    function testPackExtract(uint136 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes10()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes10()).extract10(17).asUint80());
    }

    function testPackExtract(uint136 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes11()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes11()).extract11(17).asUint88());
    }

    function testPackExtract(uint136 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes12()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes12()).extract12(17).asUint96());
    }

    function testPackExtract(uint136 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes13()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes13()).extract13(17).asUint104());
    }

    function testPackExtract(uint136 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes14()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes14()).extract14(17).asUint112());
    }

    function testPackExtract(uint136 left, uint120 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes17(), right.asPackedBytes15()).extract17(0).asUint136());
        assertEq(right, Packing.pack(left.asPackedBytes17(), right.asPackedBytes15()).extract15(17).asUint120());
    }

    function testPackExtract(uint144 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes1()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes1()).extract1(18).asUint8());
    }

    function testPackExtract(uint144 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes2()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes2()).extract2(18).asUint16());
    }

    function testPackExtract(uint144 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes3()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes3()).extract3(18).asUint24());
    }

    function testPackExtract(uint144 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes4()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes4()).extract4(18).asUint32());
    }

    function testPackExtract(uint144 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes5()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes5()).extract5(18).asUint40());
    }

    function testPackExtract(uint144 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes6()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes6()).extract6(18).asUint48());
    }

    function testPackExtract(uint144 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes7()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes7()).extract7(18).asUint56());
    }

    function testPackExtract(uint144 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes8()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes8()).extract8(18).asUint64());
    }

    function testPackExtract(uint144 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes9()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes9()).extract9(18).asUint72());
    }

    function testPackExtract(uint144 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes10()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes10()).extract10(18).asUint80());
    }

    function testPackExtract(uint144 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes11()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes11()).extract11(18).asUint88());
    }

    function testPackExtract(uint144 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes12()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes12()).extract12(18).asUint96());
    }

    function testPackExtract(uint144 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes13()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes13()).extract13(18).asUint104());
    }

    function testPackExtract(uint144 left, uint112 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes18(), right.asPackedBytes14()).extract18(0).asUint144());
        assertEq(right, Packing.pack(left.asPackedBytes18(), right.asPackedBytes14()).extract14(18).asUint112());
    }

    function testPackExtract(uint152 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes1()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes1()).extract1(19).asUint8());
    }

    function testPackExtract(uint152 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes2()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes2()).extract2(19).asUint16());
    }

    function testPackExtract(uint152 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes3()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes3()).extract3(19).asUint24());
    }

    function testPackExtract(uint152 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes4()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes4()).extract4(19).asUint32());
    }

    function testPackExtract(uint152 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes5()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes5()).extract5(19).asUint40());
    }

    function testPackExtract(uint152 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes6()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes6()).extract6(19).asUint48());
    }

    function testPackExtract(uint152 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes7()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes7()).extract7(19).asUint56());
    }

    function testPackExtract(uint152 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes8()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes8()).extract8(19).asUint64());
    }

    function testPackExtract(uint152 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes9()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes9()).extract9(19).asUint72());
    }

    function testPackExtract(uint152 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes10()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes10()).extract10(19).asUint80());
    }

    function testPackExtract(uint152 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes11()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes11()).extract11(19).asUint88());
    }

    function testPackExtract(uint152 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes12()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes12()).extract12(19).asUint96());
    }

    function testPackExtract(uint152 left, uint104 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes19(), right.asPackedBytes13()).extract19(0).asUint152());
        assertEq(right, Packing.pack(left.asPackedBytes19(), right.asPackedBytes13()).extract13(19).asUint104());
    }

    function testPackExtract(uint160 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes1()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes1()).extract1(20).asUint8());
    }

    function testPackExtract(uint160 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes2()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes2()).extract2(20).asUint16());
    }

    function testPackExtract(uint160 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes3()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes3()).extract3(20).asUint24());
    }

    function testPackExtract(uint160 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes4()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes4()).extract4(20).asUint32());
    }

    function testPackExtract(uint160 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes5()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes5()).extract5(20).asUint40());
    }

    function testPackExtract(uint160 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes6()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes6()).extract6(20).asUint48());
    }

    function testPackExtract(uint160 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes7()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes7()).extract7(20).asUint56());
    }

    function testPackExtract(uint160 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes8()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes8()).extract8(20).asUint64());
    }

    function testPackExtract(uint160 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes9()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes9()).extract9(20).asUint72());
    }

    function testPackExtract(uint160 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes10()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes10()).extract10(20).asUint80());
    }

    function testPackExtract(uint160 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes11()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes11()).extract11(20).asUint88());
    }

    function testPackExtract(uint160 left, uint96 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes20(), right.asPackedBytes12()).extract20(0).asUint160());
        assertEq(right, Packing.pack(left.asPackedBytes20(), right.asPackedBytes12()).extract12(20).asUint96());
    }

    function testPackExtract(uint168 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes1()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes1()).extract1(21).asUint8());
    }

    function testPackExtract(uint168 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes2()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes2()).extract2(21).asUint16());
    }

    function testPackExtract(uint168 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes3()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes3()).extract3(21).asUint24());
    }

    function testPackExtract(uint168 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes4()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes4()).extract4(21).asUint32());
    }

    function testPackExtract(uint168 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes5()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes5()).extract5(21).asUint40());
    }

    function testPackExtract(uint168 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes6()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes6()).extract6(21).asUint48());
    }

    function testPackExtract(uint168 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes7()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes7()).extract7(21).asUint56());
    }

    function testPackExtract(uint168 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes8()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes8()).extract8(21).asUint64());
    }

    function testPackExtract(uint168 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes9()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes9()).extract9(21).asUint72());
    }

    function testPackExtract(uint168 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes10()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes10()).extract10(21).asUint80());
    }

    function testPackExtract(uint168 left, uint88 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes21(), right.asPackedBytes11()).extract21(0).asUint168());
        assertEq(right, Packing.pack(left.asPackedBytes21(), right.asPackedBytes11()).extract11(21).asUint88());
    }

    function testPackExtract(uint176 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes1()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes1()).extract1(22).asUint8());
    }

    function testPackExtract(uint176 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes2()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes2()).extract2(22).asUint16());
    }

    function testPackExtract(uint176 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes3()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes3()).extract3(22).asUint24());
    }

    function testPackExtract(uint176 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes4()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes4()).extract4(22).asUint32());
    }

    function testPackExtract(uint176 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes5()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes5()).extract5(22).asUint40());
    }

    function testPackExtract(uint176 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes6()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes6()).extract6(22).asUint48());
    }

    function testPackExtract(uint176 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes7()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes7()).extract7(22).asUint56());
    }

    function testPackExtract(uint176 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes8()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes8()).extract8(22).asUint64());
    }

    function testPackExtract(uint176 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes9()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes9()).extract9(22).asUint72());
    }

    function testPackExtract(uint176 left, uint80 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes22(), right.asPackedBytes10()).extract22(0).asUint176());
        assertEq(right, Packing.pack(left.asPackedBytes22(), right.asPackedBytes10()).extract10(22).asUint80());
    }

    function testPackExtract(uint184 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes23(), right.asPackedBytes1()).extract23(0).asUint184());
        assertEq(right, Packing.pack(left.asPackedBytes23(), right.asPackedBytes1()).extract1(23).asUint8());
    }

    function testPackExtract(uint184 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes23(), right.asPackedBytes2()).extract23(0).asUint184());
        assertEq(right, Packing.pack(left.asPackedBytes23(), right.asPackedBytes2()).extract2(23).asUint16());
    }

    function testPackExtract(uint184 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes23(), right.asPackedBytes3()).extract23(0).asUint184());
        assertEq(right, Packing.pack(left.asPackedBytes23(), right.asPackedBytes3()).extract3(23).asUint24());
    }

    function testPackExtract(uint184 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes23(), right.asPackedBytes4()).extract23(0).asUint184());
        assertEq(right, Packing.pack(left.asPackedBytes23(), right.asPackedBytes4()).extract4(23).asUint32());
    }

    function testPackExtract(uint184 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes23(), right.asPackedBytes5()).extract23(0).asUint184());
        assertEq(right, Packing.pack(left.asPackedBytes23(), right.asPackedBytes5()).extract5(23).asUint40());
    }

    function testPackExtract(uint184 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes23(), right.asPackedBytes6()).extract23(0).asUint184());
        assertEq(right, Packing.pack(left.asPackedBytes23(), right.asPackedBytes6()).extract6(23).asUint48());
    }

    function testPackExtract(uint184 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes23(), right.asPackedBytes7()).extract23(0).asUint184());
        assertEq(right, Packing.pack(left.asPackedBytes23(), right.asPackedBytes7()).extract7(23).asUint56());
    }

    function testPackExtract(uint184 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes23(), right.asPackedBytes8()).extract23(0).asUint184());
        assertEq(right, Packing.pack(left.asPackedBytes23(), right.asPackedBytes8()).extract8(23).asUint64());
    }

    function testPackExtract(uint184 left, uint72 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes23(), right.asPackedBytes9()).extract23(0).asUint184());
        assertEq(right, Packing.pack(left.asPackedBytes23(), right.asPackedBytes9()).extract9(23).asUint72());
    }

    function testPackExtract(uint192 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes1()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes1()).extract1(24).asUint8());
    }

    function testPackExtract(uint192 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes2()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes2()).extract2(24).asUint16());
    }

    function testPackExtract(uint192 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes3()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes3()).extract3(24).asUint24());
    }

    function testPackExtract(uint192 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes4()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes4()).extract4(24).asUint32());
    }

    function testPackExtract(uint192 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes5()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes5()).extract5(24).asUint40());
    }

    function testPackExtract(uint192 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes6()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes6()).extract6(24).asUint48());
    }

    function testPackExtract(uint192 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes7()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes7()).extract7(24).asUint56());
    }

    function testPackExtract(uint192 left, uint64 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes24(), right.asPackedBytes8()).extract24(0).asUint192());
        assertEq(right, Packing.pack(left.asPackedBytes24(), right.asPackedBytes8()).extract8(24).asUint64());
    }

    function testPackExtract(uint200 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes25(), right.asPackedBytes1()).extract25(0).asUint200());
        assertEq(right, Packing.pack(left.asPackedBytes25(), right.asPackedBytes1()).extract1(25).asUint8());
    }

    function testPackExtract(uint200 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes25(), right.asPackedBytes2()).extract25(0).asUint200());
        assertEq(right, Packing.pack(left.asPackedBytes25(), right.asPackedBytes2()).extract2(25).asUint16());
    }

    function testPackExtract(uint200 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes25(), right.asPackedBytes3()).extract25(0).asUint200());
        assertEq(right, Packing.pack(left.asPackedBytes25(), right.asPackedBytes3()).extract3(25).asUint24());
    }

    function testPackExtract(uint200 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes25(), right.asPackedBytes4()).extract25(0).asUint200());
        assertEq(right, Packing.pack(left.asPackedBytes25(), right.asPackedBytes4()).extract4(25).asUint32());
    }

    function testPackExtract(uint200 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes25(), right.asPackedBytes5()).extract25(0).asUint200());
        assertEq(right, Packing.pack(left.asPackedBytes25(), right.asPackedBytes5()).extract5(25).asUint40());
    }

    function testPackExtract(uint200 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes25(), right.asPackedBytes6()).extract25(0).asUint200());
        assertEq(right, Packing.pack(left.asPackedBytes25(), right.asPackedBytes6()).extract6(25).asUint48());
    }

    function testPackExtract(uint200 left, uint56 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes25(), right.asPackedBytes7()).extract25(0).asUint200());
        assertEq(right, Packing.pack(left.asPackedBytes25(), right.asPackedBytes7()).extract7(25).asUint56());
    }

    function testPackExtract(uint208 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes26(), right.asPackedBytes1()).extract26(0).asUint208());
        assertEq(right, Packing.pack(left.asPackedBytes26(), right.asPackedBytes1()).extract1(26).asUint8());
    }

    function testPackExtract(uint208 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes26(), right.asPackedBytes2()).extract26(0).asUint208());
        assertEq(right, Packing.pack(left.asPackedBytes26(), right.asPackedBytes2()).extract2(26).asUint16());
    }

    function testPackExtract(uint208 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes26(), right.asPackedBytes3()).extract26(0).asUint208());
        assertEq(right, Packing.pack(left.asPackedBytes26(), right.asPackedBytes3()).extract3(26).asUint24());
    }

    function testPackExtract(uint208 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes26(), right.asPackedBytes4()).extract26(0).asUint208());
        assertEq(right, Packing.pack(left.asPackedBytes26(), right.asPackedBytes4()).extract4(26).asUint32());
    }

    function testPackExtract(uint208 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes26(), right.asPackedBytes5()).extract26(0).asUint208());
        assertEq(right, Packing.pack(left.asPackedBytes26(), right.asPackedBytes5()).extract5(26).asUint40());
    }

    function testPackExtract(uint208 left, uint48 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes26(), right.asPackedBytes6()).extract26(0).asUint208());
        assertEq(right, Packing.pack(left.asPackedBytes26(), right.asPackedBytes6()).extract6(26).asUint48());
    }

    function testPackExtract(uint216 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes27(), right.asPackedBytes1()).extract27(0).asUint216());
        assertEq(right, Packing.pack(left.asPackedBytes27(), right.asPackedBytes1()).extract1(27).asUint8());
    }

    function testPackExtract(uint216 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes27(), right.asPackedBytes2()).extract27(0).asUint216());
        assertEq(right, Packing.pack(left.asPackedBytes27(), right.asPackedBytes2()).extract2(27).asUint16());
    }

    function testPackExtract(uint216 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes27(), right.asPackedBytes3()).extract27(0).asUint216());
        assertEq(right, Packing.pack(left.asPackedBytes27(), right.asPackedBytes3()).extract3(27).asUint24());
    }

    function testPackExtract(uint216 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes27(), right.asPackedBytes4()).extract27(0).asUint216());
        assertEq(right, Packing.pack(left.asPackedBytes27(), right.asPackedBytes4()).extract4(27).asUint32());
    }

    function testPackExtract(uint216 left, uint40 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes27(), right.asPackedBytes5()).extract27(0).asUint216());
        assertEq(right, Packing.pack(left.asPackedBytes27(), right.asPackedBytes5()).extract5(27).asUint40());
    }

    function testPackExtract(uint224 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes28(), right.asPackedBytes1()).extract28(0).asUint224());
        assertEq(right, Packing.pack(left.asPackedBytes28(), right.asPackedBytes1()).extract1(28).asUint8());
    }

    function testPackExtract(uint224 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes28(), right.asPackedBytes2()).extract28(0).asUint224());
        assertEq(right, Packing.pack(left.asPackedBytes28(), right.asPackedBytes2()).extract2(28).asUint16());
    }

    function testPackExtract(uint224 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes28(), right.asPackedBytes3()).extract28(0).asUint224());
        assertEq(right, Packing.pack(left.asPackedBytes28(), right.asPackedBytes3()).extract3(28).asUint24());
    }

    function testPackExtract(uint224 left, uint32 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes28(), right.asPackedBytes4()).extract28(0).asUint224());
        assertEq(right, Packing.pack(left.asPackedBytes28(), right.asPackedBytes4()).extract4(28).asUint32());
    }

    function testPackExtract(uint232 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes29(), right.asPackedBytes1()).extract29(0).asUint232());
        assertEq(right, Packing.pack(left.asPackedBytes29(), right.asPackedBytes1()).extract1(29).asUint8());
    }

    function testPackExtract(uint232 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes29(), right.asPackedBytes2()).extract29(0).asUint232());
        assertEq(right, Packing.pack(left.asPackedBytes29(), right.asPackedBytes2()).extract2(29).asUint16());
    }

    function testPackExtract(uint232 left, uint24 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes29(), right.asPackedBytes3()).extract29(0).asUint232());
        assertEq(right, Packing.pack(left.asPackedBytes29(), right.asPackedBytes3()).extract3(29).asUint24());
    }

    function testPackExtract(uint240 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes30(), right.asPackedBytes1()).extract30(0).asUint240());
        assertEq(right, Packing.pack(left.asPackedBytes30(), right.asPackedBytes1()).extract1(30).asUint8());
    }

    function testPackExtract(uint240 left, uint16 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes30(), right.asPackedBytes2()).extract30(0).asUint240());
        assertEq(right, Packing.pack(left.asPackedBytes30(), right.asPackedBytes2()).extract2(30).asUint16());
    }

    function testPackExtract(uint248 left, uint8 right) external {
        assertEq(left, Packing.pack(left.asPackedBytes31(), right.asPackedBytes1()).extract31(0).asUint248());
        assertEq(right, Packing.pack(left.asPackedBytes31(), right.asPackedBytes1()).extract1(31).asUint8());
    }
}
