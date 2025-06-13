// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Memory} from "@openzeppelin/contracts/utils/Memory.sol";

contract MemoryTest is Test {
    using Memory for *;

    // - first 0x80 bytes are reserved (scratch + FMP + zero)
    uint256 constant START_PTR = 0x80;
    // - moving the free memory pointer to far causes OOG errors
    uint256 constant END_PTR = type(uint24).max;

    function testGetSetFreePointer(uint256 seed) public pure {
        bytes32 ptr = bytes32(bound(seed, START_PTR, END_PTR));
        ptr.asPointer().setFreePointer();
        assertEq(Memory.getFreePointer().asBytes32(), ptr);
    }

    function testSymbolicContentPointer(uint256 seed) public pure {
        Memory.Pointer ptr = bytes32(bound(seed, START_PTR, END_PTR)).asPointer();
        assertEq(ptr.asBytes().contentPointer().asBytes32(), ptr.addOffset(32).asBytes32());
    }

    function testCopy(bytes memory data, uint256 destSeed) public pure {
        uint256 minDestPtr = Memory.getFreePointer().asUint256();
        Memory.Pointer destPtr = bytes32(bound(destSeed, minDestPtr, minDestPtr + END_PTR)).asPointer();
        destPtr.addOffset(data.length + 32).setFreePointer();
        destPtr.copy(data.asPointer(), data.length + 32);
        bytes memory copiedData = destPtr.asBytes();
        assertEq(data.length, copiedData.length);
        for (uint256 i = 0; i < data.length; i++) {
            assertEq(data[i], copiedData[i]);
        }
    }

    function testLoadByte(uint256 seed, uint256 index, bytes32 value) public pure {
        index = bound(index, 0, 31);
        Memory.Pointer ptr = bytes32(bound(seed, START_PTR, END_PTR)).asPointer();

        assembly ("memory-safe") {
            mstore(ptr, value)
        }

        bytes1 expected;
        assembly ("memory-safe") {
            expected := byte(index, value)
        }
        assertEq(ptr.loadByte(index), expected);
    }

    function testLoad(uint256 seed, bytes32 value) public pure {
        Memory.Pointer ptr = bytes32(bound(seed, START_PTR, END_PTR)).asPointer();
        assembly ("memory-safe") {
            mstore(ptr, value)
        }
        assertEq(ptr.load(), value);
    }

    function testSymbolicAddOffset(uint256 seed, uint256 offset) public pure {
        offset = bound(offset, 0, type(uint256).max - END_PTR);
        Memory.Pointer ptr = bytes32(bound(seed, START_PTR, END_PTR)).asPointer();
        assertEq(ptr.addOffset(offset).asUint256(), ptr.asUint256() + offset);
    }
}
