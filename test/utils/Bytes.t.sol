// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

contract BytesTest is Test {
    using Bytes for bytes;

    function testSliceWithStartOnly(bytes memory buffer, uint256 start) public pure {
        bytes32 hashBefore = keccak256(buffer);
        bytes memory result = buffer.slice(start);
        bytes32 hashAfter = keccak256(buffer);

        // Original buffer was not modified
        assertEq(hashBefore, hashAfter);

        // Should return bytes from start to end
        assertEq(result.length, Math.saturatingSub(buffer.length, start));

        // Verify content matches
        for (uint256 i = 0; i < result.length; ++i) {
            assertEq(result[i], buffer[start + i]);
        }
    }

    function testSlice(bytes memory buffer, uint256 start, uint256 end) public pure {
        bytes32 hashBefore = keccak256(buffer);
        bytes memory result = buffer.slice(start, end);
        bytes32 hashAfter = keccak256(buffer);

        // Original buffer was not modified
        assertEq(hashBefore, hashAfter);

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
}
