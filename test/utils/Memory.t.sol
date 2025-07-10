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

    function testGetsetFreeMemoryPointer(uint256 seed) public pure {
        bytes32 ptr = bytes32(bound(seed, START_PTR, END_PTR));
        ptr.asPointer().setFreeMemoryPointer();
        assertEq(Memory.getFreeMemoryPointer().asBytes32(), ptr);
    }
}
