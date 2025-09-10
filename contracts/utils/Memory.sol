// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

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

    type Slice is bytes32;

    function asSlice(bytes memory self) internal pure returns (Slice result) {
        assembly ("memory-safe") {
            result := or(shl(128, mload(self)), add(self, 0x20))
        }
    }

    function asSlice(uint256 len, Memory.Pointer ptr) internal pure returns (Slice result) {
        // TODO: Fail if len or ptr  is larger than type(uint128).max ?
        assembly ("memory-safe") {
            result := or(shl(128, len), ptr)
        }
    }

    /// @dev Private helper: extract the data corresponding to a Slice (allocate new memory)
    function toBytes(Slice self) internal pure returns (bytes memory result) {
        uint256 len = length(self);
        Memory.Pointer ptr = pointer(self);
        assembly ("memory-safe") {
            result := mload(0x40)
            mstore(result, len)
            mcopy(add(result, 0x20), ptr, len)
            mstore(0x40, add(add(result, len), 0x20))
        }
    }

    /// @dev Private helper: length of a given Slice (equiv to self.length for calldata slices)
    function length(Slice self) internal pure returns (uint256 result) {
        assembly ("memory-safe") {
            result := shr(128, self)
        }
    }

    /// @dev Private helper: memory location of a given Slice (equiv to self.offset for calldata slices)
    function pointer(Slice self) internal pure returns (Memory.Pointer result) {
        assembly ("memory-safe") {
            result := and(self, shr(128, not(0)))
        }
    }

    /// @dev Private helper: read a bytes32 buffer from a given Slice at a specific offset
    function load(Slice self, uint256 offset) internal pure returns (bytes32 value) {
        assembly ("memory-safe") {
            value := mload(add(and(self, shr(128, not(0))), offset))
        }
    }

    /// @dev Private helper: slice a Slice (equivalent to self[start:] for calldata slices)
    function slice(Slice self, uint256 start) internal pure returns (Slice) {
        // TODO: check start < _len(self) ?
        return asSlice(length(self) - start, asPointer(bytes32(uint256(asBytes32(pointer(self))) + start)));
    }

    /// @dev Private helper: slice a Slice (equivalent to self[start:start+length] for calldata slices)
    function slice(Slice self, uint256 start, uint256 len) internal pure returns (Slice) {
        // TODO: check start + length < _len(self) ?
        return asSlice(len, asPointer(bytes32(uint256(asBytes32(pointer(self))) + start)));
    }
}
