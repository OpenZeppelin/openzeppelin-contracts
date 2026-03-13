// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Create3} from "@openzeppelin/contracts/utils/Create3.sol";

contract Create3Test is Test {
    function testSymbolicComputeAddressSpillage(bytes32 salt, address deployer) public pure {
        address predicted = Create3.computeAddress(salt, deployer);
        bytes32 spillage;
        assembly ("memory-safe") {
            spillage := and(predicted, 0xffffffffffffffffffffffff0000000000000000000000000000000000000000)
        }
        assertEq(spillage, bytes32(0));
    }
}
