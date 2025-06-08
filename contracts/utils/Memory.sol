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
    function getFreePointer() internal pure returns (Pointer ptr) {
        assembly ("memory-safe") {
            ptr := mload(0x40)
        }
    }

    /// @dev Sets the free `Pointer` to a specific value.
    ///
    /// WARNING: Everything after the pointer may be overwritten.
    function setFreePointer(Pointer ptr) internal pure {
        assembly ("memory-safe") {
            mstore(0x40, ptr)
        }
    }

    /// @dev Returns a `Pointer` to the content of a `bytes` buffer. Skips the length word.
    function contentPointer(bytes memory buffer) internal pure returns (Pointer) {
        return addOffset(asPointer(buffer), 32);
    }

    /**
     * @dev Copies `length` bytes from `srcPtr` to `destPtr`. Equivalent to https://www.evm.codes/?fork=cancun#5e[`mcopy`].
     *
     * WARNING: Reading or writing beyond the allocated memory bounds of either pointer
     * will result in undefined behavior and potential memory corruption.
     */
    function copy(Pointer destPtr, Pointer srcPtr, uint256 length) internal pure {
        assembly ("memory-safe") {
            mcopy(destPtr, srcPtr, length)
        }
    }

    /// @dev Extracts a `bytes1` from a `Pointer`. `offset` starts from the most significant byte.
    function extractByte(Pointer ptr, uint256 offset) internal pure returns (bytes1 v) {
        bytes32 word = extractWord(ptr);
        assembly ("memory-safe") {
            v := byte(offset, word)
        }
    }

    /// @dev Extracts a `bytes32` from a `Pointer`.
    function extractWord(Pointer ptr) internal pure returns (bytes32 v) {
        assembly ("memory-safe") {
            v := mload(ptr)
        }
    }

    /// @dev Adds an offset to a `Pointer`.
    function addOffset(Pointer ptr, uint256 offset) internal pure returns (Pointer) {
        return asPointer(bytes32(asUint256(ptr) + offset));
    }

    /// @dev `Pointer` to `bytes32`.
    function asBytes32(Pointer ptr) internal pure returns (bytes32) {
        return Pointer.unwrap(ptr);
    }

    /// @dev `Pointer` to `uint256`.
    function asUint256(Pointer ptr) internal pure returns (uint256) {
        return uint256(asBytes32(ptr));
    }

    /// @dev `bytes32` to `Pointer`.
    function asPointer(bytes32 value) internal pure returns (Pointer) {
        return Pointer.wrap(value);
    }

    /// @dev `bytes` to `Pointer`.
    function asPointer(bytes memory value) internal pure returns (Pointer) {
        bytes32 ptr;
        assembly ("memory-safe") {
            ptr := value
        }
        return asPointer(ptr);
    }

    /// @dev `Pointer` to `bytes`.
    function asBytes(Pointer ptr) internal pure returns (bytes memory b) {
        assembly ("memory-safe") {
            b := ptr
        }
    }
}
