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

    function testSymbolicCountLeadingZeroes(uint256 x) public pure {
        uint256 result = Bytes.clz(x);
        assertLe(result, 32); // [0, 32]

        if (x != 0) {
            uint256 firstNonZeroBytePos = 32 - result - 1;
            uint256 byteValue = (x >> (firstNonZeroBytePos * 8)) & 0xff;
            assertNotEq(byteValue, 0);

            // x != 0 implies result < 32
            // most significant byte should be non-zero
            uint256 msbValue = (x >> (248 - result * 8)) & 0xff;
            assertNotEq(msbValue, 0);
        }
    }

    // REVERSE BITS
    function testSymbolicReverseBits256(bytes32 value) public pure {
        assertEq(Bytes.reverseBits256(Bytes.reverseBits256(value)), value);
    }

    function testSymbolicReverseBits128(bytes16 value) public pure {
        assertEq(Bytes.reverseBits128(Bytes.reverseBits128(value)), value);
    }

    function testSymbolicReverseBits128Dirty(bytes16 value) public pure {
        assertEq(Bytes.reverseBits128(Bytes.reverseBits128(_dirtyBytes128(value))), value);
    }

    function testSymbolicReverseBits64(bytes8 value) public pure {
        assertEq(Bytes.reverseBits64(Bytes.reverseBits64(value)), value);
    }

    function testSymbolicReverseBits64Dirty(bytes8 value) public pure {
        assertEq(Bytes.reverseBits64(Bytes.reverseBits64(_dirtyBytes64(value))), value);
    }

    function testSymbolicReverseBits32(bytes4 value) public pure {
        assertEq(Bytes.reverseBits32(Bytes.reverseBits32(value)), value);
    }

    function testSymbolicReverseBits32Dirty(bytes4 value) public pure {
        assertEq(Bytes.reverseBits32(Bytes.reverseBits32(_dirtyBytes32(value))), value);
    }

    function testSymbolicReverseBits16(bytes2 value) public pure {
        assertEq(Bytes.reverseBits16(Bytes.reverseBits16(value)), value);
    }

    function testSymbolicReverseBits16Dirty(bytes2 value) public pure {
        assertEq(Bytes.reverseBits16(Bytes.reverseBits16(_dirtyBytes16(value))), value);
    }

    // Helpers
    function _dirtyBytes128(bytes16 value) private pure returns (bytes16) {
        bytes16 dirty = value;
        assembly ("memory-safe") {
            dirty := or(dirty, shr(128, not(0)))
        }
        return dirty;
    }

    function _dirtyBytes64(bytes8 value) private pure returns (bytes8) {
        bytes8 dirty = value;
        assembly ("memory-safe") {
            dirty := or(dirty, shr(192, not(0)))
        }
        return dirty;
    }

    function _dirtyBytes32(bytes4 value) private pure returns (bytes4) {
        bytes4 dirty = value;
        assembly ("memory-safe") {
            dirty := or(dirty, shr(224, not(0)))
        }
        return dirty;
    }

    function _dirtyBytes16(bytes2 value) private pure returns (bytes2) {
        bytes2 dirty = value;
        assembly ("memory-safe") {
            dirty := or(dirty, shr(240, not(0)))
        }
        return dirty;
    }
}
