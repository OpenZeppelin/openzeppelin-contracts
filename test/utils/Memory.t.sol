// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test, stdError} from "forge-std/Test.sol";
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

    function testSlice(bytes memory input, uint256 start) public pure {
        start = bound(start, 0, input.length);

        Memory.Slice slice = input.asSlice().slice(start);
        assertEq(slice.toBytes(), input.slice(start));
        assertTrue(slice.isReserved());
    }

    function testSlice(bytes memory input, uint256 start, uint256 end) public pure {
        Memory.Slice slice = input.asSlice().slice(start, end);
        assertEq(slice.toBytes(), input.slice(start, end));
        assertTrue(slice.isReserved());
    }

    function testAsConstSliceToBytes(bytes memory input) public pure {
        Memory.ConstSlice slice = input.asConstSlice();
        assertEq(slice.length(), input.length);
        assertEq(slice.toBytes(), input);
        assertTrue(slice.isReserved());
    }

    function testAsConstMatchesAsConstSlice(bytes memory input) public pure {
        assertEq(Memory.ConstSlice.unwrap(input.asSlice().asConst()), Memory.ConstSlice.unwrap(input.asConstSlice()));
    }

    function testConstSlice(bytes memory input, uint256 start, uint256 end) public pure {
        assertEq(input.asConstSlice().slice(start).toBytes(), input.slice(start));
        assertEq(input.asConstSlice().slice(start, end).toBytes(), input.slice(start, end));
    }

    function testWrite(bytes memory input, uint256 extra) public pure {
        bytes memory buffer = new bytes(input.length + bound(extra, 0, 256));

        bytes memory result = input.asSlice().write(buffer);
        assertEq(result, input);
        // the buffer is modified in place and shrunk to the length of the slice
        assertEq(buffer, input);
        assertEq(buffer.length, input.length);
    }

    function testWriteConst(bytes memory input, uint256 extra) public pure {
        bytes memory buffer = new bytes(input.length + bound(extra, 0, 256));
        assertEq(input.asConstSlice().write(buffer), input);
    }

    function testWriteBufferTooSmall(bytes memory input, uint256 bufferLength) public {
        vm.assume(input.length > 0);
        bytes memory buffer = new bytes(bound(bufferLength, 0, input.length - 1));

        vm.expectRevert(stdError.indexOOBError);
        this.writeExternal(input, buffer);
    }

    /// @dev External wrapper: {vm-expectRevert} only observes reverts across a call boundary.
    function writeExternal(bytes memory input, bytes memory buffer) external pure {
        input.asSlice().write(buffer);
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

    /// @dev Covers the four `equal` overloads (Slice/ConstSlice in either position).
    function testEqualConstOverloads(bytes memory a, bytes memory b) public pure {
        bool expected = keccak256(a) == keccak256(b);
        assertEq(a.asSlice().equal(b.asSlice()), expected);
        assertEq(a.asConstSlice().equal(b.asSlice()), expected);
        assertEq(a.asSlice().equal(b.asConstSlice()), expected);
        assertEq(a.asConstSlice().equal(b.asConstSlice()), expected);
    }

    function testEqual(
        bytes memory a,
        uint256 startA,
        uint256 endA,
        bytes memory b,
        uint256 startB,
        uint256 endB
    ) public pure {
        assertEq(
            a.asSlice().slice(startA, endA).equal(b.asSlice().slice(startB, endB)),
            keccak256(a.slice(startA, endA)) == keccak256(b.slice(startB, endB))
        );
    }
}
