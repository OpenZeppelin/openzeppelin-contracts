// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";
import {Memory} from "@openzeppelin/contracts/utils/Memory.sol";

contract MemoryTest is Test {
    using Bytes for *;
    using Memory for *;

    // - first 0x80 bytes are reserved (scratch + FMP + zero)
    uint256 constant START_PTR = 0x80;
    // - moving the free memory pointer to far causes OOG errors
    uint256 constant END_PTR = type(uint24).max;

    function testGetSetFreeMemoryPointer(uint256 seed) public pure {
        bytes32 ptr = bytes32(bound(seed, START_PTR, END_PTR));
        Memory.Pointer.wrap(ptr).unsafeSetFreeMemoryPointer();
        assertEq(Memory.Pointer.unwrap(Memory.getFreeMemoryPointer()), ptr);
    }

    function testAsSliceToBytes(bytes memory input) public pure {
        Memory.Slice slice = input.asSlice();
        assertEq(slice.toBytes(), input);
        assertTrue(slice.isReserved());
    }

    function testSlice(bytes memory input, uint256 offset) public pure {
        offset = bound(offset, 0, input.length);

        Memory.Slice slice = input.asSlice().slice(offset);
        assertEq(slice.toBytes(), input.slice(offset));
        assertTrue(slice.isReserved());
    }

    function testSlice(bytes memory input, uint256 offset, uint256 length) public pure {
        offset = bound(offset, 0, input.length);
        length = bound(length, 0, input.length - offset);

        Memory.Slice slice = input.asSlice().slice(offset, length);
        assertEq(slice.toBytes(), input.slice(offset, offset + length));
        assertTrue(slice.isReserved());
    }

    function testInvalidSliceOutOfBound() public pure {
        bytes memory input = new bytes(256);

        Memory.Slice slice = input.asSlice();
        assertTrue(slice.isReserved());

        Memory.Slice sliceMoved;
        assembly ("memory-safe") {
            sliceMoved := add(slice, 0x01) // add 1 to the ptr part
        }
        assertFalse(sliceMoved.isReserved());

        Memory.Slice sliceExtended;
        assembly ("memory-safe") {
            sliceExtended := add(slice, shl(128, 0x01)) // add 1 to the length part
        }
        assertFalse(sliceExtended.isReserved());
    }

    function testSymbolicEqual(bytes memory a, bytes memory b) public pure {
        Memory.Slice sliceA = a.asSlice();
        Memory.Slice sliceB = b.asSlice();
        bool expected = keccak256(a) == keccak256(b);
        assertEq(Memory.equal(sliceA, sliceB), expected);
    }

    function testEqual(
        bytes memory a,
        uint256 offsetA,
        uint256 lengthA,
        bytes memory b,
        uint256 offsetB,
        uint256 lengthB
    ) public pure {
        offsetA = bound(offsetA, 0, a.length);
        offsetB = bound(offsetB, 0, b.length);
        lengthA = bound(lengthA, 0, a.length - offsetA);
        lengthB = bound(lengthB, 0, b.length - offsetB);
        assertEq(
            a.asSlice().slice(offsetA, lengthA).equal(b.asSlice().slice(offsetB, lengthB)),
            keccak256(a.slice(offsetA, offsetA + lengthA)) == keccak256(b.slice(offsetB, offsetB + lengthB))
        );
    }
}
