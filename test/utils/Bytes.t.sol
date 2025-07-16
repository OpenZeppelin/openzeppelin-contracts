// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

contract BytesTest is Test {
    using Bytes for bytes;

    // INDEX OF
    function testIndexOf(bytes memory buffer, bytes1 s) public pure {
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

    function testLastIndexOf(bytes memory buffer, bytes1 s) public pure {
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
}
