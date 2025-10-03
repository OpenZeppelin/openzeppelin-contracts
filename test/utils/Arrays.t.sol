// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SymTest} from "halmos-cheatcodes/SymTest.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";

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

    function testSliceUint256(uint256[] memory values, uint256 start) public pure {
        uint256[] memory result = Arrays.slice(values, start);
        _assertSliceUint256(values, result, start, values.length);
    }

    function testSliceUint256Range(uint256[] memory values, uint256 start, uint256 end) public pure {
        uint256[] memory result = Arrays.slice(values, start, end);
        _assertSliceUint256(values, result, start, end);
    }

    function testSliceBytes32(bytes32[] memory values, uint256 start) public pure {
        bytes32[] memory result = Arrays.slice(values, start);
        _assertSliceBytes32(values, result, start, values.length);
    }

    function testSliceBytes32Range(bytes32[] memory values, uint256 start, uint256 end) public pure {
        bytes32[] memory result = Arrays.slice(values, start, end);
        _assertSliceBytes32(values, result, start, end);
    }

    function testSliceAddress(address[] memory values, uint256 start) public pure {
        address[] memory result = Arrays.slice(values, start);
        _assertSliceAddress(values, result, start, values.length);
    }

    function testSliceAddressRange(address[] memory values, uint256 start, uint256 end) public pure {
        address[] memory result = Arrays.slice(values, start, end);
        _assertSliceAddress(values, result, start, end);
    }

    /// Splice

    function testSpliceUint256(uint256[] memory values, uint256 start) public pure {
        uint256[] memory original = new uint256[](values.length);
        for (uint256 i = 0; i < values.length; i++) {
            original[i] = values[i];
        }

        uint256[] memory result = Arrays.splice(values, start);
        _assertSpliceUint256(original, result, start, original.length);
    }

    function testSpliceUint256Range(uint256[] memory values, uint256 start, uint256 end) public pure {
        uint256[] memory original = new uint256[](values.length);
        for (uint256 i = 0; i < values.length; i++) {
            original[i] = values[i];
        }

        uint256[] memory result = Arrays.splice(values, start, end);
        _assertSpliceUint256(original, result, start, end);
    }

    function testSpliceBytes32(bytes32[] memory values, uint256 start) public pure {
        bytes32[] memory original = new bytes32[](values.length);
        for (uint256 i = 0; i < values.length; i++) {
            original[i] = values[i];
        }

        bytes32[] memory result = Arrays.splice(values, start);
        _assertSpliceBytes32(original, result, start, original.length);
    }

    function testSpliceBytes32Range(bytes32[] memory values, uint256 start, uint256 end) public pure {
        bytes32[] memory original = new bytes32[](values.length);
        for (uint256 i = 0; i < values.length; i++) {
            original[i] = values[i];
        }

        bytes32[] memory result = Arrays.splice(values, start, end);
        _assertSpliceBytes32(original, result, start, end);
    }

    function testSpliceAddress(address[] memory values, uint256 start) public pure {
        address[] memory original = new address[](values.length);
        for (uint256 i = 0; i < values.length; i++) {
            original[i] = values[i];
        }

        address[] memory result = Arrays.splice(values, start);
        _assertSpliceAddress(original, result, start, original.length);
    }

    function testSpliceAddressRange(address[] memory values, uint256 start, uint256 end) public pure {
        address[] memory original = new address[](values.length);
        for (uint256 i = 0; i < values.length; i++) {
            original[i] = values[i];
        }

        address[] memory result = Arrays.splice(values, start, end);
        _assertSpliceAddress(original, result, start, end);
    }

    /// Asserts

    function _assertSort(uint256[] memory values) internal pure {
        for (uint256 i = 1; i < values.length; ++i) {
            assertLe(values[i - 1], values[i]);
        }
    }

    function _assertSliceUint256(
        uint256[] memory original,
        uint256[] memory result,
        uint256 start,
        uint256 end
    ) internal pure {
        uint256 length = original.length;
        end = end > length ? length : end;
        start = start > end ? end : start;

        assertEq(result.length, end - start);

        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], original[start + i]);
        }
    }

    function _assertSliceBytes32(
        bytes32[] memory original,
        bytes32[] memory result,
        uint256 start,
        uint256 end
    ) internal pure {
        uint256 length = original.length;
        end = end > length ? length : end;
        start = start > end ? end : start;

        assertEq(result.length, end - start);

        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], original[start + i]);
        }
    }
    function _assertSliceAddress(
        address[] memory original,
        address[] memory result,
        uint256 start,
        uint256 end
    ) internal pure {
        uint256 length = original.length;
        end = end > length ? length : end;
        start = start > end ? end : start;

        assertEq(result.length, end - start);

        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], original[start + i]);
        }
    }

    function _assertSpliceUint256(
        uint256[] memory original,
        uint256[] memory result,
        uint256 start,
        uint256 end
    ) internal pure {
        uint256 length = original.length;
        end = end > length ? length : end;
        start = start > end ? end : start;

        assertEq(result.length, end - start);

        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], original[start + i]);
        }
    }

    function _assertSpliceBytes32(
        bytes32[] memory original,
        bytes32[] memory result,
        uint256 start,
        uint256 end
    ) internal pure {
        uint256 length = original.length;
        end = end > length ? length : end;
        start = start > end ? end : start;

        assertEq(result.length, end - start);

        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], original[start + i]);
        }
    }

    function _assertSpliceAddress(
        address[] memory original,
        address[] memory result,
        uint256 start,
        uint256 end
    ) internal pure {
        uint256 length = original.length;
        end = end > length ? length : end;
        start = start > end ? end : start;

        assertEq(result.length, end - start);

        for (uint256 i = 0; i < result.length; i++) {
            assertEq(result[i], original[start + i]);
        }
    }
}
