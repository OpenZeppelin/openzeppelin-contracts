// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Memory} from "@openzeppelin/contracts/utils/Memory.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

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

    // function testCopy(bytes memory data, uint256 destSeed) public pure {
    //     uint256 upperPtr = data.asPointer().asUint256() + data.length;
    //     Memory.Pointer destPtr = bytes32(bound(destSeed, upperPtr, upperPtr + 100)).asPointer();
    //     Memory.copy(data.asPointer(), destPtr, data.length + 32);
    //     for (uint256 i = 0; i < data.length; i++) {
    //         assertEq(data[i], destPtr.asBytes()[i]);
    //     }
    // }

    function testExtractByte(uint256 seed, uint256 index) public pure {
        index = bound(index, 0, 31);
        Memory.Pointer ptr = bytes32(bound(seed, START_PTR, END_PTR)).asPointer();
        assertEq(ptr.extractByte(index), bytes1(ptr.asBytes32() >> (256 - index * 8)));
    }

    // function testExtractWord(uint256 seed) public pure {
    //     Memory.Pointer ptr = bytes32(bound(seed, START_PTR, END_PTR)).asPointer();
    //     assertEq(ptr.extractWord(), ptr.asBytes32());
    // }

    // function testAddOffset(uint256 seed, uint256 offset) public pure {
    //     Memory.Pointer ptr = bytes32(bound(seed, START_PTR, END_PTR)).asPointer();
    //     assertEq(ptr.addOffset(offset).asUint256(), ptr.asUint256() + offset);
    // }
}
