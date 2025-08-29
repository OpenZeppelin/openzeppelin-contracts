// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

contract BytesTest is Test {
    using Bytes for bytes;

    function testSymbolicEqual(bytes memory a) public pure {
        assertTrue(Bytes.equal(a, a));
    }

    // INDEX OF
    function testSymbolicIndexOf(bytes memory buffer, bytes1 s) public pure {
        uint256 result = Bytes.indexOf(buffer, s);

        if (buffer.length == 0) {
            // Case 0: buffer is empty
            assertEq(result, type(uint256).max);
        } else if (result == type(uint256).max) {
            // Case 1: search value could not be found
            for (uint256 i = 0; i < buffer.length; ++i) assertNotEq(buffer[i], s);
        } else {
            // Case 2: search value was found
            assertEq(buffer[result], s);
            // search value is not present anywhere before the found location
            for (uint256 i = 0; i < result; ++i) assertNotEq(buffer[i], s);
        }
    }

    function testIndexOf(bytes memory buffer, bytes1 s, uint256 pos) public pure {
        uint256 result = Bytes.indexOf(buffer, s, pos);

        if (buffer.length == 0) {
            // Case 0: buffer is empty
            assertEq(result, type(uint256).max);
        } else if (result == type(uint256).max) {
            // Case 1: search value could not be found
            for (uint256 i = pos; i < buffer.length; ++i) assertNotEq(buffer[i], s);
        } else {
            // Case 2: search value was found
            assertEq(buffer[result], s);
            // search value is not present anywhere before the found location
            for (uint256 i = pos; i < result; ++i) assertNotEq(buffer[i], s);
        }
    }

    function testSymbolicLastIndexOf(bytes memory buffer, bytes1 s) public pure {
        uint256 result = Bytes.lastIndexOf(buffer, s);

        if (buffer.length == 0) {
            // Case 0: buffer is empty
            assertEq(result, type(uint256).max);
        } else if (result == type(uint256).max) {
            // Case 1: search value could not be found
            for (uint256 i = 0; i < buffer.length; ++i) assertNotEq(buffer[i], s);
        } else {
            // Case 2: search value was found
            assertEq(buffer[result], s);
            // search value is not present anywhere after the found location
            for (uint256 i = result + 1; i < buffer.length; ++i) assertNotEq(buffer[i], s);
        }
    }

    function testLastIndexOf(bytes memory buffer, bytes1 s, uint256 pos) public pure {
        uint256 result = Bytes.lastIndexOf(buffer, s, pos);

        if (buffer.length == 0) {
            // Case 0: buffer is empty
            assertEq(result, type(uint256).max);
        } else if (result == type(uint256).max) {
            // Case 1: search value could not be found
            for (uint256 i = 0; i <= Math.min(pos, buffer.length - 1); ++i) assertNotEq(buffer[i], s);
        } else {
            // Case 2: search value was found
            assertEq(buffer[result], s);
            // search value is not present anywhere after the found location
            for (uint256 i = result + 1; i <= Math.min(pos, buffer.length - 1); ++i) assertNotEq(buffer[i], s);
        }
    }

    // SLICES
    function testSliceWithStartOnly(bytes memory buffer, uint256 start) public pure {
        bytes memory originalBuffer = bytes.concat(buffer);
        bytes memory result = buffer.slice(start);

        // Original buffer was not modified
        assertEq(buffer, originalBuffer);

        // Should return bytes from start to end
        assertEq(result.length, Math.saturatingSub(buffer.length, start));

        // Verify content matches
        for (uint256 i = 0; i < result.length; ++i) {
            assertEq(result[i], buffer[start + i]);
        }
    }

    function testSlice(bytes memory buffer, uint256 start, uint256 end) public pure {
        bytes memory originalBuffer = bytes.concat(buffer);
        bytes memory result = buffer.slice(start, end);

        // Original buffer was not modified
        assertEq(buffer, originalBuffer);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = Math.min(end, buffer.length);
        uint256 sanitizedStart = Math.min(start, sanitizedEnd);
        uint256 expectedLength = sanitizedEnd - sanitizedStart;

        assertEq(result.length, expectedLength);

        // Verify content matches when there's content to verify
        for (uint256 i = 0; i < result.length; ++i) {
            assertEq(result[i], buffer[sanitizedStart + i]);
        }
    }

    function testSpliceWithStartOnly(bytes memory buffer, uint256 start) public pure {
        bytes memory originalBuffer = bytes.concat(buffer);
        bytes memory result = buffer.splice(start);

        // Result should be the same object as input (modified in place)
        assertEq(result, buffer);

        // Should contain bytes from start to end, moved to beginning
        assertEq(result.length, Math.saturatingSub(originalBuffer.length, start));

        // Verify content matches moved content
        for (uint256 i = 0; i < result.length; ++i) {
            assertEq(result[i], originalBuffer[start + i]);
        }
    }

    function testSplice(bytes memory buffer, uint256 start, uint256 end) public pure {
        bytes memory originalBuffer = bytes.concat(buffer);
        bytes memory result = buffer.splice(start, end);

        // Result should be the same object as input (modified in place)
        assertEq(result, buffer);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = Math.min(end, originalBuffer.length);
        uint256 sanitizedStart = Math.min(start, sanitizedEnd);
        uint256 expectedLength = sanitizedEnd - sanitizedStart;

        assertEq(result.length, expectedLength);

        // Verify content matches moved content
        for (uint256 i = 0; i < result.length; ++i) {
            assertEq(result[i], originalBuffer[sanitizedStart + i]);
        }
    }

    // REVERSE BITS
    function testSymbolicReverseBytes32(bytes32 value) public pure {
        assertEq(Bytes.reverseBytes32(Bytes.reverseBytes32(value)), value);
    }

    function testSymbolicReverseBytes16(bytes16 value) public pure {
        assertEq(Bytes.reverseBytes16(Bytes.reverseBytes16(value)), value);
    }

    function testSymbolicReverseBytes16Dirty(bytes16 value) public pure {
        assertEq(Bytes.reverseBytes16(Bytes.reverseBytes16(_dirtyBytes16(value))), value);
        assertEq(Bytes.reverseBytes16(_dirtyBytes16(Bytes.reverseBytes16(value))), value);
    }

    function testSymbolicReverseBytes8(bytes8 value) public pure {
        assertEq(Bytes.reverseBytes8(Bytes.reverseBytes8(value)), value);
    }

    function testSymbolicReverseBytes8Dirty(bytes8 value) public pure {
        assertEq(Bytes.reverseBytes8(Bytes.reverseBytes8(_dirtyBytes8(value))), value);
        assertEq(Bytes.reverseBytes8(_dirtyBytes8(Bytes.reverseBytes8(value))), value);
    }

    function testSymbolicReverseBytes4(bytes4 value) public pure {
        assertEq(Bytes.reverseBytes4(Bytes.reverseBytes4(value)), value);
    }

    function testSymbolicReverseBytes4Dirty(bytes4 value) public pure {
        assertEq(Bytes.reverseBytes4(Bytes.reverseBytes4(_dirtyBytes4(value))), value);
        assertEq(Bytes.reverseBytes4(_dirtyBytes4(Bytes.reverseBytes4(value))), value);
    }

    function testSymbolicReverseBytes2(bytes2 value) public pure {
        assertEq(Bytes.reverseBytes2(Bytes.reverseBytes2(value)), value);
    }

    function testSymbolicReverseBytes2Dirty(bytes2 value) public pure {
        assertEq(Bytes.reverseBytes2(Bytes.reverseBytes2(_dirtyBytes2(value))), value);
        assertEq(Bytes.reverseBytes2(_dirtyBytes2(Bytes.reverseBytes2(value))), value);
    }

    // CLZ (Count Leading Zeros)
    function testClz(bytes memory buffer) public pure {
        uint256 result = Bytes.clz(buffer);

        // index and offset of the first non zero bit
        uint256 index = result / 8;
        uint256 offset = result % 8;

        // Result should never exceed buffer length
        assertLe(index, buffer.length);

        // All bytes before index position must be zero
        for (uint256 i = 0; i < index; ++i) {
            assertEq(buffer[i], 0);
        }

        // If index < buffer.length, byte at index position must be non-zero
        if (index < buffer.length) {
            // bit at position offset must be non zero
            bytes1 singleBitMask = bytes1(0x80) >> offset;
            assertEq(buffer[index] & singleBitMask, singleBitMask);

            // all bits before offset must be zero
            bytes1 multiBitsMask = bytes1(0xff) << (8 - offset);
            assertEq(buffer[index] & multiBitsMask, 0);
        }
    }

    // Helpers
    function _dirtyBytes16(bytes16 value) private pure returns (bytes16 dirty) {
        assembly ("memory-safe") {
            dirty := or(value, shr(128, not(0)))
        }
    }

    function _dirtyBytes8(bytes8 value) private pure returns (bytes8 dirty) {
        assembly ("memory-safe") {
            dirty := or(value, shr(192, not(0)))
        }
    }

    function _dirtyBytes4(bytes4 value) private pure returns (bytes4 dirty) {
        assembly ("memory-safe") {
            dirty := or(value, shr(224, not(0)))
        }
    }

    function _dirtyBytes2(bytes2 value) private pure returns (bytes2 dirty) {
        assembly ("memory-safe") {
            dirty := or(value, shr(240, not(0)))
        }
    }
}
