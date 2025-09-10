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

    function testGetsetFreeMemoryPointer(uint256 seed) public pure {
        bytes32 ptr = bytes32(bound(seed, START_PTR, END_PTR));
        ptr.asPointer().setFreeMemoryPointer();
        assertEq(Memory.getFreeMemoryPointer().asBytes32(), ptr);
    }

    function testAsSliceToBytes(bytes memory input) public pure {
        assertEq(input.asSlice().toBytes(), input);
    }

    function testSlice(bytes memory input, uint256 offset) public pure {
        offset = bound(offset, 0, input.length);
        assertEq(input.asSlice().slice(offset).toBytes(), input.slice(offset));
    }

    function testSlice(bytes memory input, uint256 offset, uint256 length) public pure {
        offset = bound(offset, 0, input.length);
        length = bound(length, 0, input.length - offset);
        assertEq(input.asSlice().slice(offset, length).toBytes(), input.slice(offset, offset + length));
    }
}
