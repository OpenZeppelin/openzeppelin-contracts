// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../math/SafeCast.sol";

/**
 * @dev A sequence of items with the ability to efficiently push and pop items (i.e. insert and remove) on both ends of
 * the sequence (called front and back). Among other access patterns, it can be used to implement efficient LIFO and
 * FIFO queues. Storage use is optimized, and all operations are O(1) constant time. This includes {clear}, given that
 * the existing queue contents are left in storage.
 *
 * The struct is called `Bytes32Deque`. Other types can be cast to and from `bytes32`. This data structure can only be
 * used in storage, and not in memory.
 * ```
 * DoubleEndedQueue.Bytes32Deque queue;
 * ```
 */
library DoubleEndedQueue {
    /**
     * @dev An operation (e.g. {front}) couldn't be completed due to the queue being empty.
     */
    error Empty();

    /**
     * @dev An operation (e.g. {at}) could't be completed due to an index being out of bounds.
     */
    error OutOfBounds();

    // Since a queue is used by pushing and popping items one at a time, 128-bit indices are more than enough.
    // Indices are in the range [begin, end) which means:
    // - The first item is at data[begin]
    // - The last item is at data[end - 1]
    struct Bytes32Deque {
        int128 begin;
        int128 end;
        mapping(int128 => bytes32) data;
    }

    /**
     * @dev Inserts an item at the end of the queue.
     */
    function pushBack(Bytes32Deque storage deque, bytes32 value) internal {
        int128 backIndex = deque.end;
        deque.data[backIndex] = value;
        unchecked {
            deque.end = backIndex + 1;
        }
    }

    /**
     * @dev Removes the item at the end of the queue and returns it.
     *
     * Reverts with `Empty` if the queue is empty.
     */
    function popBack(Bytes32Deque storage deque) internal returns (bytes32 value) {
        if (empty(deque)) revert Empty();
        int128 backIndex;
        unchecked {
            backIndex = deque.end - 1;
        }
        value = deque.data[backIndex];
        delete deque.data[backIndex];
        deque.end = backIndex;
    }

    /**
     * @dev Inserts an item at the beginning of the queue.
     */
    function pushFront(Bytes32Deque storage deque, bytes32 value) internal {
        int128 frontIndex;
        unchecked {
            frontIndex = deque.begin - 1;
        }
        deque.data[frontIndex] = value;
        deque.begin = frontIndex;
    }

    /**
     * @dev Removes the item at the beginning of the queue and returns it.
     *
     * Reverts with `Empty` if the queue is empty.
     */
    function popFront(Bytes32Deque storage deque) internal returns (bytes32 value) {
        if (empty(deque)) revert Empty();
        int128 frontIndex = deque.begin;
        value = deque.data[frontIndex];
        delete deque.data[frontIndex];
        unchecked {
            deque.begin = frontIndex + 1;
        }
    }

    /**
     * @dev Returns the item at the beginning of the queue.
     */
    function front(Bytes32Deque storage deque) internal view returns (bytes32 value) {
        if (empty(deque)) revert Empty();
        int128 frontIndex = deque.begin;
        return deque.data[frontIndex];
    }

    /**
     * @dev Returns the item at the end of the queue.
     */
    function back(Bytes32Deque storage deque) internal view returns (bytes32 value) {
        if (empty(deque)) revert Empty();
        int128 backIndex;
        unchecked {
            backIndex = deque.end - 1;
        }
        return deque.data[backIndex];
    }

    /**
     * @dev Return the item at index `i`.
     *
     * Reverts with `OutOfBounds` if the index is out of bounds.
     */
    function at(Bytes32Deque storage deque, uint256 i) internal view returns (bytes32 value) {
        // int256(deque.begin) is a safe upcast
        int128 idx = SafeCast.toInt128(int256(deque.begin) + SafeCast.toInt256(i));
        if (idx >= deque.end) revert OutOfBounds();
        return deque.data[idx];
    }

    /**
     * @dev Resets the queue back to being empty.
     *
     * NOTE: The current items are left behind in storage. This does not affect the functioning of the queue, but misses
     * out on potential gas refunds.
     */
    function clear(Bytes32Deque storage deque) internal {
        deque.begin = 0;
        deque.end = 0;
    }

    /**
     * @dev Returns the number of items in the queue.
     */
    function length(Bytes32Deque storage deque) internal view returns (uint256) {
        unchecked {
            return SafeCast.toUint256(int256(deque.end) - int256(deque.begin));
        }
    }

    /**
     * @dev Returns true if the queue is empty.
     */
    function empty(Bytes32Deque storage deque) internal view returns (bool) {
        return deque.end <= deque.begin;
    }
}
