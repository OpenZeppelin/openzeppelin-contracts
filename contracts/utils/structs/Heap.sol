// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/structs/Heap.sol)

pragma solidity ^0.8.24;

import {Math} from "../math/Math.sol";
import {SafeCast} from "../math/SafeCast.sol";
import {Comparators} from "../Comparators.sol";
import {Arrays} from "../Arrays.sol";
import {Panic} from "../Panic.sol";
import {StorageSlot} from "../StorageSlot.sol";

/**
 * @dev Library for managing https://en.wikipedia.org/wiki/Binary_heap[binary heap] that can be used as
 * https://en.wikipedia.org/wiki/Priority_queue[priority queue].
 *
 * Heaps are represented as a tree of values where the first element (index 0) is the root, and where the node at
 * index i is the child of the node at index (i-1)/2 and the parent of nodes at index 2*i+1 and 2*i+2. Each node
 * stores an element of the heap.
 *
 * The structure is ordered so that each node is bigger than its parent. An immediate consequence is that the
 * highest priority value is the one at the root. This value can be looked up in constant time (O(1)) at
 * `heap.tree[0]`
 *
 * The structure is designed to perform the following operations with the corresponding complexities:
 *
 * * peek (get the highest priority value): O(1)
 * * insert (insert a value): O(log(n))
 * * pop (remove the highest priority value): O(log(n))
 * * replace (replace the highest priority value with a new value): O(log(n))
 * * length (get the number of elements): O(1)
 * * clear (remove all elements): O(1)
 *
 * IMPORTANT: This library allows for the use of custom comparator functions. Given that manipulating
 * memory can lead to unexpected behavior. Consider verifying that the comparator does not manipulate
 * the Heap's state directly and that it follows the Solidity memory safety rules.
 *
 * _Available since v5.1._
 */
