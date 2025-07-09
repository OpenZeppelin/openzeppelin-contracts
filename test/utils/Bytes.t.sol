// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test, stdError} from "forge-std/Test.sol";

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
        assertEq(Bytes.reverseBytes16(Bytes.reverseBytes16(_dirtyBytes128(value))), value);
    }

    function testSymbolicReverseBytes8(bytes8 value) public pure {
        assertEq(Bytes.reverseBytes8(Bytes.reverseBytes8(value)), value);
    }

    function testSymbolicReverseBytes8Dirty(bytes8 value) public pure {
        assertEq(Bytes.reverseBytes8(Bytes.reverseBytes8(_dirtyBytes64(value))), value);
    }

    function testSymbolicReverseBytes4(bytes4 value) public pure {
        assertEq(Bytes.reverseBytes4(Bytes.reverseBytes4(value)), value);
    }

    function testSymbolicReverseBytes4Dirty(bytes4 value) public pure {
        assertEq(Bytes.reverseBytes4(Bytes.reverseBytes4(_dirtyBytes32(value))), value);
    }

    function testSymbolicReverseBytes2(bytes2 value) public pure {
        assertEq(Bytes.reverseBytes2(Bytes.reverseBytes2(value)), value);
    }

    function testSymbolicReverseBytes2Dirty(bytes2 value) public pure {
        assertEq(Bytes.reverseBytes2(Bytes.reverseBytes2(_dirtyBytes16(value))), value);
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
