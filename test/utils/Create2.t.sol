// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";

contract Create2Test is Test {
    function testSymbolicComputeAddressSpillage(bytes32 salt, bytes32 bytecodeHash, address deployer) public {
        address predicted = Create2.computeAddress(salt, bytecodeHash, deployer);
        bytes32 spillage;
        assembly ("memory-safe") {
            spillage := and(predicted, 0xffffffffffffffffffffffff0000000000000000000000000000000000000000)
        }
        assertEq(spillage, bytes32(0));
    }
}