library Heap {
    using Arrays for *;
    using Math for *;
    using SafeCast for *;

    /**
     * @dev Binary heap that supports values of type uint256.
     *
     * Each element of that structure uses one storage slot.
     */
    struct Uint256Heap {
        uint256[] tree;
    }

    /**
     * @dev Lookup the root element of the heap.
     */
    function peek(Uint256Heap storage self) internal view returns (uint256) {
        // self.tree[0] will `ARRAY_ACCESS_OUT_OF_BOUNDS` panic if heap is empty.
        return self.tree[0];
    }

    /**
     * @dev Remove (and return) the root element for the heap using the default comparator.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(Uint256Heap storage self) internal returns (uint256) {
        return pop(self, Comparators.lt);
    }

    /**
     * @dev Remove (and return) the root element for the heap using the provided comparator.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(
        Uint256Heap storage self,
        function(uint256, uint256) view returns (bool) comp
    ) internal returns (uint256) {
        unchecked {
            uint256 size = length(self);
            if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

            // cache
            uint256 rootValue = self.tree.unsafeAccess(0).value;
            uint256 lastValue = self.tree.unsafeAccess(size - 1).value;

            // swap last leaf with root, shrink tree and re-heapify
            self.tree.pop();
            self.tree.unsafeAccess(0).value = lastValue;
            _siftDown(self, size - 1, 0, lastValue, comp);

            return rootValue;
        }
    }

    /**
     * @dev Insert a new element in the heap using the default comparator.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(Uint256Heap storage self, uint256 value) internal {
        insert(self, value, Comparators.lt);
    }

    /**
     * @dev Insert a new element in the heap using the provided comparator.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(
        Uint256Heap storage self,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) internal {
        uint256 size = length(self);

        // push new item and re-heapify
        self.tree.push(value);
        _siftUp(self, size, value, comp);
    }

    /**
     * @dev Return the root element for the heap, and replace it with a new value, using the default comparator.
     * This is equivalent to using {pop} and {insert}, but requires only one rebalancing operation.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function replace(Uint256Heap storage self, uint256 newValue) internal returns (uint256) {
        return replace(self, newValue, Comparators.lt);
    }

    /**
     * @dev Return the root element for the heap, and replace it with a new value, using the provided comparator.
     * This is equivalent to using {pop} and {insert}, but requires only one rebalancing operation.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function replace(
        Uint256Heap storage self,
        uint256 newValue,
        function(uint256, uint256) view returns (bool) comp
    ) internal returns (uint256) {
        uint256 size = length(self);
        if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

        // cache
        uint256 oldValue = self.tree.unsafeAccess(0).value;

        // replace and re-heapify
        self.tree.unsafeAccess(0).value = newValue;
        _siftDown(self, size, 0, newValue, comp);

        return oldValue;
    }

    /**
     * @dev Returns the number of elements in the heap.
     */
    function length(Uint256Heap storage self) internal view returns (uint256) {
        return self.tree.length;
    }

    /**
     * @dev Removes all elements in the heap.
     */
    function clear(Uint256Heap storage self) internal {
        self.tree.unsafeSetLength(0);
    }

    /**
     * @dev Swap node `i` and `j` in the tree.
     */
    function _swap(Uint256Heap storage self, uint256 i, uint256 j) private {
        StorageSlot.Uint256Slot storage ni = self.tree.unsafeAccess(i);
        StorageSlot.Uint256Slot storage nj = self.tree.unsafeAccess(j);
        (ni.value, nj.value) = (nj.value, ni.value);
    }

    /**
     * @dev Perform heap maintenance on `self`, starting at `index` (with the `value`), using `comp` as a
     * comparator, and moving toward the leaves of the underlying tree.
     *
     * NOTE: This is a private function that is called in a trusted context with already cached parameters. `size`
     * and `value` could be extracted from `self` and `index`, but that would require redundant storage read. These
     * parameters are not verified. It is the caller role to make sure the parameters are correct.
     */
    function _siftDown(
        Uint256Heap storage self,
        uint256 size,
        uint256 index,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        unchecked {
            // Check if there is a risk of overflow when computing the indices of the child nodes. If that is the case,
            // there cannot be child nodes in the tree, so sifting is done.
            if (index >= type(uint256).max / 2) return;

            // Compute the indices of the potential child nodes
            uint256 lIndex = 2 * index + 1;
            uint256 rIndex = 2 * index + 2;

            // Three cases:
            // 1. Both children exist: sifting may continue on one of the branch (selection required)
            // 2. Only left child exist: sifting may continue on the left branch (no selection required)
            // 3. Neither child exist: sifting is done
            if (rIndex < size) {
                uint256 lValue = self.tree.unsafeAccess(lIndex).value;
                uint256 rValue = self.tree.unsafeAccess(rIndex).value;
                if (comp(lValue, value) || comp(rValue, value)) {
                    uint256 cIndex = comp(lValue, rValue).ternary(lIndex, rIndex);
                    _swap(self, index, cIndex);
                    _siftDown(self, size, cIndex, value, comp);
                }
            } else if (lIndex < size) {
                uint256 lValue = self.tree.unsafeAccess(lIndex).value;
                if (comp(lValue, value)) {
                    _swap(self, index, lIndex);
                    _siftDown(self, size, lIndex, value, comp);
                }
            }
        }
    }

    /**
     * @dev Perform heap maintenance on `self`, starting at `index` (with the `value`), using `comp` as a
     * comparator, and moving toward the root of the underlying tree.
     *
     * NOTE: This is a private function that is called in a trusted context with already cached parameters. `value`
     * could be extracted from `self` and `index`, but that would require redundant storage read. These parameters are not
     * verified. It is the caller role to make sure the parameters are correct.
     */
    function _siftUp(
        Uint256Heap storage self,
        uint256 index,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        unchecked {
            while (index > 0) {
                uint256 parentIndex = (index - 1) / 2;
                uint256 parentValue = self.tree.unsafeAccess(parentIndex).value;
                if (comp(parentValue, value)) break;
                _swap(self, index, parentIndex);
                index = parentIndex;
            }
        }
    }
}
