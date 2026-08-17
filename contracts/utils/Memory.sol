// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (utils/Memory.sol)

pragma solidity ^0.8.24;

import {Panic} from "./Panic.sol";
import {Math} from "./math/Math.sol";

/**
 * @dev Utilities to manipulate memory.
 *
 * Memory is a contiguous and dynamic byte array in which Solidity stores non-primitive types.
 * This library provides functions to manipulate pointers to this dynamic array and work with slices of it.
 *
 * Slices provide a view into a portion of memory without copying data, enabling efficient substring operations.
 *
 * WARNING: When manipulating memory pointers or slices, make sure to follow the Solidity documentation
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
     * The solidity memory layout requires that the FMP is never set to a value lower than 0x80. Setting the
     * FMP to a value lower than 0x80 may cause unexpected behavior. Deallocating all memory can be achieved by
     * setting the FMP to 0x80.
     *
     * WARNING: Everything after the pointer may be overwritten.
     **/
    function unsafeSetFreeMemoryPointer(Pointer ptr) internal pure {
        assembly ("memory-safe") {
            mstore(0x40, ptr)
        }
    }

    /// @dev Move a pointer forward by a given offset.
    function forward(Pointer ptr, uint256 offset) internal pure returns (Pointer) {
        return Pointer.wrap(bytes32(uint256(Pointer.unwrap(ptr)) + offset));
    }

    /// @dev Equality comparator for memory pointers.
    function equal(Pointer ptr1, Pointer ptr2) internal pure returns (bool) {
        return Pointer.unwrap(ptr1) == Pointer.unwrap(ptr2);
    }

    type Slice is bytes32;
    type ConstSlice is bytes32;

    /// @dev Get a slice representation of a bytes object in memory
    function asSlice(bytes memory self) internal pure returns (Slice result) {
        assembly ("memory-safe") {
            result := or(shl(128, mload(self)), add(self, 0x20))
        }
    }

    /// @dev Get a constant slice representation of a bytes object in memory
    function asConstSlice(bytes memory self) internal pure returns (ConstSlice result) {
        return asConst(asSlice(self));
    }

    // @dev Get a constant slice representation of a non-constant slice
    function asConst(Slice self) internal pure returns (ConstSlice result) {
        return ConstSlice.wrap(Slice.unwrap(self));
    }

    // ===============================================================================================================
    // Export
    // ===============================================================================================================

    function toBytes(Slice self) internal pure returns (bytes memory result) {
        return toBytes(asConst(self));
    }

    /// @dev Extract the data corresponding to a Slice (allocate new memory)
    function toBytes(ConstSlice self) internal pure returns (bytes memory result) {
        uint256 len = length(self);
        Pointer ptr = _pointer(self);
        assembly ("memory-safe") {
            result := mload(0x40)
            mstore(result, len)
            mcopy(add(result, 0x20), ptr, len)
            mstore(0x40, add(add(result, len), 0x20))
        }
    }

    function write(Slice self, bytes memory buffer) internal pure returns (bytes memory result) {
        return write(asConst(self), buffer);
    }

    function write(ConstSlice self, bytes memory buffer) internal pure returns (bytes memory result) {
        uint256 len = length(self);
        if (buffer.length < len) Panic.panic(Panic.RESOURCE_ERROR);
        Pointer ptr = _pointer(self);
        assembly ("memory-safe") {
            mstore(buffer, len)
            mcopy(add(buffer, 0x20), ptr, len)
        }
        return buffer;
    }

    // ===============================================================================================================
    // Getters
    // ===============================================================================================================

    /// @dev Returns the length of a given slice (equiv to self.length for calldata slices)
    function length(Slice self) internal pure returns (uint256 result) {
        return length(asConst(self));
    }

    function length(ConstSlice self) internal pure returns (uint256 result) {
        assembly ("memory-safe") {
            result := shr(128, self)
        }
    }

    /**
     * @dev Read a bytes32 buffer from a given Slice at a specific offset
     *
     * NOTE: If offset > length(slice) - 0x20, part of the return value will be out of bound of the slice. These bytes are zeroed.
     */
    function load(Slice self, uint256 offset) internal pure returns (bytes32 value) {
        return load(asConst(self), offset);
    }

    function load(ConstSlice self, uint256 offset) internal pure returns (bytes32 value) {
        uint256 outOfBoundBytes = Math.saturatingSub(0x20 + offset, length(self));
        if (outOfBoundBytes > 0x1f) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);

        assembly ("memory-safe") {
            value := and(mload(add(and(self, shr(128, not(0))), offset)), shl(mul(8, outOfBoundBytes), not(0)))
        }
    }

    /// @dev Returns true if the memory occupied by the slice is reserved (i.e. before the free memory pointer)
    function isReserved(Slice self) internal pure returns (bool result) {
        return isReserved(asConst(self));
    }

    function isReserved(ConstSlice self) internal pure returns (bool result) {
        Memory.Pointer fmp = getFreeMemoryPointer();
        Memory.Pointer end = forward(_pointer(self), length(self));
        assembly ("memory-safe") {
            result := iszero(lt(fmp, end)) // end <= fmp
        }
    }

    // ===============================================================================================================
    // Comparators
    // ===============================================================================================================

    function equal(Slice a, Slice b) internal pure returns (bool result) {
        return equal(asConst(a), asConst(b));
    }

    function equal(ConstSlice a, Slice b) internal pure returns (bool result) {
        return equal(a, asConst(b));
    }

    function equal(Slice a, ConstSlice b) internal pure returns (bool result) {
        return equal(asConst(a), b);
    }

    /// @dev Returns true if the two slices contain the same data.
    function equal(ConstSlice a, ConstSlice b) internal pure returns (bool result) {
        uint256 len = length(a);
        if (len == length(b)) {
            Memory.Pointer ptrA = _pointer(a);
            Memory.Pointer ptrB = _pointer(b);
            assembly ("memory-safe") {
                result := eq(keccak256(ptrA, len), keccak256(ptrB, len))
            }
        }
        // else returns false (default value)
    }

    // ===============================================================================================================
    // Slice
    // ===============================================================================================================

    /// @dev Offset a memory slice (equivalent to self[start:] for calldata slices)
    function slice(Slice self, uint256 start) internal pure returns (Slice) {
        return slice(self, start, length(self));
    }

    /// @dev Offset and cut a Slice (equivalent to self[start:end] for calldata slices)
    function slice(Slice self, uint256 start, uint256 end) internal pure returns (Slice) {
        unchecked {
            end = Math.min(end, length(self));
            start = Math.min(start, end);
            return _asSlice(forward(_pointer(self), start), end - start);
        }
    }

    /// @dev Offset a memory slice (equivalent to self[start:] for calldata slices)
    function slice(ConstSlice self, uint256 start) internal pure returns (ConstSlice) {
        return slice(self, start, length(self));
    }

    /// @dev Offset and cut a Slice (equivalent to self[start:end] for calldata slices)
    function slice(ConstSlice self, uint256 start, uint256 end) internal pure returns (ConstSlice) {
        unchecked {
            end = Math.min(end, length(self));
            start = Math.min(start, end);
            return _asConstSlice(forward(_pointer(self), start), end - start);
        }
    }

    // ===============================================================================================================
    // Private helpers
    // ===============================================================================================================

    /**
     * @dev Private helper: create a slice from raw values (length and pointer)
     *
     * NOTE: this function MUST NOT be called with `len` or `ptr` that exceed `2**128-1`. This should never be
     * the case of slices produced by `asSlice(bytes)`, and function that reduce the scope of slices
     * (`slice(Slice,uint256)` and `slice(Slice,uint256, uint256)`) should not cause this issue if the parent slice is
     * correct.
     */
    function _asSlice(Pointer ptr, uint256 len) private pure returns (Slice result) {
        assembly ("memory-safe") {
            result := or(shl(128, len), ptr)
        }
    }

    function _asConstSlice(Pointer ptr, uint256 len) private pure returns (ConstSlice result) {
        return asConst(_asSlice(ptr, len));
    }

    /// @dev Returns the memory location of a given slice (equiv to self.offset for calldata slices)
    function _pointer(Slice self) private pure returns (Pointer result) {
        return _pointer(asConst(self));
    }

    function _pointer(ConstSlice self) private pure returns (Pointer result) {
        assembly ("memory-safe") {
            result := and(self, shr(128, not(0)))
        }
    }
}
