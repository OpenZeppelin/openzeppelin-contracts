// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Library for managing linked lists. The linked lists support introspection, addition, and deletion.
 * Order is maintained while adding and removing elements from the list does not require a full traversal.
 *
 * The linked lists are signly linked. They are optimized for manipulation at or near the tail of the list. This is
 * done by having a "reversed" linked list.
 */
library LinkedList {
    error LinkListEmpty();

    struct Bytes32LinkedList {
        mapping(bytes32 => bytes32) _list;
        uint256 _size;
    }

    bytes32 private constant SENTINEL = keccak256(abi.encode("SENTINEL"));

    /// @dev Returns the last element in the linked list. O(1)
    function peek(Bytes32LinkedList storage self) internal view returns (bytes32) {
        bytes32 val = self._list[SENTINEL];
        return val;
    }

    /// @dev Insert a `value` into the linked list before the `next` element. O(1)
    function insert(Bytes32LinkedList storage self, bytes32 next, bytes32 value) internal returns (bool) {
        if (next == 0) {
            next = SENTINEL;
        }

        if (value == 0 || value == SENTINEL) {
            return false;
        }

        if (self._list[value] != 0) {
            return false;
        }

        bytes32 prev = self._list[next];
        self._list[value] = prev == 0 ? SENTINEL : prev;
        self._list[next] = value;
        self._size++;

        return true;
    }

    /// @dev Insert a `value` into the linked list at index `index`. O(n)
    function insert(Bytes32LinkedList storage self, uint256 index, bytes32 value) internal returns (bool) {
        uint256 size_ = self._size;
        if (index > size_) {
            return false;
        }

        uint256 currentIndex = size_;
        bytes32 next = self._list[SENTINEL];

        while (currentIndex != index) {
            next = self._list[next];
            currentIndex--;
        }

        return insert(self, next, value);
    }

    /// @dev Push a `value` onto the end of the linked list. O(1)
    function push(Bytes32LinkedList storage self, bytes32 value) internal {
        insert(self, SENTINEL, value);
    }

    /// @dev Removes the element before `next` in the linked list. Returns true on success, false otherwise. O(1)
    function removeEfficient(Bytes32LinkedList storage self, bytes32 next) internal returns (bool) {
        if (next == 0) {
            next = SENTINEL;
        }

        bytes32 val = self._list[next];
        if (val == SENTINEL) {
            return false;
        }
        bytes32 prev = self._list[val];

        self._list[next] = prev;
        delete self._list[val];
        self._size--;

        return true;
    }

    /// @dev Remove a give `value` from the linked list. Returns true on success, false otherwise. O(n)
    function remove(Bytes32LinkedList storage self, bytes32 value) internal returns (bool) {
        if (self._list[value] == 0) {
            return false;
        }

        bytes32 next = SENTINEL;
        while (self._list[next] != value) {
            next = self._list[next];
            if (next == SENTINEL) {
                return false;
            }
        }

        return removeEfficient(self, next);
    }

    /// @dev Remove the element at `index` from the linked list. Optimized for high indices. O(n)
    function removeAt(Bytes32LinkedList storage self, uint256 index) internal returns (bool success, bytes32 value) {
        if (index >= self._size) {
            return (false, bytes32(0));
        }

        bytes32 next = SENTINEL;
        uint256 currentIndex = self._size - 1;

        while (currentIndex != index) {
            next = self._list[next];
            currentIndex--;
        }

        bytes32 returnVal = self._list[next];
        return (removeEfficient(self, next), returnVal);
    }

    /// @dev Remove the last element from the linked list and return it. O(1)
    function pop(Bytes32LinkedList storage self) internal returns (bytes32) {
        bytes32 removedVal = self._list[SENTINEL];
        if (!removeEfficient(self, SENTINEL)) revert LinkListEmpty();

        return removedVal;
    }

    /// @dev Check if `value` is contained in the linked list. O(1)
    function contains(Bytes32LinkedList storage self, bytes32 value) internal view returns (bool) {
        return self._list[value] != 0;
    }

    /// @dev Removes all elements from the linked list. O(n)
    function clear(Bytes32LinkedList storage self) internal {
        bytes32 prev = SENTINEL;
        delete self._size;

        while (prev != 0) {
            bytes32 newPrev = self._list[prev];
            delete self._list[prev];
            prev = newPrev;
        }
    }

    /// @dev Get all elements from the linked list. O(n)
    function values(Bytes32LinkedList storage self) internal view returns (bytes32[] memory) {
        uint256 size_ = self._size;
        bytes32[] memory res = new bytes32[](size_);

        bytes32 prev = SENTINEL;
        for (uint256 i = size_; i > 0; --i) {
            prev = self._list[prev];
            res[i - 1] = prev;
        }

        return res;
    }

    /// @dev Returns the number of elements in the linked list.
    function size(Bytes32LinkedList storage self) internal view returns (uint256) {
        return self._size;
    }
}
