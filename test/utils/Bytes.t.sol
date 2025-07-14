// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

contract BytesTest is Test {
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
