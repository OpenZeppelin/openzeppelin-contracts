// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/structs/DoubleEndedQueue.sol)
pragma solidity ^0.8.20;

import {Panic} from "../Panic.sol";

/**
 * @dev A sequence of items with the ability to efficiently push and pop items (i.e. insert and remove) on both ends of
 * the sequence (called front and back). Among other access patterns, it can be used to implement efficient LIFO and
 * FIFO queues. Storage use is optimized, and all operations are O(1) constant time. This includes {clear}, given that
 * the existing queue contents are left in storage.
 *
 * The struct is called `Bytes32Deque`. Other types can be cast to and from `bytes32`. This data structure can only be
 * used in storage, and not in memory.
 * ```solidity
 * DoubleEndedQueue.Bytes32Deque queue;
 * ```
 */
library DoubleEndedQueue {
    /**
     * @dev Indices are 128 bits so begin and end are packed in a single storage slot for efficient access.
     *
     * Struct members have an underscore prefix indicating that they are "private" and should not be read or written to
     * directly. Use the functions provided below instead. Modifying the struct manually may violate assumptions and
     * lead to unexpected behavior.
     *
     * The first item is at data[begin] and the last item is at data[end - 1]. This range can wrap around.
     */
    struct Bytes32Deque {
        uint128 _begin;
        uint128 _end;
        mapping(uint128 index => bytes32) _data;
    }

    /**
     * @dev Inserts an item at the end of the queue.
     *
     * Reverts with {Panic-RESOURCE_ERROR} if the queue is full.
     */
    function pushBack(Bytes32Deque storage deque, bytes32 value) internal {
        unchecked {
            uint128 backIndex = deque._end;
            if (backIndex + 1 == deque._begin) Panic.panic(Panic.RESOURCE_ERROR);
            deque._data[backIndex] = value;
            deque._end = backIndex + 1;
        }
    }

    /**
     * @dev Removes the item at the end of the queue and returns it.
     *
     * Reverts with {Panic-EMPTY_ARRAY_POP} if the queue is empty.
     */
    function popBack(Bytes32Deque storage deque) internal returns (bytes32 value) {
        unchecked {
            uint128 backIndex = deque._end;
            if (backIndex == deque._begin) Panic.panic(Panic.EMPTY_ARRAY_POP);
            --backIndex;
            value = deque._data[backIndex];
            delete deque._data[backIndex];
            deque._end = backIndex;
        }
    }

    /**
     * @dev Inserts an item at the beginning of the queue.
     *
     * Reverts with {Panic-RESOURCE_ERROR} if the queue is full.
     */
    function pushFront(Bytes32Deque storage deque, bytes32 value) internal {
        unchecked {
            uint128 frontIndex = deque._begin - 1;
            if (frontIndex == deque._end) Panic.panic(Panic.RESOURCE_ERROR);
            deque._data[frontIndex] = value;
            deque._begin = frontIndex;
        }
    }

    /**
     * @dev Removes the item at the beginning of the queue and returns it.
     *
     * Reverts with {Panic-EMPTY_ARRAY_POP} if the queue is empty.
     */
    function popFront(Bytes32Deque storage deque) internal returns (bytes32 value) {
        unchecked {
            uint128 frontIndex = deque._begin;
            if (frontIndex == deque._end) Panic.panic(Panic.EMPTY_ARRAY_POP);
            value = deque._data[frontIndex];
            delete deque._data[frontIndex];
            deque._begin = frontIndex + 1;
        }
    }

    /**
     * @dev Returns the item at the beginning of the queue.
     *
     * Reverts with {Panic-ARRAY_OUT_OF_BOUNDS} if the queue is empty.
     */
    function front(Bytes32Deque storage deque) internal view returns (bytes32 value) {
        if (empty(deque)) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        return deque._data[deque._begin];
    }

    /**
     * @dev Returns the item at the end of the queue.
     *
     * Reverts with {Panic-ARRAY_OUT_OF_BOUNDS} if the queue is empty.
     */
    function back(Bytes32Deque storage deque) internal view returns (bytes32 value) {
        if (empty(deque)) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        unchecked {
            return deque._data[deque._end - 1];
        }
    }

    /**
     * @dev Return the item at a position in the queue given by `index`, with the first item at 0 and last item at
     * `length(deque) - 1`.
     *
     * Reverts with {Panic-ARRAY_OUT_OF_BOUNDS} if the index is out of bounds.
     */
    function at(Bytes32Deque storage deque, uint256 index) internal view returns (bytes32 value) {
        if (index >= length(deque)) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        // By construction, length is a uint128, so the check above ensures that index can be safely downcast to uint128
        unchecked {
            return deque._data[deque._begin + uint128(index)];
        }
    }

    /**
     * @dev Resets the queue back to being empty.
     *
     * NOTE: The current items are left behind in storage. This does not affect the functioning of the queue, but misses
     * out on potential gas refunds.
     */
    function clear(Bytes32Deque storage deque) internal {
        deque._begin = 0;
        deque._end = 0;
    }

    /**
     * @dev Returns the number of items in the queue.
     */
    function length(Bytes32Deque storage deque) internal view returns (uint256) {
        unchecked {
            return uint256(deque._end - deque._begin);
        }
    }

    /**
     * @dev Returns true if the queue is empty.
     */
    function empty(Bytes32Deque storage deque) internal view returns (bool) {
        return deque._end == deque._begin;
    }
}
