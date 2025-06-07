// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

contract BytesTest is Test {
    function testIndexOf(bytes memory buffer, bytes1 s) public pure {
        testIndexOf(buffer, s, 0);
    }

    function testIndexOf(bytes memory buffer, bytes1 s, uint256 pos) public pure {
        uint256 result = Bytes.indexOf(buffer, s, pos);

        // Should not be found before result
        for (uint256 i = pos; result != type(uint256).max && i < result; i++) assertNotEq(buffer[i], s);
        if (result != type(uint256).max) assertEq(buffer[result], s);
    }

    function testLastIndexOf(bytes memory buffer, bytes1 s) public pure {
        testLastIndexOf(buffer, s, 0);
    }

    function testLastIndexOf(bytes memory buffer, bytes1 s, uint256 pos) public pure {
        pos = bound(pos, 0, buffer.length);
        uint256 result = Bytes.lastIndexOf(buffer, s, pos);

        // Should not be found before result
        for (uint256 i = pos; result != type(uint256).max && i < result; i++) assertNotEq(buffer[i], s);
        if (result != type(uint256).max) assertEq(buffer[result], s);
    }

    function testSlice(bytes memory buffer, uint256 start) public pure {
        testSlice(buffer, start, buffer.length);
    }

    function testSlice(bytes memory buffer, uint256 start, uint256 end) public pure {
        bytes memory result = Bytes.slice(buffer, start, end);
        uint256 sanitizedEnd = Math.min(end, buffer.length);
        uint256 sanitizedStart = Math.min(start, sanitizedEnd);
        assertEq(result.length, sanitizedEnd - sanitizedStart);
        for (uint256 i = 0; i < result.length; i++) assertEq(result[i], buffer[sanitizedStart + i]);
    }

    function testNibbles(bytes memory value) public pure {
        bytes memory result = Bytes.nibbles(value);
        assertEq(result.length, value.length * 2);
        for (uint256 i = 0; i < value.length; i++) {
            bytes1 originalByte = value[i];
            bytes1 highNibble = result[i * 2];
            bytes1 lowNibble = result[i * 2 + 1];

            assertEq(highNibble, originalByte & 0xf0);
            assertEq(lowNibble, originalByte & 0x0f);
        }
    }

    function testSymbolicEqual(bytes memory a, bytes memory b) public pure {
        assertEq(Bytes.equal(a, b), Bytes.equal(a, b));
    }

    function testSymbolicCountLeadingZeroes(uint256 x) public pure {
        uint256 result = Bytes.countLeadingZeroes(x);
        assertLe(result, 31);
        uint256 firstNonZeroByte = 31 - result;
        uint256 byteValue = (x >> (firstNonZeroByte * 8)) & 0xff;
        assertTrue(byteValue > 0 || x == 0);
        for (uint256 i = 0; i < result; i++) assertEq((x >> ((31 - i) * 8)) & 0xff, 0);
    }
}
