// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Memory} from "@openzeppelin/contracts/utils/Memory.sol";

contract MemoryTest is Test {
    using Memory for *;

    function testSymbolicGetSetFreePointer(bytes32 ptr) public {
        Memory.Pointer memoryPtr = ptr.asPointer();
        Memory.setFreePointer(memoryPtr);
        assertEq(Memory.getFreePointer().asBytes32(), memoryPtr.asBytes32());
    }
}
