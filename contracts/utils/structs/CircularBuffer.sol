// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";
import {Arrays} from "../Arrays.sol";
import {Panic} from "../Panic.sol";

/**
 * @dev A fixed-length buffer for keeping `bytes32` items in storage.
 *
 * This data structure allows for pushing elements to it, and when its size exceeds the specified fixed length,
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
 * * The struct is called `Bytes32CircularBuffer`. Other types can be cast to and from `bytes32`. This data structure
 * can only be used in storage, and not in memory.
 * ```solidity
 * CircularBuffer.Bytes32CircularBuffer buffer;
 * ```
 */
library CircularBuffer {
    /**
     * @dev Counts the number of items that have been pushed to the buffer. The residu modulo _data.length indicates
     * where the next value should be stored.
     *
     * Struct members have an underscore prefix indicating that they are "private" and should not be read or written to
     * directly. Use the functions provided below instead. Modifying the struct manually may violate assumptions and
     * lead to unexpected behavior.
     *
     * The last item is at data[(index - 1) % data.length] and the last item is at data[index % data.length]. This
     * range can wrap around.
     */
    struct Bytes32CircularBuffer {
        uint256 _count;
        bytes32[] _data;
    }

    /**
     * @dev Initialize a new CircularBuffer of given length.
     *
     * If the CircularBuffer was already setup and used, calling that function again will reset it to a blank state.
     */
    function setup(Bytes32CircularBuffer storage self, uint256 size) internal {
        clear(self);
        Arrays.unsafeSetLength(self._data, size);
    }

    /**
     * @dev Clear all data in the buffer, keeping the existing length.
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
        uint256 module = self._data.length;
        Arrays.unsafeAccess(self._data, index % module).value = value;
    }

    /**
     * @dev Number of values currently in the buffer. This value is 0 for an empty buffer, and cannot exceed the size of
     * the buffer.
     */
    function count(Bytes32CircularBuffer storage self) internal view returns (uint256) {
        return Math.min(self._count, self._data.length);
    }

    /**
     * @dev Length of the buffer. This is the maximum number of elements kepts in the buffer.
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
        uint256 module = self._data.length;
        uint256 total = Math.min(index, module); // count(self)
        if (i >= total) {
            Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        }
        return Arrays.unsafeAccess(self._data, (index - i - 1) % module).value;
    }

    /**
     * @dev Check if a given value is in the buffer.
     */
    function includes(Bytes32CircularBuffer storage self, bytes32 value) internal view returns (bool) {
        uint256 index = self._count;
        uint256 module = self._data.length;
        uint256 total = Math.min(index, module); // count(self)
        for (uint256 i = 0; i < total; ++i) {
            if (Arrays.unsafeAccess(self._data, (index - i - 1) % module).value == value) {
                return true;
            }
        }
        return false;
    }
}
