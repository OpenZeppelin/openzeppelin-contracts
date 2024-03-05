// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Clones} from "../proxy/Clones.sol";
import {Create2} from "../utils/Create2.sol";

contract ComputedAddressRemainderMock {
    uint256 private constant _REMAINDER_MASK = ~(uint256(type(uint160).max));

    function getCreate2ComputedRemainder(
        bytes32 salt,
        bytes32 bytecodeHash,
        address deployer
    ) external pure returns (uint256 remainder) {
        address predicted = Create2.computeAddress(salt, bytecodeHash, deployer);
        remainder = _getRemainder(predicted);
    }

    function getClonesPredictedRemainder(
        address implementation,
        bytes32 salt,
        address deployer
    ) external pure returns (uint256 remainder) {
        address predicted = Clones.predictDeterministicAddress(implementation, salt, deployer);
        remainder = _getRemainder(predicted);
    }

    function _getRemainder(address addr) internal pure returns (uint256 remainder) {
        uint256 remainderMask = _REMAINDER_MASK;

        assembly ("memory-safe") {
            remainder := and(addr, remainderMask)
        }
    }
}
