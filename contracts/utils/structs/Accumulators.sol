// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Memory} from "../Memory.sol";

/**
 * @dev Structure concatenating an arbitrary number of bytes buffers with limited memory allocation.
 *
 * The Accumulators library provides a memory-efficient alternative to repeated concatenation of bytes.
 * Instead of copying data on each concatenation (O(n**2) complexity), it builds a linked list of references
 * to existing data and performs a single memory allocation during flattening (O(n) complexity).
 *
 * Uses 0x00 as sentinel value for empty state (i.e. null pointers)
 *
 * ==== How it works
 *
 * 1. Create an empty accumulator with null head/tail pointers
 * 2. Add data using {push} (append) or {shift} (prepend). It creates linked list nodes
 * 3. Each node stores a reference to existing data (no copying)
 * 4. Call {flatten} to materialize the final concatenated result in a single operation
 *
 * ==== Performance
 *
 * * Addition: O(1) per operation (just pointer manipulation)
 * * Flattening: O(n) single pass with one memory allocation
 * * Memory: Minimal overhead until flattening (only stores references)
 */
library Accumulators {
    using Memory for *;

    /**
     * @dev Bytes accumulator: a linked list of `bytes`.
     *
     * NOTE: This is a memory structure that SHOULD not be put in storage.
     */
    struct Accumulator {
        Memory.Pointer head;
        Memory.Pointer tail;
    }

    /// @dev Item (list node) in a bytes accumulator
    struct AccumulatorEntry {
        Memory.Pointer next;
        Memory.Slice data;
    }

    /// @dev Create a new (empty) accumulator
    function accumulator() internal pure returns (Accumulator memory self) {
        self.head = _nullPtr();
        self.tail = _nullPtr();
    }

    /// @dev Add a bytes buffer to (the end of) an Accumulator
    function push(Accumulator memory self, bytes memory data) internal pure returns (Accumulator memory) {
        return push(self, data.asSlice());
    }

    /// @dev Add a memory slice to (the end of) an Accumulator
    function push(Accumulator memory self, Memory.Slice data) internal pure returns (Accumulator memory) {
        Memory.Pointer ptr = _asPtr(AccumulatorEntry({next: _nullPtr(), data: data}));

        if (_nullPtr().equal(self.head)) {
            self.head = ptr;
            self.tail = ptr;
        } else {
            _asAccumulatorEntry(self.tail).next = ptr;
            self.tail = ptr;
        }

        return self;
    }

    /// @dev Add a bytes buffer to (the beginning of) an Accumulator
    function shift(Accumulator memory self, bytes memory data) internal pure returns (Accumulator memory) {
        return shift(self, data.asSlice());
    }

    /// @dev Add a memory slice to (the beginning of) an Accumulator
    function shift(Accumulator memory self, Memory.Slice data) internal pure returns (Accumulator memory) {
        Memory.Pointer ptr = _asPtr(AccumulatorEntry({next: self.head, data: data}));

        if (_nullPtr().equal(self.head)) {
            self.head = ptr;
            self.tail = ptr;
        } else {
            self.head = ptr;
        }

        return self;
    }

    /// @dev Flatten all the bytes entries in an Accumulator into a single buffer
    function flatten(Accumulator memory self) internal pure returns (bytes memory result) {
        assembly ("memory-safe") {
            result := mload(0x40)
            let ptr := add(result, 0x20)
            for {
                let it := mload(self)
            } iszero(iszero(it)) {
                it := mload(it)
            } {
                let slice := mload(add(it, 0x20))
                let offset := and(slice, shr(128, not(0)))
                let length := shr(128, slice)
                mcopy(ptr, offset, length)
                ptr := add(ptr, length)
            }
            mstore(result, sub(ptr, add(result, 0x20)))
            mstore(0x40, ptr)
        }
    }

    function _asPtr(AccumulatorEntry memory item) private pure returns (Memory.Pointer ptr) {
        assembly ("memory-safe") {
            ptr := item
        }
    }

    function _asAccumulatorEntry(Memory.Pointer ptr) private pure returns (AccumulatorEntry memory item) {
        assembly ("memory-safe") {
            item := ptr
        }
    }

    function _nullPtr() private pure returns (Memory.Pointer) {
        return Memory.asPointer(0x00);
    }
}
