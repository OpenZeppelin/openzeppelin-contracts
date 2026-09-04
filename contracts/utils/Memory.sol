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

    /// @dev A view into a region of memory: a pointer and a length packed into a single word.
    type Slice is bytes32;

    /**
     * @dev A {Slice} that is not meant to be written to.
     *
     * This type carries no enforcement of its own. It documents intent at the type level and, because there is no
     * conversion back to {Slice}, it keeps a read-only slice from being passed where a writable one is expected. The
     * underlying memory stays reachable, and mutable, through any other pointer to the same region.
     */
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

    /// @dev Get a constant slice representation of a non-constant slice. This conversion is one-way.
    function asConst(Slice self) internal pure returns (ConstSlice result) {
        return ConstSlice.wrap(Slice.unwrap(self));
    }

    // ===============================================================================================================
    // Export
    // ===============================================================================================================

    /// @dev Extract the data corresponding to a Slice (allocate new memory)
    function toBytes(Slice self) internal pure returns (bytes memory result) {
        return toBytes(asConst(self));
    }

    /// @dev Extract the data corresponding to a ConstSlice (allocate new memory)
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

    /**
     * @dev Extract the data corresponding to a Slice into an existing `buffer` (does not allocate memory).
     *
     * NOTE: This modifies `buffer` in place and shrinks it to the length of the slice. See the `ConstSlice` variant
     * of this function for the full requirements and semantics.
     */
    function write(Slice self, bytes memory buffer) internal pure returns (bytes memory result) {
        return write(asConst(self), buffer);
    }

    /**
     * @dev Extract the data corresponding to a ConstSlice into an existing `buffer` (does not allocate memory), and
     * return that buffer shrunk to the length of the slice. Use {toBytes} instead if a freshly allocated result is
     * needed.
     *
     * NOTE: This function modifies the provided buffer in place, and the returned value is that same buffer. Its
     * length is reduced to the length of the slice, so any space it held past that point becomes unreachable while
     * remaining reserved. A buffer's length can only ever shrink this way, never grow back.
     *
     * Requirements:
     *
     * * `buffer` must be at least as long as the slice, otherwise this panics with {ARRAY_OUT_OF_BOUNDS}.
     */
    function write(ConstSlice self, bytes memory buffer) internal pure returns (bytes memory result) {
        uint256 len = length(self);
        if (buffer.length < len) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
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

    /// @dev Returns the length of a given constant slice (equiv to self.length for calldata slices)
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

    /**
     * @dev Read a bytes32 buffer from a given ConstSlice at a specific offset
     *
     * NOTE: If offset > length(slice) - 0x20, part of the return value will be out of bound of the slice. These bytes are zeroed.
     */
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

    /// @dev Returns true if the memory occupied by the constant slice is reserved (i.e. before the free memory pointer)
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

    /// @dev Returns true if the two slices contain the same data.
    function equal(Slice a, Slice b) internal pure returns (bool result) {
        return equal(asConst(a), asConst(b));
    }

    /// @dev Returns true if the two slices contain the same data.
    function equal(ConstSlice a, Slice b) internal pure returns (bool result) {
        return equal(a, asConst(b));
    }

    /// @dev Returns true if the two slices contain the same data.
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

    /**
     * @dev Returns a Slice covering `self`, from `start` (included) to the end of `self`. Unlike
     * {xref-Bytes-slice-bytes-uint256-uint256-}[`Bytes.slice`], this is a view into the same memory: no data is copied.
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice[Javascript's `Array.slice`]
     */
    function slice(Slice self, uint256 start) internal pure returns (Slice) {
        return slice(self, start, length(self));
    }

    /**
     * @dev Returns a Slice covering `self`, from `start` (included) to `end` (excluded). The `end` argument is
     * truncated to the length of `self`, and `start` is truncated to `end`. Unlike a calldata slice expression
     * (`self[start:end]`), out-of-range bounds do not revert: they produce a shorter, possibly empty, slice. Unlike
     * {xref-Bytes-slice-bytes-uint256-uint256-}[`Bytes.slice`], this is a view into the same memory: no data is copied.
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice[Javascript's `Array.slice`]
     */
    function slice(Slice self, uint256 start, uint256 end) internal pure returns (Slice) {
        unchecked {
            end = Math.min(end, length(self));
            start = Math.min(start, end);
            // Overflow not possible: start <= end, both truncated to length(self).
            return _asSlice(forward(_pointer(self), start), end - start);
        }
    }

    /**
     * @dev Returns a ConstSlice covering `self`, from `start` (included) to the end of `self`. Unlike {Bytes-slice},
     * this is a view into the same memory: no data is copied.
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice[Javascript's `Array.slice`]
     */
    function slice(ConstSlice self, uint256 start) internal pure returns (ConstSlice) {
        return slice(self, start, length(self));
    }

    /**
     * @dev Returns a ConstSlice covering `self`, from `start` (included) to `end` (excluded). The `end` argument is
     * truncated to the length of `self`, and `start` is truncated to `end`. Unlike a calldata slice expression
     * (`self[start:end]`), out-of-range bounds do not revert: they produce a shorter, possibly empty, slice. Unlike
     * {xref-Bytes-slice-bytes-uint256-uint256-}[`Bytes.slice`], this is a view into the same memory: no data is copied.
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice[Javascript's `Array.slice`]
     */
    function slice(ConstSlice self, uint256 start, uint256 end) internal pure returns (ConstSlice) {
        unchecked {
            end = Math.min(end, length(self));
            start = Math.min(start, end);
            // Overflow not possible: start <= end, both truncated to length(self).
            return _asConstSlice(forward(_pointer(self), start), end - start);
        }
    }

    // ===============================================================================================================
    // Private helpers
    // ===============================================================================================================

    /**
     * @dev Private helper: create a slice from raw values (pointer and length)
     *
     * NOTE: this function MUST NOT be called with `ptr` or `len` that exceed `2**128-1`. This should never be
     * the case of slices produced by `asSlice(bytes)`, and functions that reduce the scope of slices
     * (the `slice` overloads) should not cause this issue if the parent slice is correct.
     */
    function _asSlice(Pointer ptr, uint256 len) private pure returns (Slice result) {
        assembly ("memory-safe") {
            result := or(shl(128, len), ptr)
        }
    }

    /// @dev Private helper: create a constant slice from raw values (pointer and length). See {_asSlice}.
    function _asConstSlice(Pointer ptr, uint256 len) private pure returns (ConstSlice result) {
        return asConst(_asSlice(ptr, len));
    }

    /// @dev Returns the memory location of a given slice (equiv to self.offset for calldata slices)
    function _pointer(Slice self) private pure returns (Pointer result) {
        return _pointer(asConst(self));
    }

    /// @dev Returns the memory location of a given constant slice (equiv to self.offset for calldata slices)
    function _pointer(ConstSlice self) private pure returns (Pointer result) {
        assembly ("memory-safe") {
            result := and(self, shr(128, not(0)))
        }
    }
}
