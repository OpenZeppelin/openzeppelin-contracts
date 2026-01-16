// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/structs/DoubleEndedQueue.sol)
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
        bool success = tryPushBack(deque, value);
        if (!success) Panic.panic(Panic.RESOURCE_ERROR);
    }

    /**
     * @dev Attempts to insert an item at the end of the queue.
     *
     * Returns `false` if the queue is full. Never reverts.
     */
    function tryPushBack(Bytes32Deque storage deque, bytes32 value) internal returns (bool success) {
        unchecked {
            uint128 backIndex = deque._end;
            if (backIndex + 1 == deque._begin) return false;
            deque._data[backIndex] = value;
            deque._end = backIndex + 1;
            return true;
        }
    }

    /**
     * @dev Removes the item at the end of the queue and returns it.
     *
     * Reverts with {Panic-EMPTY_ARRAY_POP} if the queue is empty.
     */
    function popBack(Bytes32Deque storage deque) internal returns (bytes32) {
        (bool success, bytes32 value) = tryPopBack(deque);
        if (!success) Panic.panic(Panic.EMPTY_ARRAY_POP);
        return value;
    }

    /**
     * @dev Attempts to remove the item at the end of the queue and return it.
     *
     * Returns `(false, 0x00)` if the queue is empty. Never reverts.
     */
    function tryPopBack(Bytes32Deque storage deque) internal returns (bool success, bytes32 value) {
        unchecked {
            uint128 backIndex = deque._end;
            if (backIndex == deque._begin) return (false, bytes32(0));
            --backIndex;
            success = true;
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
        bool success = tryPushFront(deque, value);
        if (!success) Panic.panic(Panic.RESOURCE_ERROR);
    }

    /**
     * @dev Attempts to insert an item at the beginning of the queue.
     *
     * Returns `false` if the queue is full. Never reverts.
     */
    function tryPushFront(Bytes32Deque storage deque, bytes32 value) internal returns (bool success) {
        unchecked {
            uint128 frontIndex = deque._begin - 1;
            if (frontIndex == deque._end) return false;
            deque._data[frontIndex] = value;
            deque._begin = frontIndex;
            return true;
        }
    }

    /**
     * @dev Removes the item at the beginning of the queue and returns it.
     *
     * Reverts with {Panic-EMPTY_ARRAY_POP} if the queue is empty.
     */
    function popFront(Bytes32Deque storage deque) internal returns (bytes32) {
        (bool success, bytes32 value) = tryPopFront(deque);
        if (!success) Panic.panic(Panic.EMPTY_ARRAY_POP);
        return value;
    }

    /**
     * @dev Attempts to remove the item at the beginning of the queue and
     * return it.
     *
     * Returns `(false, 0x00)` if the queue is empty. Never reverts.
     */
    function tryPopFront(Bytes32Deque storage deque) internal returns (bool success, bytes32 value) {
        unchecked {
            uint128 frontIndex = deque._begin;
            if (frontIndex == deque._end) return (false, bytes32(0));
            success = true;
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
    function front(Bytes32Deque storage deque) internal view returns (bytes32) {
        (bool success, bytes32 value) = tryFront(deque);
        if (!success) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        return value;
    }

    /**
     * @dev Attempts to return the item at the beginning of the queue.
     *
     * Returns `(false, 0x00)` if the queue is empty. Never reverts.
     */
    function tryFront(Bytes32Deque storage deque) internal view returns (bool success, bytes32 value) {
        if (empty(deque)) return (false, bytes32(0));
        return (true, deque._data[deque._begin]);
    }

    /**
     * @dev Returns the item at the end of the queue.
     *
     * Reverts with {Panic-ARRAY_OUT_OF_BOUNDS} if the queue is empty.
     */
    function back(Bytes32Deque storage deque) internal view returns (bytes32) {
        (bool success, bytes32 value) = tryBack(deque);
        if (!success) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        return value;
    }

    /**
     * @dev Attempts to return the item at the end of the queue.
     *
     * Returns `(false, 0x00)` if the queue is empty. Never reverts.
     */
    function tryBack(Bytes32Deque storage deque) internal view returns (bool success, bytes32 value) {
        if (empty(deque)) return (false, bytes32(0));
        unchecked {
            return (true, deque._data[deque._end - 1]);
        }
    }

    /**
     * @dev Return the item at a position in the queue given by `index`, with the first item at 0 and last item at
     * `length(deque) - 1`.
     *
     * Reverts with {Panic-ARRAY_OUT_OF_BOUNDS} if the index is out of bounds.
     */
    function at(Bytes32Deque storage deque, uint256 index) internal view returns (bytes32) {
        (bool success, bytes32 value) = tryAt(deque, index);
        if (!success) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        return value;
    }

    /**
     * @dev Attempts to return the item at a position in the queue given by `index`, with the first item at
     * 0 and the last item at `length(deque) - 1`.
     *
     * Returns `(false, 0x00)` if the index is out of bounds. Never reverts.
     */
    function tryAt(Bytes32Deque storage deque, uint256 index) internal view returns (bool success, bytes32 value) {
        if (index >= length(deque)) return (false, bytes32(0));
        // By construction, length is a uint128, so the check above ensures that index can be safely downcast to uint128
        unchecked {
            return (true, deque._data[deque._begin + uint128(index)]);
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
