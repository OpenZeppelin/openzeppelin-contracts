// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

contract BytesTest is Test {
    using Bytes for bytes;

    function testSliceWithStartOnly(bytes memory buffer, uint256 start) public pure {
        start = bound(start, 0, buffer.length);
        bytes memory result = buffer.slice(start);

        // Should return bytes from start to end
        assertEq(result.length, buffer.length - start);

        // Verify content matches
        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], buffer[start + i]);
        }

        // Original buffer should remain unchanged
        assertEq(buffer.length, buffer.length);
        for (uint256 i = 0; i < buffer.length; i++) {
            assertEq(buffer[i], buffer[i]);
        }
    }

    function testSlice(bytes memory buffer, uint256 start, uint256 end) public pure {
        bytes memory result = buffer.slice(start, end);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = end > buffer.length ? buffer.length : end;
        uint256 sanitizedStart = start > sanitizedEnd ? sanitizedEnd : start;
        uint256 expectedLength = sanitizedEnd - sanitizedStart;

        assertEq(result.length, expectedLength);

        // Verify content matches when there's content to verify
        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], buffer[sanitizedStart + i]);
        }
    }

    function testSpliceWithStartOnly(bytes memory buffer, uint256 start) public pure {
        start = bound(start, 0, buffer.length);
        bytes memory originalBuffer = new bytes(buffer.length);
        for (uint256 i = 0; i < buffer.length; i++) {
            originalBuffer[i] = buffer[i];
        }

        bytes memory result = buffer.splice(start);

        // Result should be the same object as input (modified in place)
        assertEq(result.length == buffer.length, true);

        // Should contain bytes from start to end, moved to beginning
        assertEq(result.length, originalBuffer.length - start);

        // Verify content matches moved content
        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], originalBuffer[start + i]);
        }
    }

    function testSplice(bytes memory buffer, uint256 start, uint256 end) public pure {
        bytes memory originalBuffer = new bytes(buffer.length);
        for (uint256 i = 0; i < buffer.length; i++) {
            originalBuffer[i] = buffer[i];
        }

        bytes memory result = buffer.splice(start, end);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = end > originalBuffer.length ? originalBuffer.length : end;
        uint256 sanitizedStart = start > sanitizedEnd ? sanitizedEnd : start;
        uint256 expectedLength = sanitizedEnd - sanitizedStart;

        assertEq(result.length, expectedLength);

        // Verify content matches moved content
        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], originalBuffer[sanitizedStart + i]);
        }
    }
}
