// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 *  TODO:
 *  - optimizations
 *  - changeset
 *  - add tests
 *  - add docs
 *  - add base impl link here
 *
 * @dev Library for managing a max heap data structure.
 *
 * A max heap is a complete binary tree where each node has a value greater than or equal to its children.
 * The root node contains the maximum value in the heap.
 *
 * This library provides functions to insert, update, and remove elements from the max heap, as well as to
 * retrieve the maximum element (peek) and check the validity of the heap.
 *
 * The max heap has the following properties:
 *
 * - Insertion: O(log n)
 * - Deletion of maximum element: O(log n)
 * - Retrieval of maximum element (peek): O(1)
 * - Update of an element: O(log n)
 *
 * The max heap is implemented using two mappings:
 * - `tree`: Maps the position in the heap to the item ID.
 * - `items`: Maps the item ID to its corresponding `Node` struct, which contains the value and heap index.
 *
 * Example usage:
 *
 * ```solidity
 * contract Example {
 *     using MaxHeap for MaxHeap.MaxHeap;
 *
 *     MaxHeap.MaxHeap private heap;
 *
 *     function addItem(uint256 itemId, uint256 value) public {
 *         heap.insert(itemId, value);
 *     }
 *
 *     function removeMax() public returns (uint256, uint256) {
 *         return heap.pop();
 *     }
 *
 *     function getMax() public view returns (uint256, uint256) {
 *         return heap.peek();
 *     }
 * }
 * ```
 */
library MaxHeap {
    /**
     * @dev The position doesn't have a _parent as it's the root.
     */
    error InvalidPositionZero();

    struct Node {
        uint256 value;
        uint256 heapIndex;
    }

    struct MaxHeap {
        mapping(uint256 => uint256) tree;
        mapping(uint256 => Node) items;
        uint256 size;
    }

    function _parent(uint256 pos) private pure returns (uint256) {
        if (pos == 0) revert InvalidPositionZero();
        return (pos - 1) / 2;
    }

    function _swap(MaxHeap storage heap, uint256 fpos, uint256 spos) private {
        (heap.tree[fpos], heap.tree[spos]) = (heap.tree[spos], heap.tree[fpos]);
        (heap.items[heap.tree[fpos]].heapIndex, heap.items[heap.tree[spos]].heapIndex) = (fpos, spos);
    }

    function heapify(MaxHeap storage heap, uint256 pos) internal {
        if (pos >= (heap.size / 2) && pos <= heap.size) return;

        uint256 left = 2 * pos + 1;
        uint256 right = left + 1;

        uint256 leftValue = left < heap.size ? heap.items[heap.tree[left]].value : 0;
        uint256 rightValue = right < heap.size ? heap.items[heap.tree[right]].value : 0;
        uint256 posValue = heap.items[heap.tree[pos]].value;

        if (posValue < leftValue || posValue < rightValue) {
            if (leftValue > rightValue) {
                _swap(heap, pos, left);
                heapify(heap, left);
            } else {
                _swap(heap, pos, right);
                heapify(heap, right);
            }
        }
    }

    function insert(MaxHeap storage heap, uint256 itemId, uint256 value) internal {
        heap.tree[heap.size] = itemId;
        heap.items[itemId] = Node({value: value, heapIndex: heap.size});

        uint256 current = heap.size;
        uint256 parentOfCurrent = _parent(current);

        while (current != 0 && heap.items[heap.tree[current]].value > heap.items[heap.tree[parentOfCurrent]].value) {
            uint256 parentOfCurrent = _parent(current);
            _swap(heap, current, parentOfCurrent);
            current = parentOfCurrent;
            parentOfCurrent = _parent(current);
        }
        heap.size++;
    }

    function update(MaxHeap storage heap, uint256 itemId, uint256 newValue) internal {
        // Check that itemId exists in heap
        // TODO: update return with revert?
        if (heap.items[itemId].heapIndex >= heap.size) return;

        uint256 position = heap.items[itemId].heapIndex;
        uint256 oldValue = heap.items[itemId].value;

        heap.items[itemId].value = newValue;

        if (newValue > oldValue) {
            while (
                position != 0 && heap.items[heap.tree[position]].value > heap.items[heap.tree[_parent(position)]].value
            ) {
                uint256 parentOfPosition = _parent(position);
                _swap(heap, position, parentOfPosition);
                position = parentOfPosition;
            }
        } else heapify(heap, position);
    }

    function pop(MaxHeap storage heap) internal returns (uint256, uint256) {
        // TODO: should it revert if empty?

        uint256 popped = heap.tree[0];
        uint256 returnValue = heap.items[popped].value;

        delete heap.items[popped];

        heap.tree[0] = heap.tree[--heap.size];

        heap.items[heap.tree[0]].heapIndex = 0;

        delete heap.tree[heap.size];

        heapify(heap, 0);

        return (popped, returnValue);
    }

    function peek(MaxHeap storage heap) internal view returns (uint256, uint256) {
        // TODO: should it revert if empty?
        return (heap.tree[0], heap.items[heap.tree[0]].value);
    }
}
