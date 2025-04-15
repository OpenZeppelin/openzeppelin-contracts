// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Memory} from "@openzeppelin/contracts/utils/Memory.sol";

contract MemoryTest is Test {
    using Memory for *;

    function testSymbolicGetSetFreePointer(uint256 seed) public pure {
        // - first 0x80 bytes are reserved (scratch + FMP + zero)
        // - moving the free memory pointer to far causes OOG errors
        bytes32 ptr = bytes32(bound(seed, 0x80, type(uint24).max));

        Memory.setFreePointer(ptr.asPointer());
        assertEq(Memory.getFreePointer().asBytes32(), ptr);
    }
}
