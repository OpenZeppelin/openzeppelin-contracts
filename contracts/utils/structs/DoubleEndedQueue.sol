// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../math/SafeCast.sol";

library DoubleEndedQueue {
    error Empty();
    error OutOfBounds();

    struct Bytes32Deque {
        int128 begin; // inclusive: the first item is at data[begin]
        int128 end; // exclusive: the last item is at data[end-1]
        mapping(int128 => bytes32) data;
    }

    function pushBack(Bytes32Deque storage deque, bytes32 value) internal {
        int128 backIndex = deque.end;
        deque.data[backIndex] = value;
        unchecked {
            deque.end = backIndex + 1;
        }
    }

    function popBack(Bytes32Deque storage deque) internal returns (bytes32 value) {
        if (empty(deque)) revert Empty();
        int128 backIndex;
        unchecked {
            backIndex = deque.end - 1;
        }
        value = deque.data[backIndex];
        delete deque.data[backIndex];
        deque.end = backIndex;
    }

    function pushFront(Bytes32Deque storage deque, bytes32 value) internal {
        int128 frontIndex;
        unchecked {
            frontIndex = deque.begin - 1;
        }
        deque.data[frontIndex] = value;
        deque.begin = frontIndex;
    }

    function popFront(Bytes32Deque storage deque) internal returns (bytes32 value) {
        if (empty(deque)) revert Empty();
        int128 frontIndex = deque.begin;
        value = deque.data[frontIndex];
        delete deque.data[frontIndex];
        unchecked {
            deque.begin = frontIndex + 1;
        }
    }

    function front(Bytes32Deque storage deque) internal view returns (bytes32 value) {
        if (empty(deque)) revert Empty();
        int128 frontIndex = deque.begin;
        return deque.data[frontIndex];
    }

    function back(Bytes32Deque storage deque) internal view returns (bytes32 value) {
        if (empty(deque)) revert Empty();
        int128 backIndex;
        unchecked {
            backIndex = deque.end - 1;
        }
        return deque.data[backIndex];
    }

    function at(Bytes32Deque storage deque, uint256 i) internal view returns (bytes32 value) {
        // int256(deque.begin) is a safe upcast
        int128 idx = SafeCast.toInt128(int256(deque.begin) + SafeCast.toInt256(i));
        if (idx >= deque.end) revert OutOfBounds();
        return deque.data[idx];
    }

    function clear(Bytes32Deque storage deque) internal {
        deque.begin = 0;
        deque.end = 0;
    }

    function length(Bytes32Deque storage deque) internal view returns (uint256) {
        unchecked {
            return SafeCast.toUint256(int256(deque.end) - int256(deque.begin));
        }
    }

    function empty(Bytes32Deque storage deque) internal view returns (bool) {
        return deque.end <= deque.begin;
    }
}
