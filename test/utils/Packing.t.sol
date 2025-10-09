// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Packing} from "@openzeppelin/contracts/utils/Packing.sol";

contract PackingTest is Test {
    using Packing for *;

    function testSymbolicPack(bytes1 left, bytes1 right) external pure {
        assertEq(left, Packing.pack_1_1(left, right).extract_2_1(0));
        assertEq(right, Packing.pack_1_1(left, right).extract_2_1(1));
    }

    function testSymbolicPack(bytes2 left, bytes2 right) external pure {
        assertEq(left, Packing.pack_2_2(left, right).extract_4_2(0));
        assertEq(right, Packing.pack_2_2(left, right).extract_4_2(2));
    }

    function testSymbolicPack(bytes2 left, bytes4 right) external pure {
        assertEq(left, Packing.pack_2_4(left, right).extract_6_2(0));
        assertEq(right, Packing.pack_2_4(left, right).extract_6_4(2));
    }

    function testSymbolicPack(bytes2 left, bytes6 right) external pure {
        assertEq(left, Packing.pack_2_6(left, right).extract_8_2(0));
        assertEq(right, Packing.pack_2_6(left, right).extract_8_6(2));
    }

    function testSymbolicPack(bytes2 left, bytes8 right) external pure {
        assertEq(left, Packing.pack_2_8(left, right).extract_10_2(0));
        assertEq(right, Packing.pack_2_8(left, right).extract_10_8(2));
    }

    function testSymbolicPack(bytes2 left, bytes10 right) external pure {
        assertEq(left, Packing.pack_2_10(left, right).extract_12_2(0));
        assertEq(right, Packing.pack_2_10(left, right).extract_12_10(2));
    }

    function testSymbolicPack(bytes2 left, bytes20 right) external pure {
        assertEq(left, Packing.pack_2_20(left, right).extract_22_2(0));
        assertEq(right, Packing.pack_2_20(left, right).extract_22_20(2));
    }

    function testSymbolicPack(bytes2 left, bytes22 right) external pure {
        assertEq(left, Packing.pack_2_22(left, right).extract_24_2(0));
        assertEq(right, Packing.pack_2_22(left, right).extract_24_22(2));
    }

    function testSymbolicPack(bytes4 left, bytes2 right) external pure {
        assertEq(left, Packing.pack_4_2(left, right).extract_6_4(0));
        assertEq(right, Packing.pack_4_2(left, right).extract_6_2(4));
    }

    function testSymbolicPack(bytes4 left, bytes4 right) external pure {
        assertEq(left, Packing.pack_4_4(left, right).extract_8_4(0));
        assertEq(right, Packing.pack_4_4(left, right).extract_8_4(4));
    }

    function testSymbolicPack(bytes4 left, bytes6 right) external pure {
        assertEq(left, Packing.pack_4_6(left, right).extract_10_4(0));
        assertEq(right, Packing.pack_4_6(left, right).extract_10_6(4));
    }

    function testSymbolicPack(bytes4 left, bytes8 right) external pure {
        assertEq(left, Packing.pack_4_8(left, right).extract_12_4(0));
        assertEq(right, Packing.pack_4_8(left, right).extract_12_8(4));
    }

    function testSymbolicPack(bytes4 left, bytes12 right) external pure {
        assertEq(left, Packing.pack_4_12(left, right).extract_16_4(0));
        assertEq(right, Packing.pack_4_12(left, right).extract_16_12(4));
    }

    function testSymbolicPack(bytes4 left, bytes16 right) external pure {
        assertEq(left, Packing.pack_4_16(left, right).extract_20_4(0));
        assertEq(right, Packing.pack_4_16(left, right).extract_20_16(4));
    }

    function testSymbolicPack(bytes4 left, bytes20 right) external pure {
        assertEq(left, Packing.pack_4_20(left, right).extract_24_4(0));
        assertEq(right, Packing.pack_4_20(left, right).extract_24_20(4));
    }

    function testSymbolicPack(bytes4 left, bytes24 right) external pure {
        assertEq(left, Packing.pack_4_24(left, right).extract_28_4(0));
        assertEq(right, Packing.pack_4_24(left, right).extract_28_24(4));
    }

    function testSymbolicPack(bytes4 left, bytes28 right) external pure {
        assertEq(left, Packing.pack_4_28(left, right).extract_32_4(0));
        assertEq(right, Packing.pack_4_28(left, right).extract_32_28(4));
    }

    function testSymbolicPack(bytes6 left, bytes2 right) external pure {
        assertEq(left, Packing.pack_6_2(left, right).extract_8_6(0));
        assertEq(right, Packing.pack_6_2(left, right).extract_8_2(6));
    }

    function testSymbolicPack(bytes6 left, bytes4 right) external pure {
        assertEq(left, Packing.pack_6_4(left, right).extract_10_6(0));
        assertEq(right, Packing.pack_6_4(left, right).extract_10_4(6));
    }

    function testSymbolicPack(bytes6 left, bytes6 right) external pure {
        assertEq(left, Packing.pack_6_6(left, right).extract_12_6(0));
        assertEq(right, Packing.pack_6_6(left, right).extract_12_6(6));
    }

    function testSymbolicPack(bytes6 left, bytes10 right) external pure {
        assertEq(left, Packing.pack_6_10(left, right).extract_16_6(0));
        assertEq(right, Packing.pack_6_10(left, right).extract_16_10(6));
    }

    function testSymbolicPack(bytes6 left, bytes16 right) external pure {
        assertEq(left, Packing.pack_6_16(left, right).extract_22_6(0));
        assertEq(right, Packing.pack_6_16(left, right).extract_22_16(6));
    }

    function testSymbolicPack(bytes6 left, bytes22 right) external pure {
        assertEq(left, Packing.pack_6_22(left, right).extract_28_6(0));
        assertEq(right, Packing.pack_6_22(left, right).extract_28_22(6));
    }

    function testSymbolicPack(bytes8 left, bytes2 right) external pure {
        assertEq(left, Packing.pack_8_2(left, right).extract_10_8(0));
        assertEq(right, Packing.pack_8_2(left, right).extract_10_2(8));
    }

    function testSymbolicPack(bytes8 left, bytes4 right) external pure {
        assertEq(left, Packing.pack_8_4(left, right).extract_12_8(0));
        assertEq(right, Packing.pack_8_4(left, right).extract_12_4(8));
    }

    function testSymbolicPack(bytes8 left, bytes8 right) external pure {
        assertEq(left, Packing.pack_8_8(left, right).extract_16_8(0));
        assertEq(right, Packing.pack_8_8(left, right).extract_16_8(8));
    }

    function testSymbolicPack(bytes8 left, bytes12 right) external pure {
        assertEq(left, Packing.pack_8_12(left, right).extract_20_8(0));
        assertEq(right, Packing.pack_8_12(left, right).extract_20_12(8));
    }

    function testSymbolicPack(bytes8 left, bytes16 right) external pure {
        assertEq(left, Packing.pack_8_16(left, right).extract_24_8(0));
        assertEq(right, Packing.pack_8_16(left, right).extract_24_16(8));
    }

    function testSymbolicPack(bytes8 left, bytes20 right) external pure {
        assertEq(left, Packing.pack_8_20(left, right).extract_28_8(0));
        assertEq(right, Packing.pack_8_20(left, right).extract_28_20(8));
    }

    function testSymbolicPack(bytes8 left, bytes24 right) external pure {
        assertEq(left, Packing.pack_8_24(left, right).extract_32_8(0));
        assertEq(right, Packing.pack_8_24(left, right).extract_32_24(8));
    }

    function testSymbolicPack(bytes10 left, bytes2 right) external pure {
        assertEq(left, Packing.pack_10_2(left, right).extract_12_10(0));
        assertEq(right, Packing.pack_10_2(left, right).extract_12_2(10));
    }

    function testSymbolicPack(bytes10 left, bytes6 right) external pure {
        assertEq(left, Packing.pack_10_6(left, right).extract_16_10(0));
        assertEq(right, Packing.pack_10_6(left, right).extract_16_6(10));
    }

    function testSymbolicPack(bytes10 left, bytes10 right) external pure {
        assertEq(left, Packing.pack_10_10(left, right).extract_20_10(0));
        assertEq(right, Packing.pack_10_10(left, right).extract_20_10(10));
    }

    function testSymbolicPack(bytes10 left, bytes12 right) external pure {
        assertEq(left, Packing.pack_10_12(left, right).extract_22_10(0));
        assertEq(right, Packing.pack_10_12(left, right).extract_22_12(10));
    }

    function testSymbolicPack(bytes10 left, bytes22 right) external pure {
        assertEq(left, Packing.pack_10_22(left, right).extract_32_10(0));
        assertEq(right, Packing.pack_10_22(left, right).extract_32_22(10));
    }

    function testSymbolicPack(bytes12 left, bytes4 right) external pure {
        assertEq(left, Packing.pack_12_4(left, right).extract_16_12(0));
        assertEq(right, Packing.pack_12_4(left, right).extract_16_4(12));
    }

    function testSymbolicPack(bytes12 left, bytes8 right) external pure {
        assertEq(left, Packing.pack_12_8(left, right).extract_20_12(0));
        assertEq(right, Packing.pack_12_8(left, right).extract_20_8(12));
    }

    function testSymbolicPack(bytes12 left, bytes10 right) external pure {
        assertEq(left, Packing.pack_12_10(left, right).extract_22_12(0));
        assertEq(right, Packing.pack_12_10(left, right).extract_22_10(12));
    }

    function testSymbolicPack(bytes12 left, bytes12 right) external pure {
        assertEq(left, Packing.pack_12_12(left, right).extract_24_12(0));
        assertEq(right, Packing.pack_12_12(left, right).extract_24_12(12));
    }

    function testSymbolicPack(bytes12 left, bytes16 right) external pure {
        assertEq(left, Packing.pack_12_16(left, right).extract_28_12(0));
        assertEq(right, Packing.pack_12_16(left, right).extract_28_16(12));
    }

    function testSymbolicPack(bytes12 left, bytes20 right) external pure {
        assertEq(left, Packing.pack_12_20(left, right).extract_32_12(0));
        assertEq(right, Packing.pack_12_20(left, right).extract_32_20(12));
    }

    function testSymbolicPack(bytes16 left, bytes4 right) external pure {
        assertEq(left, Packing.pack_16_4(left, right).extract_20_16(0));
        assertEq(right, Packing.pack_16_4(left, right).extract_20_4(16));
    }

    function testSymbolicPack(bytes16 left, bytes6 right) external pure {
        assertEq(left, Packing.pack_16_6(left, right).extract_22_16(0));
        assertEq(right, Packing.pack_16_6(left, right).extract_22_6(16));
    }

    function testSymbolicPack(bytes16 left, bytes8 right) external pure {
        assertEq(left, Packing.pack_16_8(left, right).extract_24_16(0));
        assertEq(right, Packing.pack_16_8(left, right).extract_24_8(16));
    }

    function testSymbolicPack(bytes16 left, bytes12 right) external pure {
        assertEq(left, Packing.pack_16_12(left, right).extract_28_16(0));
        assertEq(right, Packing.pack_16_12(left, right).extract_28_12(16));
    }

    function testSymbolicPack(bytes16 left, bytes16 right) external pure {
        assertEq(left, Packing.pack_16_16(left, right).extract_32_16(0));
        assertEq(right, Packing.pack_16_16(left, right).extract_32_16(16));
    }

    function testSymbolicPack(bytes20 left, bytes2 right) external pure {
        assertEq(left, Packing.pack_20_2(left, right).extract_22_20(0));
        assertEq(right, Packing.pack_20_2(left, right).extract_22_2(20));
    }

    function testSymbolicPack(bytes20 left, bytes4 right) external pure {
        assertEq(left, Packing.pack_20_4(left, right).extract_24_20(0));
        assertEq(right, Packing.pack_20_4(left, right).extract_24_4(20));
    }

    function testSymbolicPack(bytes20 left, bytes8 right) external pure {
        assertEq(left, Packing.pack_20_8(left, right).extract_28_20(0));
        assertEq(right, Packing.pack_20_8(left, right).extract_28_8(20));
    }

    function testSymbolicPack(bytes20 left, bytes12 right) external pure {
        assertEq(left, Packing.pack_20_12(left, right).extract_32_20(0));
        assertEq(right, Packing.pack_20_12(left, right).extract_32_12(20));
    }

    function testSymbolicPack(bytes22 left, bytes2 right) external pure {
        assertEq(left, Packing.pack_22_2(left, right).extract_24_22(0));
        assertEq(right, Packing.pack_22_2(left, right).extract_24_2(22));
    }

    function testSymbolicPack(bytes22 left, bytes6 right) external pure {
        assertEq(left, Packing.pack_22_6(left, right).extract_28_22(0));
        assertEq(right, Packing.pack_22_6(left, right).extract_28_6(22));
    }

    function testSymbolicPack(bytes22 left, bytes10 right) external pure {
        assertEq(left, Packing.pack_22_10(left, right).extract_32_22(0));
        assertEq(right, Packing.pack_22_10(left, right).extract_32_10(22));
    }

    function testSymbolicPack(bytes24 left, bytes4 right) external pure {
        assertEq(left, Packing.pack_24_4(left, right).extract_28_24(0));
        assertEq(right, Packing.pack_24_4(left, right).extract_28_4(24));
    }

    function testSymbolicPack(bytes24 left, bytes8 right) external pure {
        assertEq(left, Packing.pack_24_8(left, right).extract_32_24(0));
        assertEq(right, Packing.pack_24_8(left, right).extract_32_8(24));
    }

    function testSymbolicPack(bytes28 left, bytes4 right) external pure {
        assertEq(left, Packing.pack_28_4(left, right).extract_32_28(0));
        assertEq(right, Packing.pack_28_4(left, right).extract_32_4(28));
    }

    function testSymbolicReplace(bytes2 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 1));

        bytes1 oldValue = container.extract_2_1(offset);

        assertEq(newValue, container.replace_2_1(newValue, offset).extract_2_1(offset));
        assertEq(container, container.replace_2_1(newValue, offset).replace_2_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes4 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 3));

        bytes1 oldValue = container.extract_4_1(offset);

        assertEq(newValue, container.replace_4_1(newValue, offset).extract_4_1(offset));
        assertEq(container, container.replace_4_1(newValue, offset).replace_4_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes4 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 2));

        bytes2 oldValue = container.extract_4_2(offset);

        assertEq(newValue, container.replace_4_2(newValue, offset).extract_4_2(offset));
        assertEq(container, container.replace_4_2(newValue, offset).replace_4_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes6 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 5));

        bytes1 oldValue = container.extract_6_1(offset);

        assertEq(newValue, container.replace_6_1(newValue, offset).extract_6_1(offset));
        assertEq(container, container.replace_6_1(newValue, offset).replace_6_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes6 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 4));

        bytes2 oldValue = container.extract_6_2(offset);

        assertEq(newValue, container.replace_6_2(newValue, offset).extract_6_2(offset));
        assertEq(container, container.replace_6_2(newValue, offset).replace_6_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes6 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 2));

        bytes4 oldValue = container.extract_6_4(offset);

        assertEq(newValue, container.replace_6_4(newValue, offset).extract_6_4(offset));
        assertEq(container, container.replace_6_4(newValue, offset).replace_6_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes8 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 7));

        bytes1 oldValue = container.extract_8_1(offset);

        assertEq(newValue, container.replace_8_1(newValue, offset).extract_8_1(offset));
        assertEq(container, container.replace_8_1(newValue, offset).replace_8_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes8 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 6));

        bytes2 oldValue = container.extract_8_2(offset);

        assertEq(newValue, container.replace_8_2(newValue, offset).extract_8_2(offset));
        assertEq(container, container.replace_8_2(newValue, offset).replace_8_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes8 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 4));

        bytes4 oldValue = container.extract_8_4(offset);

        assertEq(newValue, container.replace_8_4(newValue, offset).extract_8_4(offset));
        assertEq(container, container.replace_8_4(newValue, offset).replace_8_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes8 container, bytes6 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 2));

        bytes6 oldValue = container.extract_8_6(offset);

        assertEq(newValue, container.replace_8_6(newValue, offset).extract_8_6(offset));
        assertEq(container, container.replace_8_6(newValue, offset).replace_8_6(oldValue, offset));
    }

    function testSymbolicReplace(bytes10 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 9));

        bytes1 oldValue = container.extract_10_1(offset);

        assertEq(newValue, container.replace_10_1(newValue, offset).extract_10_1(offset));
        assertEq(container, container.replace_10_1(newValue, offset).replace_10_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes10 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 8));

        bytes2 oldValue = container.extract_10_2(offset);

        assertEq(newValue, container.replace_10_2(newValue, offset).extract_10_2(offset));
        assertEq(container, container.replace_10_2(newValue, offset).replace_10_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes10 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 6));

        bytes4 oldValue = container.extract_10_4(offset);

        assertEq(newValue, container.replace_10_4(newValue, offset).extract_10_4(offset));
        assertEq(container, container.replace_10_4(newValue, offset).replace_10_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes10 container, bytes6 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 4));

        bytes6 oldValue = container.extract_10_6(offset);

        assertEq(newValue, container.replace_10_6(newValue, offset).extract_10_6(offset));
        assertEq(container, container.replace_10_6(newValue, offset).replace_10_6(oldValue, offset));
    }

    function testSymbolicReplace(bytes10 container, bytes8 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 2));

        bytes8 oldValue = container.extract_10_8(offset);

        assertEq(newValue, container.replace_10_8(newValue, offset).extract_10_8(offset));
        assertEq(container, container.replace_10_8(newValue, offset).replace_10_8(oldValue, offset));
    }

    function testSymbolicReplace(bytes12 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 11));

        bytes1 oldValue = container.extract_12_1(offset);

        assertEq(newValue, container.replace_12_1(newValue, offset).extract_12_1(offset));
        assertEq(container, container.replace_12_1(newValue, offset).replace_12_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes12 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 10));

        bytes2 oldValue = container.extract_12_2(offset);

        assertEq(newValue, container.replace_12_2(newValue, offset).extract_12_2(offset));
        assertEq(container, container.replace_12_2(newValue, offset).replace_12_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes12 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 8));

        bytes4 oldValue = container.extract_12_4(offset);

        assertEq(newValue, container.replace_12_4(newValue, offset).extract_12_4(offset));
        assertEq(container, container.replace_12_4(newValue, offset).replace_12_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes12 container, bytes6 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 6));

        bytes6 oldValue = container.extract_12_6(offset);

        assertEq(newValue, container.replace_12_6(newValue, offset).extract_12_6(offset));
        assertEq(container, container.replace_12_6(newValue, offset).replace_12_6(oldValue, offset));
    }

    function testSymbolicReplace(bytes12 container, bytes8 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 4));

        bytes8 oldValue = container.extract_12_8(offset);

        assertEq(newValue, container.replace_12_8(newValue, offset).extract_12_8(offset));
        assertEq(container, container.replace_12_8(newValue, offset).replace_12_8(oldValue, offset));
    }

    function testSymbolicReplace(bytes12 container, bytes10 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 2));

        bytes10 oldValue = container.extract_12_10(offset);

        assertEq(newValue, container.replace_12_10(newValue, offset).extract_12_10(offset));
        assertEq(container, container.replace_12_10(newValue, offset).replace_12_10(oldValue, offset));
    }

    function testSymbolicReplace(bytes16 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 15));

        bytes1 oldValue = container.extract_16_1(offset);

        assertEq(newValue, container.replace_16_1(newValue, offset).extract_16_1(offset));
        assertEq(container, container.replace_16_1(newValue, offset).replace_16_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes16 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 14));

        bytes2 oldValue = container.extract_16_2(offset);

        assertEq(newValue, container.replace_16_2(newValue, offset).extract_16_2(offset));
        assertEq(container, container.replace_16_2(newValue, offset).replace_16_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes16 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 12));

        bytes4 oldValue = container.extract_16_4(offset);

        assertEq(newValue, container.replace_16_4(newValue, offset).extract_16_4(offset));
        assertEq(container, container.replace_16_4(newValue, offset).replace_16_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes16 container, bytes6 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 10));

        bytes6 oldValue = container.extract_16_6(offset);

        assertEq(newValue, container.replace_16_6(newValue, offset).extract_16_6(offset));
        assertEq(container, container.replace_16_6(newValue, offset).replace_16_6(oldValue, offset));
    }

    function testSymbolicReplace(bytes16 container, bytes8 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 8));

        bytes8 oldValue = container.extract_16_8(offset);

        assertEq(newValue, container.replace_16_8(newValue, offset).extract_16_8(offset));
        assertEq(container, container.replace_16_8(newValue, offset).replace_16_8(oldValue, offset));
    }

    function testSymbolicReplace(bytes16 container, bytes10 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 6));

        bytes10 oldValue = container.extract_16_10(offset);

        assertEq(newValue, container.replace_16_10(newValue, offset).extract_16_10(offset));
        assertEq(container, container.replace_16_10(newValue, offset).replace_16_10(oldValue, offset));
    }

    function testSymbolicReplace(bytes16 container, bytes12 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 4));

        bytes12 oldValue = container.extract_16_12(offset);

        assertEq(newValue, container.replace_16_12(newValue, offset).extract_16_12(offset));
        assertEq(container, container.replace_16_12(newValue, offset).replace_16_12(oldValue, offset));
    }

    function testSymbolicReplace(bytes20 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 19));

        bytes1 oldValue = container.extract_20_1(offset);

        assertEq(newValue, container.replace_20_1(newValue, offset).extract_20_1(offset));
        assertEq(container, container.replace_20_1(newValue, offset).replace_20_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes20 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 18));

        bytes2 oldValue = container.extract_20_2(offset);

        assertEq(newValue, container.replace_20_2(newValue, offset).extract_20_2(offset));
        assertEq(container, container.replace_20_2(newValue, offset).replace_20_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes20 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 16));

        bytes4 oldValue = container.extract_20_4(offset);

        assertEq(newValue, container.replace_20_4(newValue, offset).extract_20_4(offset));
        assertEq(container, container.replace_20_4(newValue, offset).replace_20_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes20 container, bytes6 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 14));

        bytes6 oldValue = container.extract_20_6(offset);

        assertEq(newValue, container.replace_20_6(newValue, offset).extract_20_6(offset));
        assertEq(container, container.replace_20_6(newValue, offset).replace_20_6(oldValue, offset));
    }

    function testSymbolicReplace(bytes20 container, bytes8 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 12));

        bytes8 oldValue = container.extract_20_8(offset);

        assertEq(newValue, container.replace_20_8(newValue, offset).extract_20_8(offset));
        assertEq(container, container.replace_20_8(newValue, offset).replace_20_8(oldValue, offset));
    }

    function testSymbolicReplace(bytes20 container, bytes10 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 10));

        bytes10 oldValue = container.extract_20_10(offset);

        assertEq(newValue, container.replace_20_10(newValue, offset).extract_20_10(offset));
        assertEq(container, container.replace_20_10(newValue, offset).replace_20_10(oldValue, offset));
    }

    function testSymbolicReplace(bytes20 container, bytes12 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 8));

        bytes12 oldValue = container.extract_20_12(offset);

        assertEq(newValue, container.replace_20_12(newValue, offset).extract_20_12(offset));
        assertEq(container, container.replace_20_12(newValue, offset).replace_20_12(oldValue, offset));
    }

    function testSymbolicReplace(bytes20 container, bytes16 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 4));

        bytes16 oldValue = container.extract_20_16(offset);

        assertEq(newValue, container.replace_20_16(newValue, offset).extract_20_16(offset));
        assertEq(container, container.replace_20_16(newValue, offset).replace_20_16(oldValue, offset));
    }

    function testSymbolicReplace(bytes22 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 21));

        bytes1 oldValue = container.extract_22_1(offset);

        assertEq(newValue, container.replace_22_1(newValue, offset).extract_22_1(offset));
        assertEq(container, container.replace_22_1(newValue, offset).replace_22_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes22 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 20));

        bytes2 oldValue = container.extract_22_2(offset);

        assertEq(newValue, container.replace_22_2(newValue, offset).extract_22_2(offset));
        assertEq(container, container.replace_22_2(newValue, offset).replace_22_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes22 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 18));

        bytes4 oldValue = container.extract_22_4(offset);

        assertEq(newValue, container.replace_22_4(newValue, offset).extract_22_4(offset));
        assertEq(container, container.replace_22_4(newValue, offset).replace_22_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes22 container, bytes6 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 16));

        bytes6 oldValue = container.extract_22_6(offset);

        assertEq(newValue, container.replace_22_6(newValue, offset).extract_22_6(offset));
        assertEq(container, container.replace_22_6(newValue, offset).replace_22_6(oldValue, offset));
    }

    function testSymbolicReplace(bytes22 container, bytes8 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 14));

        bytes8 oldValue = container.extract_22_8(offset);

        assertEq(newValue, container.replace_22_8(newValue, offset).extract_22_8(offset));
        assertEq(container, container.replace_22_8(newValue, offset).replace_22_8(oldValue, offset));
    }

    function testSymbolicReplace(bytes22 container, bytes10 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 12));

        bytes10 oldValue = container.extract_22_10(offset);

        assertEq(newValue, container.replace_22_10(newValue, offset).extract_22_10(offset));
        assertEq(container, container.replace_22_10(newValue, offset).replace_22_10(oldValue, offset));
    }

    function testSymbolicReplace(bytes22 container, bytes12 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 10));

        bytes12 oldValue = container.extract_22_12(offset);

        assertEq(newValue, container.replace_22_12(newValue, offset).extract_22_12(offset));
        assertEq(container, container.replace_22_12(newValue, offset).replace_22_12(oldValue, offset));
    }

    function testSymbolicReplace(bytes22 container, bytes16 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 6));

        bytes16 oldValue = container.extract_22_16(offset);

        assertEq(newValue, container.replace_22_16(newValue, offset).extract_22_16(offset));
        assertEq(container, container.replace_22_16(newValue, offset).replace_22_16(oldValue, offset));
    }

    function testSymbolicReplace(bytes22 container, bytes20 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 2));

        bytes20 oldValue = container.extract_22_20(offset);

        assertEq(newValue, container.replace_22_20(newValue, offset).extract_22_20(offset));
        assertEq(container, container.replace_22_20(newValue, offset).replace_22_20(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 23));

        bytes1 oldValue = container.extract_24_1(offset);

        assertEq(newValue, container.replace_24_1(newValue, offset).extract_24_1(offset));
        assertEq(container, container.replace_24_1(newValue, offset).replace_24_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 22));

        bytes2 oldValue = container.extract_24_2(offset);

        assertEq(newValue, container.replace_24_2(newValue, offset).extract_24_2(offset));
        assertEq(container, container.replace_24_2(newValue, offset).replace_24_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 20));

        bytes4 oldValue = container.extract_24_4(offset);

        assertEq(newValue, container.replace_24_4(newValue, offset).extract_24_4(offset));
        assertEq(container, container.replace_24_4(newValue, offset).replace_24_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes6 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 18));

        bytes6 oldValue = container.extract_24_6(offset);

        assertEq(newValue, container.replace_24_6(newValue, offset).extract_24_6(offset));
        assertEq(container, container.replace_24_6(newValue, offset).replace_24_6(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes8 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 16));

        bytes8 oldValue = container.extract_24_8(offset);

        assertEq(newValue, container.replace_24_8(newValue, offset).extract_24_8(offset));
        assertEq(container, container.replace_24_8(newValue, offset).replace_24_8(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes10 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 14));

        bytes10 oldValue = container.extract_24_10(offset);

        assertEq(newValue, container.replace_24_10(newValue, offset).extract_24_10(offset));
        assertEq(container, container.replace_24_10(newValue, offset).replace_24_10(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes12 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 12));

        bytes12 oldValue = container.extract_24_12(offset);

        assertEq(newValue, container.replace_24_12(newValue, offset).extract_24_12(offset));
        assertEq(container, container.replace_24_12(newValue, offset).replace_24_12(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes16 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 8));

        bytes16 oldValue = container.extract_24_16(offset);

        assertEq(newValue, container.replace_24_16(newValue, offset).extract_24_16(offset));
        assertEq(container, container.replace_24_16(newValue, offset).replace_24_16(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes20 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 4));

        bytes20 oldValue = container.extract_24_20(offset);

        assertEq(newValue, container.replace_24_20(newValue, offset).extract_24_20(offset));
        assertEq(container, container.replace_24_20(newValue, offset).replace_24_20(oldValue, offset));
    }

    function testSymbolicReplace(bytes24 container, bytes22 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 2));

        bytes22 oldValue = container.extract_24_22(offset);

        assertEq(newValue, container.replace_24_22(newValue, offset).extract_24_22(offset));
        assertEq(container, container.replace_24_22(newValue, offset).replace_24_22(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 27));

        bytes1 oldValue = container.extract_28_1(offset);

        assertEq(newValue, container.replace_28_1(newValue, offset).extract_28_1(offset));
        assertEq(container, container.replace_28_1(newValue, offset).replace_28_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 26));

        bytes2 oldValue = container.extract_28_2(offset);

        assertEq(newValue, container.replace_28_2(newValue, offset).extract_28_2(offset));
        assertEq(container, container.replace_28_2(newValue, offset).replace_28_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 24));

        bytes4 oldValue = container.extract_28_4(offset);

        assertEq(newValue, container.replace_28_4(newValue, offset).extract_28_4(offset));
        assertEq(container, container.replace_28_4(newValue, offset).replace_28_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes6 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 22));

        bytes6 oldValue = container.extract_28_6(offset);

        assertEq(newValue, container.replace_28_6(newValue, offset).extract_28_6(offset));
        assertEq(container, container.replace_28_6(newValue, offset).replace_28_6(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes8 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 20));

        bytes8 oldValue = container.extract_28_8(offset);

        assertEq(newValue, container.replace_28_8(newValue, offset).extract_28_8(offset));
        assertEq(container, container.replace_28_8(newValue, offset).replace_28_8(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes10 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 18));

        bytes10 oldValue = container.extract_28_10(offset);

        assertEq(newValue, container.replace_28_10(newValue, offset).extract_28_10(offset));
        assertEq(container, container.replace_28_10(newValue, offset).replace_28_10(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes12 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 16));

        bytes12 oldValue = container.extract_28_12(offset);

        assertEq(newValue, container.replace_28_12(newValue, offset).extract_28_12(offset));
        assertEq(container, container.replace_28_12(newValue, offset).replace_28_12(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes16 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 12));

        bytes16 oldValue = container.extract_28_16(offset);

        assertEq(newValue, container.replace_28_16(newValue, offset).extract_28_16(offset));
        assertEq(container, container.replace_28_16(newValue, offset).replace_28_16(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes20 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 8));

        bytes20 oldValue = container.extract_28_20(offset);

        assertEq(newValue, container.replace_28_20(newValue, offset).extract_28_20(offset));
        assertEq(container, container.replace_28_20(newValue, offset).replace_28_20(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes22 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 6));

        bytes22 oldValue = container.extract_28_22(offset);

        assertEq(newValue, container.replace_28_22(newValue, offset).extract_28_22(offset));
        assertEq(container, container.replace_28_22(newValue, offset).replace_28_22(oldValue, offset));
    }

    function testSymbolicReplace(bytes28 container, bytes24 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 4));

        bytes24 oldValue = container.extract_28_24(offset);

        assertEq(newValue, container.replace_28_24(newValue, offset).extract_28_24(offset));
        assertEq(container, container.replace_28_24(newValue, offset).replace_28_24(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes1 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 31));

        bytes1 oldValue = container.extract_32_1(offset);

        assertEq(newValue, container.replace_32_1(newValue, offset).extract_32_1(offset));
        assertEq(container, container.replace_32_1(newValue, offset).replace_32_1(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes2 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 30));

        bytes2 oldValue = container.extract_32_2(offset);

        assertEq(newValue, container.replace_32_2(newValue, offset).extract_32_2(offset));
        assertEq(container, container.replace_32_2(newValue, offset).replace_32_2(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes4 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 28));

        bytes4 oldValue = container.extract_32_4(offset);

        assertEq(newValue, container.replace_32_4(newValue, offset).extract_32_4(offset));
        assertEq(container, container.replace_32_4(newValue, offset).replace_32_4(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes6 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 26));

        bytes6 oldValue = container.extract_32_6(offset);

        assertEq(newValue, container.replace_32_6(newValue, offset).extract_32_6(offset));
        assertEq(container, container.replace_32_6(newValue, offset).replace_32_6(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes8 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 24));

        bytes8 oldValue = container.extract_32_8(offset);

        assertEq(newValue, container.replace_32_8(newValue, offset).extract_32_8(offset));
        assertEq(container, container.replace_32_8(newValue, offset).replace_32_8(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes10 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 22));

        bytes10 oldValue = container.extract_32_10(offset);

        assertEq(newValue, container.replace_32_10(newValue, offset).extract_32_10(offset));
        assertEq(container, container.replace_32_10(newValue, offset).replace_32_10(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes12 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 20));

        bytes12 oldValue = container.extract_32_12(offset);

        assertEq(newValue, container.replace_32_12(newValue, offset).extract_32_12(offset));
        assertEq(container, container.replace_32_12(newValue, offset).replace_32_12(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes16 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 16));

        bytes16 oldValue = container.extract_32_16(offset);

        assertEq(newValue, container.replace_32_16(newValue, offset).extract_32_16(offset));
        assertEq(container, container.replace_32_16(newValue, offset).replace_32_16(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes20 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 12));

        bytes20 oldValue = container.extract_32_20(offset);

        assertEq(newValue, container.replace_32_20(newValue, offset).extract_32_20(offset));
        assertEq(container, container.replace_32_20(newValue, offset).replace_32_20(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes22 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 10));

        bytes22 oldValue = container.extract_32_22(offset);

        assertEq(newValue, container.replace_32_22(newValue, offset).extract_32_22(offset));
        assertEq(container, container.replace_32_22(newValue, offset).replace_32_22(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes24 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 8));

        bytes24 oldValue = container.extract_32_24(offset);

        assertEq(newValue, container.replace_32_24(newValue, offset).extract_32_24(offset));
        assertEq(container, container.replace_32_24(newValue, offset).replace_32_24(oldValue, offset));
    }

    function testSymbolicReplace(bytes32 container, bytes28 newValue, uint8 offset) external pure {
        offset = uint8(bound(offset, 0, 4));

        bytes28 oldValue = container.extract_32_28(offset);

        assertEq(newValue, container.replace_32_28(newValue, offset).extract_32_28(offset));
        assertEq(container, container.replace_32_28(newValue, offset).replace_32_28(oldValue, offset));
    }
}
