// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Create2} from "../utils/Create2.sol";

contract Create2ComputedAddressMock {
    function getComputedRemainder(
        bytes32 salt,
        bytes32 bytecodeHash,
        address deployer
    ) external pure returns (uint256 remainder) {
        uint256 remainderMask = ~(uint256(type(uint160).max));
        address predicted = Create2.computeAddress(salt, bytecodeHash, deployer);

        assembly ("memory-safe") {
            remainder := and(predicted, remainderMask)
        }
    }
}
