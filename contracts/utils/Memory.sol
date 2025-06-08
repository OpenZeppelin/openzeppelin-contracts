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

    /// @dev Returns a memory pointer to the current free memory pointer.
    function getFreePointer() internal pure returns (Pointer ptr) {
        assembly ("memory-safe") {
            ptr := mload(0x40)
        }
    }

    /// @dev Sets the free memory pointer to a specific value.
    ///
    /// WARNING: Everything after the pointer may be overwritten.
    function setFreePointer(Pointer ptr) internal pure {
        assembly ("memory-safe") {
            mstore(0x40, ptr)
        }
    }

    /// @dev Returns a memory pointer to the content of a buffer. Skips the length word.
    function contentPointer(bytes memory buffer) internal pure returns (Pointer) {
        bytes32 ptr;
        assembly ("memory-safe") {
            ptr := add(buffer, 32)
        }
        return asPointer(ptr);
    }

    /// @dev Copies `length` bytes from `srcPtr` to `destPtr`.
    function copy(Pointer destPtr, Pointer srcPtr, uint256 length) internal pure {
        assembly ("memory-safe") {
            mcopy(destPtr, srcPtr, length)
        }
    }

    /// @dev Extracts a byte from a memory pointer.
    function extractByte(Pointer ptr) internal pure returns (bytes1 v) {
        assembly ("memory-safe") {
            v := byte(0, mload(ptr))
        }
    }

    /// @dev Extracts a word from a memory pointer.
    function extractWord(Pointer ptr) internal pure returns (uint256 v) {
        assembly ("memory-safe") {
            v := mload(ptr)
        }
    }

    /// @dev Adds an offset to a memory pointer.
    function addOffset(Pointer ptr, uint256 offset) internal pure returns (Pointer) {
        return asPointer(bytes32(uint256(asBytes32(ptr)) + offset));
    }

    /// @dev Pointer to `bytes32`.
    function asBytes32(Pointer ptr) internal pure returns (bytes32) {
        return Pointer.unwrap(ptr);
    }

    /// @dev `bytes32` to pointer.
    function asPointer(bytes32 value) internal pure returns (Pointer) {
        return Pointer.wrap(value);
    }

    /// @dev `bytes` to pointer.
    function asPointer(bytes memory value) internal pure returns (Pointer) {
        bytes32 ptr;
        assembly ("memory-safe") {
            ptr := value
        }
        return asPointer(ptr);
    }
}
