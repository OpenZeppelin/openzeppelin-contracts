// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library LinkedList {
    struct Bytes32LinkedList {
        mapping(bytes32 => bytes32) _list;
        bytes32 _tail;
        uint256 _size;
    }

    bytes32 private constant SENTINEL = keccak256(abi.encode("SENTINEL"));

    // O(1)
    function head(Bytes32LinkedList storage self) internal view returns (bytes32) {
        bytes32 val = self._list[SENTINEL];
        return val;
    }

    // O(1)
    function insert(Bytes32LinkedList storage self, bytes32 prev, bytes32 value) internal returns (bool) {
        if (prev == 0) {
            prev = SENTINEL;
        }

        if (value == 0 || value == SENTINEL) {
            return false;
        }

        if (self._list[value] != 0) {
            return false;
        }

        bytes32 next = self._list[prev];
        self._list[value] = next;
        self._list[prev] = value;

        if (next == 0) {
            self._tail = value;
        }
        self._size++;

        return true;
    }

    // Inefficient version of insert to insert at an index, O(n)
    function insert(Bytes32LinkedList storage self, uint256 index, bytes32 value) internal returns (bool) {
        if (index > self._size) {
            return false;
        }

        uint256 currentIndex = 0;
        bytes32 prev = SENTINEL;

        while (currentIndex != index) {
            prev = self._list[prev];
            currentIndex++;
        }

        return insert(self, prev, value);
    }

    // O(1)
    function push(Bytes32LinkedList storage self, bytes32 value) internal {
        insert(self, self._tail, value);
    }

    // O(1). requires previous value of one to remove
    function removeEfficient(Bytes32LinkedList storage self, bytes32 prev) internal returns (bool) {
        if (prev == 0) {
            prev = SENTINEL;
        }

        bytes32 next = self._list[prev];
        self._list[prev] = next;
        if (next == 0) {
            self._tail = prev;
        }
        delete self._list[next];
        self._size--;

        return true;
    }

    // Inefficient version of remove if prev is not know. O(n)
    function remove(Bytes32LinkedList storage self, bytes32 value) internal returns (bool) {
        bytes32 prev = SENTINEL;

        while (self._list[prev] != value) {
            prev = self._list[prev];
            if (prev == 0) {
                return false;
            }
        }

        return removeEfficient(self, prev);
    }

    // O(n)
    function removeAt(Bytes32LinkedList storage self, uint256 index) internal returns (bool) {
        if (index >= self._size) {
            return false;
        }

        bytes32 prev = SENTINEL;
        uint256 currentIndex = 0;

        while (currentIndex != index) {
            prev = self._list[prev];
            currentIndex++;
        }

        return remove(self, prev);
    }

    // O(1)
    function contains(Bytes32LinkedList storage self, bytes32 value) internal view returns (bool) {
        return self._list[value] != 0;
    }

    // O(n)
    function clear(Bytes32LinkedList storage self) internal {
        bytes32 next = SENTINEL;
        delete self._tail;
        delete self._size;

        while (next != 0) {
            next = self._list[next];
            delete self._list[next];
        }
    }

    // O(n)
    function values(Bytes32LinkedList storage self) internal view returns (bytes32[] memory) {
        bytes32[] memory res = new bytes32[](self._size);

        bytes32 next = SENTINEL;
        for (uint256 i = 0; i < self._size; i++) {
            next = self._list[next];
            res[i] = next;
        }

        return res;
    }
}
