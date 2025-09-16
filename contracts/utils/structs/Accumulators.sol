// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Memory} from "../Memory.sol";

/**
 * @dev Structure concatenating an arbitrary number of bytes buffers with limited memory allocation.
 */
library Accumulators {
    /**
     * @dev Bytes accumulator: a linked list of `bytes`.
     *
     * Note: This is a memory structure that SHOULD not be put in storage.
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
        self.head = Memory.asPointer(0x00);
        self.tail = Memory.asPointer(0x00);
    }

    /// @dev Add a bytes buffer to (the end of) an Accumulator
    function push(Accumulator memory self, bytes memory data) internal pure returns (Accumulator memory) {
        Memory.Pointer ptr = _asPtr(AccumulatorEntry({next: Memory.asPointer(0x00), data: Memory.asSlice(data)}));

        if (Memory.asBytes32(self.head) == 0x00) {
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
        Memory.Pointer ptr = _asPtr(AccumulatorEntry({next: self.head, data: Memory.asSlice(data)}));

        if (Memory.asBytes32(self.head) == 0x00) {
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
}
