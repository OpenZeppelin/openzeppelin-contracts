// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

library Memory {
    type Pointer is bytes32;

    function saveFreePointer() internal pure returns (Pointer ptr) {
        assembly ("memory-safe") {
            ptr := mload(0x40)
        }
    }

    function loadFreePointer(Pointer ptr) internal pure {
        assembly ("memory-safe") {
            mstore(0x40, ptr)
        }
    }
}
