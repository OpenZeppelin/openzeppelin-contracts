// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test, stdError} from "forge-std/Test.sol";

import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

contract BytesTest is Test {
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
