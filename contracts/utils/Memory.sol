// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytes32
 */
library Memory {
    type FreePtr is bytes32;

    function save() internal pure returns (FreePtr ptr) {
        assembly ("memory-safe") {
            ptr := mload(0x40)
        }
    }

    function load(FreePtr ptr) internal pure {
        assembly ("memory-safe") {
            mstore(0x40, ptr)
        }
    }
}
