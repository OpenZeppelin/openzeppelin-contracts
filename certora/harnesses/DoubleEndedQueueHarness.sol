// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../patched/utils/structs/DoubleEndedQueue.sol";

contract DoubleEndedQueueHarness {
    using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

    DoubleEndedQueue.Bytes32Deque private _deque;

    function pushFront(bytes32 value) external {
        _deque.pushFront(value);
    }

    function pushBack(bytes32 value) external {
        _deque.pushBack(value);
    }

    function popFront() external returns (bytes32 value) {
        return _deque.popFront();
    }

    function popBack() external returns (bytes32 value) {
        return _deque.popBack();
    }

    function clear() external {
        _deque.clear();
    }

    function begin() external view returns (uint128) {
        return _deque._begin;
    }

    function end() external view returns (uint128) {
        return _deque._end;
    }

    function length() external view returns (uint256) {
        return _deque.length();
    }

    function empty() external view returns (bool) {
        return _deque.empty();
    }

    function front() external view returns (bytes32 value) {
        return _deque.front();
    }

    function back() external view returns (bytes32 value) {
        return _deque.back();
    }

    function at_(uint256 index) external view returns (bytes32 value) {
        return _deque.at(index);
    }
}
