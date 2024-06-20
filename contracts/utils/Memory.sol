// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/// @dev Memory utility library.
library Memory {
    type Pointer is bytes32;

    /// @dev Returns a memory pointer to the current free memory pointer.
    function saveFreePointer() internal pure returns (Pointer ptr) {
        assembly ("memory-safe") {
            ptr := mload(0x40)
        }
    }

    /// @dev Sets the free memory pointer to a specific value.
    ///
    /// WARNING: Everything after the pointer may be overwritten.
    function loadFreePointer(Pointer ptr) internal pure {
        assembly ("memory-safe") {
            mstore(0x40, ptr)
        }
    }
}
