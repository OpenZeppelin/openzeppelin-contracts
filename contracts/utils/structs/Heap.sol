// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Heap.js.

pragma solidity ^0.8.20;

import {SafeCast} from "../math/SafeCast.sol";
import {Comparators} from "../Comparators.sol";
import {Panic} from "../Panic.sol";

library Heap {
    using SafeCast for *;

    /**
     * A Heap is represented as an array of Node objects. In this array we store two overlapping structures:
     * - A tree structure, where index 0 is the root, and for each index i, the children are 2*i+1 and 2*i+2.
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
     * This structure is designed for the following complexities:
     * - insert: 0(log(n))
     * - pop (remove smallest value in set): O(log(n))
     * - top (get smallest value in set): O(1)
     */
    struct Uint256Heap {
        Uint256HeapNode[] data;
    }

    struct Uint256HeapNode {
        uint256 value;
        uint32 index; // position -> value
        uint32 lookup; // value -> position
    }

    /**
     * @dev Lookup the root element of the heap.
     */
    function top(Uint256Heap storage self) internal view returns (uint256) {
        return _unsafeNodeAccess(self, self.data[0].index).value;
    }

    /**
     * @dev Remove (and return) the root element for the heap using the default comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(Uint256Heap storage self) internal returns (uint256) {
        return pop(self, Comparators.lt);
    }

    /**
     * @dev Remove (and return) the root element for the heap using the provided comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(
        Uint256Heap storage self,
        function(uint256, uint256) view returns (bool) comp
    ) internal returns (uint256) {
        uint32 size = length(self);

        if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

        uint32 last = size - 1; // could be unchecked (check above)

        // get root location (in the data array) and value
        Uint256HeapNode storage rootNode = _unsafeNodeAccess(self, 0);
        uint32 rootIdx = rootNode.index;
        Uint256HeapNode storage rootData = _unsafeNodeAccess(self, rootIdx);
        Uint256HeapNode storage lastNode = _unsafeNodeAccess(self, last);
        uint256 rootDataValue = rootData.value;

        // if root is not the last element of the data array (that will get pop-ed), reorder the data array.
        if (rootIdx != last) {
            // get details about the value stored in the last element of the array (that will get pop-ed)
            uint32 lastDataIdx = lastNode.lookup;
            uint256 lastDataValue = lastNode.value;
            // copy these values to the location of the root (that is safe, and that we no longer use)
            rootData.value = lastDataValue;
            rootData.lookup = lastDataIdx;
            // update the tree node that used to point to that last element (value now located where the root was)
            _unsafeNodeAccess(self, lastDataIdx).index = rootIdx;
        }

        // get last leaf location (in the data array) and value
        uint32 lastIdx = lastNode.index;
        uint256 lastValue = _unsafeNodeAccess(self, lastIdx).value;

        // move the last leaf to the root, pop last leaf ...
        rootNode.index = lastIdx;
        _unsafeNodeAccess(self, lastIdx).lookup = 0;
        self.data.pop();

        // ... and heapify
        _heapifyDown(self, last, 0, lastValue, comp);

        // return root value
        return rootDataValue;
    }

    /**
     * @dev Insert a new element in the heap using the default comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(Uint256Heap storage self, uint256 value) internal {
        insert(self, value, Comparators.lt);
    }

    /**
     * @dev Insert a new element in the heap using the provided comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(
        Uint256Heap storage self,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) internal {
        uint32 size = length(self);
        self.data.push(Uint256HeapNode({index: size, lookup: size, value: value}));
        _heapifyUp(self, size, value, comp);
    }

    /**
     * @dev Returns the number of elements in the heap.
     */
    function length(Uint256Heap storage self) internal view returns (uint32) {
        return self.data.length.toUint32();
    }

    function clear(Uint256Heap storage self) internal {
        Uint256HeapNode[] storage data = self.data;
        /// @solidity memory-safe-assembly
        assembly {
            sstore(data.slot, 0)
        }
    }

    /*
     * @dev Swap node `i` and `j` in the tree.
     */
    function _swap(Uint256Heap storage self, uint32 i, uint32 j) private {
        Uint256HeapNode storage ni = _unsafeNodeAccess(self, i);
        Uint256HeapNode storage nj = _unsafeNodeAccess(self, j);
        uint32 ii = ni.index;
        uint32 jj = nj.index;
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
     * Note: This is a private function that is called in a trusted context with already cached parameters. `length`
     * and `value` could be extracted from `self` and `pos`, but that would require redundant storage read. These
     * parameters are not verified. It is the caller role to make sure the parameters are correct.
     */
    function _heapifyDown(
        Uint256Heap storage self,
        uint32 size,
        uint32 pos,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        uint32 left = 2 * pos + 1;
        uint32 right = 2 * pos + 2;

        if (right < size) {
            uint256 lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, left).index).value;
            uint256 rValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, right).index).value;
            if (comp(lValue, value) || comp(rValue, value)) {
                if (comp(lValue, rValue)) {
                    _swap(self, pos, left);
                    _heapifyDown(self, size, left, value, comp);
                } else {
                    _swap(self, pos, right);
                    _heapifyDown(self, size, right, value, comp);
                }
            }
        } else if (left < size) {
            uint256 lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, left).index).value;
            if (comp(lValue, value)) {
                _swap(self, pos, left);
                _heapifyDown(self, size, left, value, comp);
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
        Uint256Heap storage self,
        uint32 pos,
        uint256 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        unchecked {
            while (pos > 0) {
                uint32 parent = (pos - 1) / 2;
                uint256 parentValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, parent).index).value;
                if (comp(parentValue, value)) break;
                _swap(self, pos, parent);
                pos = parent;
            }
        }
    }

    function _unsafeNodeAccess(
        Uint256Heap storage self,
        uint32 pos
    ) private pure returns (Uint256HeapNode storage result) {
        assembly ("memory-safe") {
            mstore(0x00, self.slot)
            result.slot := add(keccak256(0x00, 0x20), mul(pos, 2))
        }
    }

    /**
     * A Heap is represented as an array of Node objects. In this array we store two overlapping structures:
     * - A tree structure, where index 0 is the root, and for each index i, the children are 2*i+1 and 2*i+2.
     *   For each index in this tree we have the `index` pointer that gives the position of the corresponding value.
     * - An array of values (payload). At each index we store a uint208 `value` and `lookup`, the index of the node
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
     * This structure is designed for the following complexities:
     * - insert: 0(log(n))
     * - pop (remove smallest value in set): O(log(n))
     * - top (get smallest value in set): O(1)
     */
    struct Uint208Heap {
        Uint208HeapNode[] data;
    }

    struct Uint208HeapNode {
        uint208 value;
        uint24 index; // position -> value
        uint24 lookup; // value -> position
    }

    /**
     * @dev Lookup the root element of the heap.
     */
    function top(Uint208Heap storage self) internal view returns (uint208) {
        return _unsafeNodeAccess(self, self.data[0].index).value;
    }

    /**
     * @dev Remove (and return) the root element for the heap using the default comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(Uint208Heap storage self) internal returns (uint208) {
        return pop(self, Comparators.lt);
    }

    /**
     * @dev Remove (and return) the root element for the heap using the provided comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function pop(
        Uint208Heap storage self,
        function(uint256, uint256) view returns (bool) comp
    ) internal returns (uint208) {
        uint24 size = length(self);

        if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

        uint24 last = size - 1; // could be unchecked (check above)

        // get root location (in the data array) and value
        Uint208HeapNode storage rootNode = _unsafeNodeAccess(self, 0);
        uint24 rootIdx = rootNode.index;
        Uint208HeapNode storage rootData = _unsafeNodeAccess(self, rootIdx);
        Uint208HeapNode storage lastNode = _unsafeNodeAccess(self, last);
        uint208 rootDataValue = rootData.value;

        // if root is not the last element of the data array (that will get pop-ed), reorder the data array.
        if (rootIdx != last) {
            // get details about the value stored in the last element of the array (that will get pop-ed)
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
        _heapifyDown(self, last, 0, lastValue, comp);

        // return root value
        return rootDataValue;
    }

    /**
     * @dev Insert a new element in the heap using the default comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(Uint208Heap storage self, uint208 value) internal {
        insert(self, value, Comparators.lt);
    }

    /**
     * @dev Insert a new element in the heap using the provided comparator.
     *
     * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
     * during the lifecycle of a heap will result in undefined behavior.
     */
    function insert(
        Uint208Heap storage self,
        uint208 value,
        function(uint256, uint256) view returns (bool) comp
    ) internal {
        uint24 size = length(self);
        self.data.push(Uint208HeapNode({index: size, lookup: size, value: value}));
        _heapifyUp(self, size, value, comp);
    }

    /**
     * @dev Returns the number of elements in the heap.
     */
    function length(Uint208Heap storage self) internal view returns (uint24) {
        return self.data.length.toUint24();
    }

    function clear(Uint208Heap storage self) internal {
        Uint208HeapNode[] storage data = self.data;
        /// @solidity memory-safe-assembly
        assembly {
            sstore(data.slot, 0)
        }
    }

    /*
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
     * Note: This is a private function that is called in a trusted context with already cached parameters. `length`
     * and `value` could be extracted from `self` and `pos`, but that would require redundant storage read. These
     * parameters are not verified. It is the caller role to make sure the parameters are correct.
     */
    function _heapifyDown(
        Uint208Heap storage self,
        uint24 size,
        uint24 pos,
        uint208 value,
        function(uint256, uint256) view returns (bool) comp
    ) private {
        uint24 left = 2 * pos + 1;
        uint24 right = 2 * pos + 2;

        if (right < size) {
            uint208 lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, left).index).value;
            uint208 rValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, right).index).value;
            if (comp(lValue, value) || comp(rValue, value)) {
                if (comp(lValue, rValue)) {
                    _swap(self, pos, left);
                    _heapifyDown(self, size, left, value, comp);
                } else {
                    _swap(self, pos, right);
                    _heapifyDown(self, size, right, value, comp);
                }
            }
        } else if (left < size) {
            uint208 lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, left).index).value;
            if (comp(lValue, value)) {
                _swap(self, pos, left);
                _heapifyDown(self, size, left, value, comp);
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
            result.slot := add(keccak256(0x00, 0x20), mul(pos, 1))
        }
    }
}