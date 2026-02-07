// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SymTest} from "halmos-cheatcodes/SymTest.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract ArraysTest is Test, SymTest {
    function testSort(uint256[] memory values) public pure {
        Arrays.sort(values);
        _assertSort(values);
    }

    function symbolicSort() public pure {
        uint256[] memory values = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            values[i] = svm.createUint256("arrayElement");
        }
        Arrays.sort(values);
        _assertSort(values);
    }

    /// Slice

    function testSliceAddressWithStartOnly(address[] memory values, uint256 start) public pure {
        address[] memory originalValues = _copyArray(values);
        address[] memory result = Arrays.slice(values, start);

        // Original buffer was not modified
        assertEq(values, originalValues);

        // Result should match originalValues over the specified slice
        uint256 expectedLength = Math.saturatingSub(values.length, start);
        _assertSliceOf(result, originalValues, start, expectedLength);
    }

    function testSliceAddress(address[] memory values, uint256 start, uint256 end) public pure {
        address[] memory originalValues = _copyArray(values);
        address[] memory result = Arrays.slice(values, start, end);

        // Original buffer was not modified
        assertEq(values, originalValues);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = Math.min(end, values.length);
        uint256 sanitizedStart = Math.min(start, sanitizedEnd);
        uint256 expectedLength = sanitizedEnd - sanitizedStart;
        _assertSliceOf(result, originalValues, sanitizedStart, expectedLength);
    }

    function testSliceBytes32WithStartOnly(bytes32[] memory values, uint256 start) public pure {
        bytes32[] memory originalValues = _copyArray(values);
        bytes32[] memory result = Arrays.slice(values, start);

        // Original buffer was not modified
        assertEq(values, originalValues);

        // Result should match originalValues over the specified slice
        uint256 expectedLength = Math.saturatingSub(values.length, start);
        _assertSliceOf(result, originalValues, start, expectedLength);
    }

    function testSliceBytes32(bytes32[] memory values, uint256 start, uint256 end) public pure {
        bytes32[] memory originalValues = _copyArray(values);
        bytes32[] memory result = Arrays.slice(values, start, end);

        // Original buffer was not modified
        assertEq(values, originalValues);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = Math.min(end, values.length);
        uint256 sanitizedStart = Math.min(start, sanitizedEnd);
        uint256 expectedLength = sanitizedEnd - sanitizedStart;
        _assertSliceOf(result, originalValues, sanitizedStart, expectedLength);
    }

    function testSliceUint256WithStartOnly(uint256[] memory values, uint256 start) public pure {
        uint256[] memory originalValues = _copyArray(values);
        uint256[] memory result = Arrays.slice(values, start);

        // Original buffer was not modified
        assertEq(values, originalValues);

        // Result should match originalValues over the specified slice
        uint256 expectedLength = Math.saturatingSub(values.length, start);
        _assertSliceOf(result, originalValues, start, expectedLength);
    }

    function testSliceUint256(uint256[] memory values, uint256 start, uint256 end) public pure {
        uint256[] memory originalValues = _copyArray(values);
        uint256[] memory result = Arrays.slice(values, start, end);

        // Original buffer was not modified
        assertEq(values, originalValues);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = Math.min(end, values.length);
        uint256 sanitizedStart = Math.min(start, sanitizedEnd);
        uint256 expectedLength = sanitizedEnd - sanitizedStart;
        _assertSliceOf(result, originalValues, sanitizedStart, expectedLength);
    }

    /// Splice

    function testSpliceAddressWithStartOnly(address[] memory values, uint256 start) public pure {
        address[] memory originalValues = _copyArray(values);
        address[] memory result = Arrays.splice(values, start);

        // Result should be the same object as input (modified in place)
        assertEq(result, values);

        // Result should match originalValues over the specified slice
        uint256 expectedLength = Math.saturatingSub(originalValues.length, start);
        _assertSliceOf(result, originalValues, start, expectedLength);
    }

    function testSpliceAddress(address[] memory values, uint256 start, uint256 end) public pure {
        address[] memory originalValues = _copyArray(values);
        address[] memory result = Arrays.splice(values, start, end);

        // Result should be the same object as input (modified in place)
        assertEq(result, values);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = Math.min(end, originalValues.length);
        uint256 sanitizedStart = Math.min(start, sanitizedEnd);
        uint256 expectedLength = sanitizedEnd - sanitizedStart;
        _assertSliceOf(result, originalValues, sanitizedStart, expectedLength);
    }

    function testSpliceBytes32WithStartOnly(bytes32[] memory values, uint256 start) public pure {
        bytes32[] memory originalValues = _copyArray(values);
        bytes32[] memory result = Arrays.splice(values, start);

        // Result should be the same object as input (modified in place)
        assertEq(result, values);

        // Result should match originalValues over the specified slice
        uint256 expectedLength = Math.saturatingSub(originalValues.length, start);
        _assertSliceOf(result, originalValues, start, expectedLength);
    }

    function testSpliceBytes32(bytes32[] memory values, uint256 start, uint256 end) public pure {
        bytes32[] memory originalValues = _copyArray(values);
        bytes32[] memory result = Arrays.splice(values, start, end);

        // Result should be the same object as input (modified in place)
        assertEq(result, values);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = Math.min(end, originalValues.length);
        uint256 sanitizedStart = Math.min(start, sanitizedEnd);
        uint256 expectedLength = sanitizedEnd - sanitizedStart;
        _assertSliceOf(result, originalValues, sanitizedStart, expectedLength);
    }

    function testSpliceUint256WithStartOnly(uint256[] memory values, uint256 start) public pure {
        uint256[] memory originalValues = _copyArray(values);
        uint256[] memory result = Arrays.splice(values, start);

        // Result should be the same object as input (modified in place)
        assertEq(result, values);

        // Result should match originalValues over the specified slice
        uint256 expectedLength = Math.saturatingSub(originalValues.length, start);
        _assertSliceOf(result, originalValues, start, expectedLength);
    }

    function testSpliceUint256(uint256[] memory values, uint256 start, uint256 end) public pure {
        uint256[] memory originalValues = _copyArray(values);
        uint256[] memory result = Arrays.splice(values, start, end);

        // Result should be the same object as input (modified in place)
        assertEq(result, values);

        // Calculate expected bounds after sanitization
        uint256 sanitizedEnd = Math.min(end, originalValues.length);
        uint256 sanitizedStart = Math.min(start, sanitizedEnd);
        uint256 expectedLength = sanitizedEnd - sanitizedStart;
        _assertSliceOf(result, originalValues, sanitizedStart, expectedLength);
    }

    function testReplaceAddress(address[] memory buffer, uint256 pos, address[] memory replacement) public pure {
        address[] memory originalBuffer = _copyArray(buffer);
        address[] memory originalReplacement = _copyArray(replacement);
        address[] memory result = Arrays.replace(buffer, pos, replacement);

        // Result should be the same object as input (modified in place)
        assertEq(result, buffer);

        // Buffer length should remain unchanged
        assertEq(result.length, originalBuffer.length);

        // The replacement is not modified
        assertEq(replacement, originalReplacement);

        for (uint256 i = 0; i < buffer.length; ++i) {
            if (i < pos) {
                assertEq(result[i], originalBuffer[i]);
            } else if (i < pos + replacement.length) {
                assertEq(result[i], replacement[i - pos]);
            } else {
                assertEq(result[i], originalBuffer[i]);
            }
        }
    }

    function testReplaceAddressFull(
        address[] memory buffer,
        uint256 pos,
        address[] memory replacement,
        uint256 offset,
        uint256 length
    ) public pure {
        address[] memory originalBuffer = _copyArray(buffer);
        address[] memory originalReplacement = _copyArray(replacement);
        address[] memory result = Arrays.replace(buffer, pos, replacement, offset, length);

        // Result should be the same object as input (modified in place)
        assertEq(result, buffer);

        // Buffer length should remain unchanged
        assertEq(result.length, originalBuffer.length);

        // The replacement is not modified
        assertEq(replacement, originalReplacement);

        for (uint256 i = 0; i < buffer.length; ++i) {
            if (i < pos) {
                assertEq(result[i], originalBuffer[i]);
            } else if (i < pos + Math.min(Math.saturatingSub(replacement.length, offset), length)) {
                assertEq(result[i], replacement[i - pos + offset]);
            } else {
                assertEq(result[i], originalBuffer[i]);
            }
        }
    }

    function testReplaceBytes32(bytes32[] memory buffer, uint256 pos, bytes32[] memory replacement) public pure {
        bytes32[] memory originalBuffer = _copyArray(buffer);
        bytes32[] memory originalReplacement = _copyArray(replacement);
        bytes32[] memory result = Arrays.replace(buffer, pos, replacement);

        // Result should be the same object as input (modified in place)
        assertEq(result, buffer);

        // Buffer length should remain unchanged
        assertEq(result.length, originalBuffer.length);

        // The replacement is not modified
        assertEq(replacement, originalReplacement);

        for (uint256 i = 0; i < buffer.length; ++i) {
            if (i < pos) {
                assertEq(result[i], originalBuffer[i]);
            } else if (i < pos + replacement.length) {
                assertEq(result[i], replacement[i - pos]);
            } else {
                assertEq(result[i], originalBuffer[i]);
            }
        }
    }

    function testReplaceBytes32Full(
        bytes32[] memory buffer,
        uint256 pos,
        bytes32[] memory replacement,
        uint256 offset,
        uint256 length
    ) public pure {
        bytes32[] memory originalBuffer = _copyArray(buffer);
        bytes32[] memory originalReplacement = _copyArray(replacement);
        bytes32[] memory result = Arrays.replace(buffer, pos, replacement, offset, length);

        // Result should be the same object as input (modified in place)
        assertEq(result, buffer);

        // Buffer length should remain unchanged
        assertEq(result.length, originalBuffer.length);

        // The replacement is not modified
        assertEq(replacement, originalReplacement);

        for (uint256 i = 0; i < buffer.length; ++i) {
            if (i < pos) {
                assertEq(result[i], originalBuffer[i]);
            } else if (i < pos + Math.min(Math.saturatingSub(replacement.length, offset), length)) {
                assertEq(result[i], replacement[i - pos + offset]);
            } else {
                assertEq(result[i], originalBuffer[i]);
            }
        }
    }

    function testReplaceUint256(uint256[] memory buffer, uint256 pos, uint256[] memory replacement) public pure {
        uint256[] memory originalBuffer = _copyArray(buffer);
        uint256[] memory originalReplacement = _copyArray(replacement);
        uint256[] memory result = Arrays.replace(buffer, pos, replacement);

        // Result should be the same object as input (modified in place)
        assertEq(result, buffer);

        // Buffer length should remain unchanged
        assertEq(result.length, originalBuffer.length);

        // The replacement is not modified
        assertEq(replacement, originalReplacement);

        for (uint256 i = 0; i < buffer.length; ++i) {
            if (i < pos) {
                assertEq(result[i], originalBuffer[i]);
            } else if (i < pos + replacement.length) {
                assertEq(result[i], replacement[i - pos]);
            } else {
                assertEq(result[i], originalBuffer[i]);
            }
        }
    }

    function testReplaceUint256Full(
        uint256[] memory buffer,
        uint256 pos,
        uint256[] memory replacement,
        uint256 offset,
        uint256 length
    ) public pure {
        uint256[] memory originalBuffer = _copyArray(buffer);
        uint256[] memory originalReplacement = _copyArray(replacement);
        uint256[] memory result = Arrays.replace(buffer, pos, replacement, offset, length);

        // Result should be the same object as input (modified in place)
        assertEq(result, buffer);

        // Buffer length should remain unchanged
        assertEq(result.length, originalBuffer.length);

        // The replacement is not modified
        assertEq(replacement, originalReplacement);

        for (uint256 i = 0; i < buffer.length; ++i) {
            if (i < pos) {
                assertEq(result[i], originalBuffer[i]);
            } else if (i < pos + Math.min(Math.saturatingSub(replacement.length, offset), length)) {
                assertEq(result[i], replacement[i - pos + offset]);
            } else {
                assertEq(result[i], originalBuffer[i]);
            }
        }
    }

    /// Asserts

    function _assertSort(uint256[] memory values) internal pure {
        for (uint256 i = 1; i < values.length; ++i) {
            assertLe(values[i - 1], values[i]);
        }
    }

    function _assertSliceOf(
        address[] memory result,
        address[] memory original,
        uint256 offset,
        uint256 expectedLength
    ) internal pure {
        assertEq(result.length, expectedLength);
        for (uint256 i = 0; i < expectedLength; ++i) {
            assertEq(result[i], original[offset + i]);
        }
    }

    function _assertSliceOf(
        bytes32[] memory result,
        bytes32[] memory original,
        uint256 offset,
        uint256 expectedLength
    ) internal pure {
        assertEq(result.length, expectedLength);
        for (uint256 i = 0; i < expectedLength; ++i) {
            assertEq(result[i], original[offset + i]);
        }
    }

    function _assertSliceOf(
        uint256[] memory result,
        uint256[] memory original,
        uint256 offset,
        uint256 expectedLength
    ) internal pure {
        assertEq(result.length, expectedLength);
        for (uint256 i = 0; i < expectedLength; ++i) {
            assertEq(result[i], original[offset + i]);
        }
    }

    /// Helpers

    function _copyArray(uint256[] memory values) internal pure returns (uint256[] memory) {
        uint256[] memory copy = new uint256[](values.length);
        for (uint256 i = 0; i < values.length; ++i) copy[i] = values[i];
        return copy;
    }

    function _copyArray(bytes32[] memory values) internal pure returns (bytes32[] memory) {
        bytes32[] memory copy = new bytes32[](values.length);
        for (uint256 i = 0; i < values.length; ++i) copy[i] = values[i];
        return copy;
    }

    function _copyArray(address[] memory values) internal pure returns (address[] memory) {
        address[] memory copy = new address[](values.length);
        for (uint256 i = 0; i < values.length; ++i) copy[i] = values[i];
        return copy;
    }
}
