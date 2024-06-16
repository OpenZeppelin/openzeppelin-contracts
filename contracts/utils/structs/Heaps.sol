// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {SafeCast} from "../math/SafeCast.sol";
import {Comparators} from "../Comparators.sol";
import {Panic} from "../Panic.sol";

library Heaps {
    using SafeCast for uint256;

    /**
     * A Heap is represented as an array of Node objects. In this array we store two overlapping structures:
     * - A tree structure, where index 0 is the root, and for each index i, the childs are 2*i+1 and 2*i+2.
     *   For each index in this tree we have the `index` pointer that gives the position of the corresponding value.
     * - An array of values (payload). At each index we store a uint256 `value` and `lookup`, the index of the node
     *   that points to this value.
     *
     * Some invariant:
     *   ```
     *   i == heap.data[heap[data].index].lookup // for all index i
     *   i == heap.data[heap[data].lookup].index // for all index i
     *   ```
     *
     * The structure is order so that each node is bigger then its parent. An immediate consequence is that the
     * smallest value is the one at the root. It can be retrieved in O(1) at `heap.data[heap.data[0].index].value`
     *
     * This stucture is designed for the following complexities:
     * - insert: 0(log(n))
     * - pop (remove smallest value in set): O(log(n))
     * - top (get smallest value in set): O(1)
     */
    struct Heap {
        Node[] data;
    }

    // Index and lookup are bounded by the size of the structure. We could reasonnably limit that to uint20 (1 billion elemets)
    // Then could also limit the value to uint216 so that the entier structure fits into a single slot.
    struct Node {
        uint256 value;
        uint32 index; // position -> value
        uint32 lookup; // value -> position
    }

    /**
     * @dev Lookup the root element of the heap.
     */
    function top(Heap storage self) internal view returns (uint256) {
        return self.data[self.data[0].index].value;
    }

    /**
     * @dev Remove (and return) the root element for the heap using the default comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(Heap storage self) internal returns (uint256) {
        return pop(self, Comparators.lt);
    }

    /**
     * @dev Remove (and return) the root element for the heap using the provided comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(Heap storage self, function(uint256, uint256) view returns (bool) comp) internal returns (uint256) {
        uint32 length = size(self);

        if (length == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

        uint32 last = length - 1; // could be unchecked (check above)

        // get root location (in the data array) and value
        uint32 rootIdx = self.data[0].index;
        uint256 rootValue = self.data[rootIdx].value;

        // if root is not the last element of the data array (that will get pop-ed), reorder the data array.
        if (rootIdx != last) {
            // get details about the value stored in the last element of the array (that will get pop-ed)
            uint32 lastDataIdx = self.data[last].lookup;
            uint256 lastDataValue = self.data[last].value;
            // copy these values to the location of the root (that is safe, and that we no longer use)
            self.data[rootIdx].value = lastDataValue;
            self.data[rootIdx].lookup = lastDataIdx;
            // update the tree node that used to point to that last element (value now located where the root was)
            self.data[lastDataIdx].index = rootIdx;
        }

        // get last leaf location (in the data array) and value
        uint32 lastIdx = self.data[last].index;
        uint256 lastValue = self.data[lastIdx].value;

        // move the last leaf to the root, pop last leaf ...
        self.data[0].index = lastIdx;
        self.data[lastIdx].lookup = 0;
        self.data.pop();

        // ... and heapify
        _heapifyDown(self, last, 0, lastValue, comp);

        // return root value
        return rootValue;
    }

    /**
     * @dev Insert a new element in the heap using the default comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(Heap storage self, uint256 value) internal {
        insert(self, value, Comparators.lt);
    }

    /**
     * @dev Insert a new element in the heap using the provided comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(Heap storage self, uint256 value, function(uint256, uint256) view returns (bool) comp) internal {
        uint32 length = size(self);
        self.data.push(Node({index: length, lookup: length, value: value}));
        _heapifyUp(self, length, value, comp);
    }

    /**
     * @dev Returns the number of elements in the heap.
     */
    function size(Heap storage self) internal view returns (uint32) {
        return self.data.length.toUint32();
    }

    /*
     * @dev Swap node `i` and `j` in the tree.
     */
    function _swap(Heap storage self, uint32 i, uint32 j) private {
        uint32 ii = self.data[i].index;
        uint32 jj = self.data[j].index;
        // update pointers to the data (swap the value)
        self.data[i].index = jj;
        self.data[j].index = ii;
        // update lookup pointers for consistency
        self.data[ii].lookup = j;
        self.data[jj].lookup = i;
    }

    /**
     * @dev Perform heap maintenance on `self`, starting at position `pos` (with the `value`), using `comp` as a
     * comparator, and moving toward the leafs of the underlying tree.
     *
     * Note: This is a private function that is called in a trusted context with already cached parameters. `length`
     * and `value` could be extracted from `self` and `pos`, but that would require redundant storage read. These
     * parameters are not verified. It is the caller role to make sure the parameters are correct.
     */
    function _heapifyDown(
        Heap storage self,
        uint32 length,
        uint32 pos,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        uint32 left = 2 * pos + 1;
        uint32 right = 2 * pos + 2;

        if (right < length) {
            uint256 lValue = self.data[self.data[left].index].value;
            uint256 rValue = self.data[self.data[right].index].value;
            if (comp(lValue, value) || comp(rValue, value)) {
                if (comp(lValue, rValue)) {
                    _swap(self, pos, left);
                    _heapifyDown(self, length, left, value, comp);
                } else {
                    _swap(self, pos, right);
                    _heapifyDown(self, length, right, value, comp);
                }
            }
        } else if (left < length) {
            uint256 lValue = self.data[self.data[left].index].value;
            if (comp(lValue, value)) {
                _swap(self, pos, left);
                _heapifyDown(self, length, left, value, comp);
            }
        }
    }

    /**
     * @dev Perform heap maintenance on `self`, starting at position `pos` (with the `value`), using `comp` as a
     * comparator, and moving toward the root of the underlying tree.
     *
     * Note: This is a private function that is called in a trusted context with already cached parameters. `value`
     * could be extracted from `self` and `pos`, but that would require redundant storage read. This parameters is not
     * verified. It is the caller role to make sure the parameters are correct.
     */
    function _heapifyUp(
        Heap storage self,
        uint32 pos,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        unchecked {
            while (pos > 0) {
                uint32 parent = (pos - 1) / 2;
                uint256 parentValue = self.data[self.data[parent].index].value;
                if (comp(parentValue, value)) break;
                _swap(self, pos, parent);
                pos = parent;
            }
        }
    }
}
