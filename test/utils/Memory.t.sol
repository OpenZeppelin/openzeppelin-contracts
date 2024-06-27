// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Memory} from "@openzeppelin/contracts/utils/Memory.sol";

contract MemoryTest is Test {
    using Memory for *;

    function testSymbolicGetSetFreePointer(uint256 ptr) public {
        Memory.Pointer memoryPtr = Memory.asPointer(bytes32(ptr));
        Memory.setFreePointer(memoryPtr);
        assertEq(Memory.getFreePointer().asBytes32(), memoryPtr.asBytes32());
    }
}
