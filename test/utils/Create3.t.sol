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

    function testSymbolicDeployMatchesComputeAddress(bytes32 salt) public {
        // Minimal init code that deploys a contract with empty runtime code (PUSH1 0, PUSH1 0, RETURN).
        bytes memory bytecode = hex"60006000f3";
        address predicted = Create3.computeAddress(salt);
        address deployed = Create3.deploy(0, salt, bytecode);
        assertEq(deployed, predicted);
    }
}
