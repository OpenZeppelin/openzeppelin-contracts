// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Arrays.sol)

pragma solidity ^0.8.0;

import "./math/Math.sol";

/**
 * @dev Collection of functions related to array types.
 */
library Arrays {
    /**
     * @dev Searches a sorted `array` and returns the first index that contains
     * a value greater or equal to `element`. If no such index exists (i.e. all
     * values in the array are strictly less than `element`), the array length is
     * returned. Time complexity O(log n).
     *
     * `array` is expected to be sorted in ascending order, and to contain no
     * repeated elements.
     */
    function findUpperBound(uint256[] storage array, uint256 element) internal view returns (uint256) {
        if (array.length == 0) {
            return 0;
        }

        uint256 low = 0;
        uint256 high = array.length;

        while (low < high) {
            uint256 mid = Math.average(low, high);

            // Note that mid will always be strictly less than high (i.e. it will be a valid array index)
            // because Math.average rounds down (it does integer division with truncation).
            if (array[mid] > element) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        // At this point `low` is the exclusive upper bound. We will return the inclusive upper bound.
        if (low > 0 && array[low - 1] == element) {
            return low - 1;
        } else {
            return low;
        }
    }

    /**
     * @dev Sorts `array` of integers in an ascending order.
     *
     * Sorting is done in-place using the heap sort algorithm.
     * Examples of gas cost with optimizer enabled for 200 runs:
     * - 10 random items: ~11K gas
     * - 100 random items: ~224K gas
     */
    function sort(uint256[] memory array) internal pure {
        unchecked {
            uint256 length = array.length;
            if (length < 2) return;
            // Heapify the array
            for (uint256 i = length / 2; i-- > 0; ) {
                _siftDown(array, length, i, array[i]);
            }
            // Drain all elements from highest to lowest and put them at the end of the array
            while (--length != 0) {
                uint256 val = array[0];
                _siftDown(array, length, 0, array[length]);
                array[length] = val;
            }
        }
    }

    /**
     * @dev Insert a `inserted` value into an empty space in a binary heap.
     * Makes sure that the space and all items below it still form a valid heap.
     * Index `empty` is considered empty and will be overwritten.
     */
    function _siftDown(
        uint256[] memory array,
        uint256 length,
        uint256 empty,
        uint256 inserted
    ) private pure {
        unchecked {
            while (true) {
                // The first child of empty, one level deeper in the heap
                uint256 child = empty * 2 + 1;
                // Empty has no children
                if (child >= length) break;
                uint256 childVal = array[child];
                uint256 otherChild = child + 1;
                // Pick the larger child
                if (otherChild < length) {
                    uint256 otherChildVal = array[otherChild];
                    if (otherChildVal > childVal) {
                        child = otherChild;
                        childVal = otherChildVal;
                    }
                }
                // No child is larger than the inserted value
                if (childVal <= inserted) break;
                // Move the larger child one level up and keep sifting down
                array[empty] = childVal;
                empty = child;
            }
            array[empty] = inserted;
        }
    }
}
