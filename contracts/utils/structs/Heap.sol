// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Heap.js.

pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";
import {SafeCast} from "../math/SafeCast.sol";
import {Comparators} from "../Comparators.sol";
import {Panic} from "../Panic.sol";

/**
 * @dev Library for managing https://en.wikipedia.org/wiki/Binary_heap[binary heap] that can be used as
 * https://en.wikipedia.org/wiki/Priority_queue[priority queue].
 *
 * Heaps are represented as an array of Node objects. This array stores two overlapping structures:
 * * A tree structure where the first element (index 0) is the root, and where the node at index i is the child of the
 *   node at index (i-1)/2 and the father of nodes at index 2*i+1 and 2*i+2. Each node stores the index (in the array)
 *   where the corresponding value is stored.
 * * A list of payloads values where each index contains a value and a lookup index. The type of the value depends on
 *   the variant being used. The lookup is the index of the node (in the tree) that points to this value.
 *
 * Some invariants:
 *   ```
 *   i == heap.data[heap.data[i].index].lookup // for all indices i
 *   i == heap.data[heap.data[i].lookup].index // for all indices i
 *   ```
 *
 * The structure is ordered so that each node is bigger than its parent. An immediate consequence is that the
 * highest priority value is the one at the root. This value can be looked up in constant time (O(1)) at
 * `heap.data[heap.data[0].index].value`
 *
 * The structure is designed to perform the following operations with the corresponding complexities:
 *
 * * peek (get the highest priority value): O(1)
 * * insert (insert a value): O(log(n))
 * * pop (remove the highest priority value): O(log(n))
 * * replace (replace the highest priority value with a new value): O(log(n))
 * * length (get the number of elements): O(1)
 * * clear (remove all elements): O(1)
 */
