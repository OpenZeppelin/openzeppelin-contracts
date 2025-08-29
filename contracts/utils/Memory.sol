// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Utilities to manipulate memory.
 *
 * Memory is a contiguous and dynamic byte array in which Solidity stores non-primitive types.
 * This library provides functions to manipulate pointers to this dynamic array.
 *
 * WARNING: When manipulating memory, make sure to follow the Solidity documentation
 * guidelines for https://docs.soliditylang.org/en/v0.8.20/assembly.html#memory-safety[Memory Safety].
 */
library Memory {
    type Pointer is bytes32;

    /// @dev Returns a `Pointer` to the current free `Pointer`.
    function getFreeMemoryPointer() internal pure returns (Pointer ptr) {
        assembly ("memory-safe") {
            ptr := mload(0x40)
        }
    }

    /**
     * @dev Sets the free `Pointer` to a specific value.
     *
     * WARNING: Everything after the pointer may be overwritten.
     **/
    function setFreeMemoryPointer(Pointer ptr) internal pure {
        assembly ("memory-safe") {
            mstore(0x40, ptr)
        }
    }

    /// @dev `Pointer` to `bytes32`. Expects a pointer to a properly ABI-encoded `bytes` object.
    function asBytes32(Pointer ptr) internal pure returns (bytes32) {
        return Pointer.unwrap(ptr);
    }

    /// @dev `bytes32` to `Pointer`. Expects a pointer to a properly ABI-encoded `bytes` object.
    function asPointer(bytes32 value) internal pure returns (Pointer) {
        return Pointer.wrap(value);
    }
}
