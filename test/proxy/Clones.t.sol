// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

contract ClonesTest is Test {
    function testPredictDeterministicAddressSpillage(address implementation, bytes32 salt) public {
        address predicted = Clones.predictDeterministicAddress(implementation, salt);
        bytes32 spillage;
        /// @solidity memory-safe-assembly
        assembly {
            spillage := and(predicted, 0xffffffffffffffffffffffff0000000000000000000000000000000000000000)
        }
        assertEq(spillage, bytes32(0));
    }
}