library Heap {
    using Math for *;
    using SafeCast for *;

    /**
     * @dev Binary heap that support values of type uint256.
     *
     * Each element of that structure uses 2 storage slots.
     */
    struct Uint256Heap {
        Uint256HeapNode[] data;
    }

    /**
     * @dev Internal node type for Uint256Heap. Stores a value of type uint256.
     */
    struct Uint256HeapNode {
        uint256 value;
        uint64 index; // position -> value
        uint64 lookup; // value -> position
    }

    /**
     * @dev Lookup the root element of the heap.
     */
    function peek(Uint256Heap storage self) internal view returns (uint256) {
        // self.data[0] will `ARRAY_ACCESS_OUT_OF_BOUNDS` panic if heap is empty.
        return _unsafeNodeAccess(self, self.data[0].index).value;
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
            uint64 size = length(self);
            if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

            uint64 last = size - 1;

            // get root location (in the data array) and value
            Uint256HeapNode storage rootNode = _unsafeNodeAccess(self, 0);
            uint64 rootIdx = rootNode.index;
            Uint256HeapNode storage rootData = _unsafeNodeAccess(self, rootIdx);
            Uint256HeapNode storage lastNode = _unsafeNodeAccess(self, last);
            uint256 rootDataValue = rootData.value;

            // if root is not the last element of the data array (that will get popped), reorder the data array.
            if (rootIdx != last) {
                // get details about the value stored in the last element of the array (that will get popped)
                uint64 lastDataIdx = lastNode.lookup;
                uint256 lastDataValue = lastNode.value;
                // copy these values to the location of the root (that is safe, and that we no longer use)
                rootData.value = lastDataValue;
                rootData.lookup = lastDataIdx;
                // update the tree node that used to point to that last element (value now located where the root was)
                _unsafeNodeAccess(self, lastDataIdx).index = rootIdx;
            }

            // get last leaf location (in the data array) and value
            uint64 lastIdx = lastNode.index;
            uint256 lastValue = _unsafeNodeAccess(self, lastIdx).value;

            // move the last leaf to the root, pop last leaf ...
            rootNode.index = lastIdx;
            _unsafeNodeAccess(self, lastIdx).lookup = 0;
            self.data.pop();

            // ... and heapify
            _siftDown(self, last, 0, lastValue, comp);

            // return root value
            return rootDataValue;
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
        uint64 size = length(self);
        if (size == type(uint64).max) Panic.panic(Panic.RESOURCE_ERROR);

        self.data.push(Uint256HeapNode({index: size, lookup: size, value: value}));
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
        uint64 size = length(self);
        if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

        // position of the node that holds the data for the root
        uint64 rootIdx = _unsafeNodeAccess(self, 0).index;
        // storage pointer to the node that holds the data for the root
        Uint256HeapNode storage rootData = _unsafeNodeAccess(self, rootIdx);

        // cache old value and replace it
        uint256 oldValue = rootData.value;
        rootData.value = newValue;

        // re-heapify
        _siftDown(self, size, 0, newValue, comp);

        // return old root value
        return oldValue;
    }

    /**
     * @dev Returns the number of elements in the heap.
     */
    function length(Uint256Heap storage self) internal view returns (uint64) {
        return self.data.length.toUint64();
    }

    /**
     * @dev Removes all elements in the heap.
     */
    function clear(Uint256Heap storage self) internal {
        Uint256HeapNode[] storage data = self.data;
        assembly ("memory-safe") {
            sstore(data.slot, 0)
        }
    }

    /**
     * @dev Swap node `i` and `j` in the tree.
     */
    function _swap(Uint256Heap storage self, uint64 i, uint64 j) private {
        Uint256HeapNode storage ni = _unsafeNodeAccess(self, i);
        Uint256HeapNode storage nj = _unsafeNodeAccess(self, j);
        uint64 ii = ni.index;
        uint64 jj = nj.index;
        // update pointers to the data (swap the value)
        ni.index = jj;
        nj.index = ii;
        // update lookup pointers for consistency
        _unsafeNodeAccess(self, ii).lookup = j;
        _unsafeNodeAccess(self, jj).lookup = i;
    }

    /**
     * @dev Perform heap maintenance on `self`, starting at position `pos` (with the `value`), using `comp` as a
     * comparator, and moving toward the leafs of the underlying tree.
     *
     * NOTE: This is a private function that is called in a trusted context with already cached parameters. `length`
     * and `value` could be extracted from `self` and `pos`, but that would require redundant storage read. These
     * parameters are not verified. It is the caller role to make sure the parameters are correct.
     */
    function _siftDown(
        Uint256Heap storage self,
        uint64 size,
        uint64 pos,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        uint256 left = 2 * pos + 1; // this could overflow uint64
        uint256 right = 2 * pos + 2; // this could overflow uint64

        if (right < size) {
            // the check guarantees that `left` and `right` are both valid uint64
            uint64 lIndex = uint64(left);
            uint64 rIndex = uint64(right);
            uint256 lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, lIndex).index).value;
            uint256 rValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, rIndex).index).value;
            if (comp(lValue, value) || comp(rValue, value)) {
                uint64 index = uint64(comp(lValue, rValue).ternary(lIndex, rIndex));
                _swap(self, pos, index);
                _siftDown(self, size, index, value, comp);
            }
        } else if (left < size) {
            // the check guarantees that `left` is a valid uint64
            uint64 lIndex = uint64(left);
            uint256 lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, lIndex).index).value;
            if (comp(lValue, value)) {
                _swap(self, pos, lIndex);
                _siftDown(self, size, lIndex, value, comp);
            }
        }
    }

    /**
     * @dev Perform heap maintenance on `self`, starting at position `pos` (with the `value`), using `comp` as a
     * comparator, and moving toward the root of the underlying tree.
     *
     * NOTE: This is a private function that is called in a trusted context with already cached parameters. `value`
     * could be extracted from `self` and `pos`, but that would require redundant storage read. These parameters are not
     * verified. It is the caller role to make sure the parameters are correct.
     */
    function _siftUp(
        Uint256Heap storage self,
        uint64 pos,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        unchecked {
            while (pos > 0) {
                uint64 parent = (pos - 1) / 2;
                uint256 parentValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, parent).index).value;
                if (comp(parentValue, value)) break;
                _swap(self, pos, parent);
                pos = parent;
            }
        }
    }

    function _unsafeNodeAccess(
        Uint256Heap storage self,
        uint64 pos
    ) private pure returns (Uint256HeapNode storage result) {
        assembly ("memory-safe") {
            mstore(0x00, self.slot)
            result.slot := add(keccak256(0x00, 0x20), mul(pos, 2))
        }
    }

    /**
     * @dev Binary heap that support values of type uint208.
     *
     * Each element of that structure uses 1 storage slots.
     */
    struct Uint208Heap {
        Uint208HeapNode[] data;
    }

    /**
     * @dev Internal node type for Uint208Heap. Stores a value of type uint208.
     */
    struct Uint208HeapNode {
        uint208 value;
        uint24 index; // position -> value
        uint24 lookup; // value -> position
    }

    /**
     * @dev Lookup the root element of the heap.
     */
    function peek(Uint208Heap storage self) internal view returns (uint208) {
        // self.data[0] will `ARRAY_ACCESS_OUT_OF_BOUNDS` panic if heap is empty.
        return _unsafeNodeAccess(self, self.data[0].index).value;
    }

    /**
     * @dev Remove (and return) the root element for the heap using the default comparator.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(Uint208Heap storage self) internal returns (uint208) {
        return pop(self, Comparators.lt);
    }

    /**
     * @dev Remove (and return) the root element for the heap using the provided comparator.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(
        Uint208Heap storage self,
        function(uint256, uint256) view returns (bool) comp
    ) internal returns (uint208) {
        unchecked {
            uint24 size = length(self);
            if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

            uint24 last = size - 1;

            // get root location (in the data array) and value
            Uint208HeapNode storage rootNode = _unsafeNodeAccess(self, 0);
            uint24 rootIdx = rootNode.index;
            Uint208HeapNode storage rootData = _unsafeNodeAccess(self, rootIdx);
            Uint208HeapNode storage lastNode = _unsafeNodeAccess(self, last);
            uint208 rootDataValue = rootData.value;

            // if root is not the last element of the data array (that will get popped), reorder the data array.
            if (rootIdx != last) {
                // get details about the value stored in the last element of the array (that will get popped)
                uint24 lastDataIdx = lastNode.lookup;
                uint208 lastDataValue = lastNode.value;
                // copy these values to the location of the root (that is safe, and that we no longer use)
                rootData.value = lastDataValue;
                rootData.lookup = lastDataIdx;
                // update the tree node that used to point to that last element (value now located where the root was)
                _unsafeNodeAccess(self, lastDataIdx).index = rootIdx;
            }

            // get last leaf location (in the data array) and value
            uint24 lastIdx = lastNode.index;
            uint208 lastValue = _unsafeNodeAccess(self, lastIdx).value;

            // move the last leaf to the root, pop last leaf ...
            rootNode.index = lastIdx;
            _unsafeNodeAccess(self, lastIdx).lookup = 0;
            self.data.pop();

            // ... and heapify
            _siftDown(self, last, 0, lastValue, comp);

            // return root value
            return rootDataValue;
        }
    }

    /**
     * @dev Insert a new element in the heap using the default comparator.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(Uint208Heap storage self, uint208 value) internal {
        insert(self, value, Comparators.lt);
    }

    /**
     * @dev Insert a new element in the heap using the provided comparator.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(
        Uint208Heap storage self,
        uint208 value,
        function(uint256, uint256) view returns (bool) comp
    ) internal {
        uint24 size = length(self);
        if (size == type(uint24).max) Panic.panic(Panic.RESOURCE_ERROR);

        self.data.push(Uint208HeapNode({index: size, lookup: size, value: value}));
        _siftUp(self, size, value, comp);
    }

    /**
     * @dev Return the root element for the heap, and replace it with a new value, using the default comparator.
     * This is equivalent to using {pop} and {insert}, but requires only one rebalancing operation.
     *
     * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function replace(Uint208Heap storage self, uint208 newValue) internal returns (uint208) {
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
        Uint208Heap storage self,
        uint208 newValue,
        function(uint256, uint256) view returns (bool) comp
    ) internal returns (uint208) {
        uint24 size = length(self);
        if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

        // position of the node that holds the data for the root
        uint24 rootIdx = _unsafeNodeAccess(self, 0).index;
        // storage pointer to the node that holds the data for the root
        Uint208HeapNode storage rootData = _unsafeNodeAccess(self, rootIdx);

        // cache old value and replace it
        uint208 oldValue = rootData.value;
        rootData.value = newValue;

        // re-heapify
        _siftDown(self, size, 0, newValue, comp);

        // return old root value
        return oldValue;
    }

    /**
     * @dev Returns the number of elements in the heap.
     */
    function length(Uint208Heap storage self) internal view returns (uint24) {
        return self.data.length.toUint24();
    }

    /**
     * @dev Removes all elements in the heap.
     */
    function clear(Uint208Heap storage self) internal {
        Uint208HeapNode[] storage data = self.data;
        assembly ("memory-safe") {
            sstore(data.slot, 0)
        }
    }

    /**
     * @dev Swap node `i` and `j` in the tree.
     */
    function _swap(Uint208Heap storage self, uint24 i, uint24 j) private {
        Uint208HeapNode storage ni = _unsafeNodeAccess(self, i);
        Uint208HeapNode storage nj = _unsafeNodeAccess(self, j);
        uint24 ii = ni.index;
        uint24 jj = nj.index;
        // update pointers to the data (swap the value)
        ni.index = jj;
        nj.index = ii;
        // update lookup pointers for consistency
        _unsafeNodeAccess(self, ii).lookup = j;
        _unsafeNodeAccess(self, jj).lookup = i;
    }

    /**
     * @dev Perform heap maintenance on `self`, starting at position `pos` (with the `value`), using `comp` as a
     * comparator, and moving toward the leafs of the underlying tree.
     *
     * NOTE: This is a private function that is called in a trusted context with already cached parameters. `length`
     * and `value` could be extracted from `self` and `pos`, but that would require redundant storage read. These
     * parameters are not verified. It is the caller role to make sure the parameters are correct.
     */
    function _siftDown(
        Uint208Heap storage self,
        uint24 size,
        uint24 pos,
        uint208 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        uint256 left = 2 * pos + 1; // this could overflow uint24
        uint256 right = 2 * pos + 2; // this could overflow uint24

        if (right < size) {
            // the check guarantees that `left` and `right` are both valid uint24
            uint24 lIndex = uint24(left);
            uint24 rIndex = uint24(right);
            uint208 lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, lIndex).index).value;
            uint208 rValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, rIndex).index).value;
            if (comp(lValue, value) || comp(rValue, value)) {
                uint24 index = uint24(comp(lValue, rValue).ternary(lIndex, rIndex));
                _swap(self, pos, index);
                _siftDown(self, size, index, value, comp);
            }
        } else if (left < size) {
            // the check guarantees that `left` is a valid uint24
            uint24 lIndex = uint24(left);
            uint208 lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, lIndex).index).value;
            if (comp(lValue, value)) {
                _swap(self, pos, lIndex);
                _siftDown(self, size, lIndex, value, comp);
            }
        }
    }

    /**
     * @dev Perform heap maintenance on `self`, starting at position `pos` (with the `value`), using `comp` as a
     * comparator, and moving toward the root of the underlying tree.
     *
     * NOTE: This is a private function that is called in a trusted context with already cached parameters. `value`
     * could be extracted from `self` and `pos`, but that would require redundant storage read. These parameters are not
     * verified. It is the caller role to make sure the parameters are correct.
     */
    function _siftUp(
        Uint208Heap storage self,
        uint24 pos,
        uint208 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        unchecked {
            while (pos > 0) {
                uint24 parent = (pos - 1) / 2;
                uint208 parentValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, parent).index).value;
                if (comp(parentValue, value)) break;
                _swap(self, pos, parent);
                pos = parent;
            }
        }
    }

    function _unsafeNodeAccess(
        Uint208Heap storage self,
        uint24 pos
    ) private pure returns (Uint208HeapNode storage result) {
        assembly ("memory-safe") {
            mstore(0x00, self.slot)
            result.slot := add(keccak256(0x00, 0x20), pos)
        }
    }
}
