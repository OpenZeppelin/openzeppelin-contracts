// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/structs/CircularBuffer.sol)

pragma solidity ^0.8.24;

import {Math} from "../math/Math.sol";
import {Arrays} from "../Arrays.sol";
import {Panic} from "../Panic.sol";

/**
 * @dev A fixed-size buffer for keeping `bytes32` items in storage.
 *
 * This data structure allows for pushing elements to it, and when its length exceeds the specified fixed size,
 * new items take the place of the oldest element in the buffer, keeping at most `N` elements in the
 * structure.
 *
 * Elements can't be removed but the data structure can be cleared. See {clear}.
 *
 * Complexity:
 * - insertion ({push}): O(1)
 * - lookup ({last}): O(1)
 * - inclusion ({includes}): O(N) (worst case)
 * - reset ({clear}): O(1)
 *
 * The struct is called `Bytes32CircularBuffer`. Other types can be cast to and from `bytes32`. This data structure
 * can only be used in storage, and not in memory.
 *
 * Example usage:
 *
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using CircularBuffer for CircularBuffer.Bytes32CircularBuffer;
 *
 *     // Declare a buffer storage variable
 *     CircularBuffer.Bytes32CircularBuffer private myBuffer;
 * }
 * ```
 *
 * _Available since v5.1._
 */
library CircularBuffer {
    /**
     * @dev Error emitted when trying to setup a buffer with a size of 0.
     */
    error InvalidBufferSize();

    /**
     * @dev Counts the number of items that have been pushed to the buffer. The residuo modulo _data.length indicates
     * where the next value should be stored.
     *
     * Struct members have an underscore prefix indicating that they are "private" and should not be read or written to
     * directly. Use the functions provided below instead. Modifying the struct manually may violate assumptions and
     * lead to unexpected behavior.
     *
     * In a full buffer:
     * - The most recently pushed item (last) is at data[(index - 1) % data.length]
     * - The oldest item (first) is at data[index % data.length]
     */
    struct Bytes32CircularBuffer {
        uint256 _count;
        bytes32[] _data;
    }

    /**
     * @dev Initialize a new CircularBuffer of a given size.
     *
     * If the CircularBuffer was already setup and used, calling that function again will reset it to a blank state.
     *
     * NOTE: The size of the buffer will affect the execution of {includes} function, as it has a complexity of O(N).
     * Consider a large buffer size may render the function unusable.
     */
    function setup(Bytes32CircularBuffer storage self, uint256 size) internal {
        if (size == 0) revert InvalidBufferSize();
        clear(self);
        Arrays.unsafeSetLength(self._data, size);
    }

    /**
     * @dev Clear all data in the buffer without resetting memory, keeping the existing size.
     */
    function clear(Bytes32CircularBuffer storage self) internal {
        self._count = 0;
    }

    /**
     * @dev Push a new value to the buffer. If the buffer is already full, the new value replaces the oldest value in
     * the buffer.
     */
    function push(Bytes32CircularBuffer storage self, bytes32 value) internal {
        uint256 index = self._count++;
        uint256 modulus = self._data.length;
        Arrays.unsafeAccess(self._data, index % modulus).value = value;
    }

    /**
     * @dev Number of values currently in the buffer. This value is 0 for an empty buffer, and cannot exceed the size of
     * the buffer.
     */
    function count(Bytes32CircularBuffer storage self) internal view returns (uint256) {
        return Math.min(self._count, self._data.length);
    }

    /**
     * @dev Length of the buffer. This is the maximum number of elements kept in the buffer.
     */
    function length(Bytes32CircularBuffer storage self) internal view returns (uint256) {
        return self._data.length;
    }

    /**
     * @dev Getter for the i-th value in the buffer, from the end.
     *
     * Reverts with {Panic-ARRAY_OUT_OF_BOUNDS} if trying to access an element that was not pushed, or that was
     * dropped to make room for newer elements.
     */
    function last(Bytes32CircularBuffer storage self, uint256 i) internal view returns (bytes32) {
        uint256 index = self._count;
        uint256 modulus = self._data.length;
        uint256 total = Math.min(index, modulus); // count(self)
        if (i >= total) {
            Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        }
        return Arrays.unsafeAccess(self._data, (index - i - 1) % modulus).value;
    }

    /**
     * @dev Check if a given value is in the buffer.
     */
    function includes(Bytes32CircularBuffer storage self, bytes32 value) internal view returns (bool) {
        uint256 index = self._count;
        uint256 modulus = self._data.length;
        uint256 total = Math.min(index, modulus); // count(self)
        for (uint256 i = 0; i < total; ++i) {
            if (Arrays.unsafeAccess(self._data, (index - i - 1) % modulus).value == value) {
                return true;
            }
        }
        return false;
    }
}
