pragma solidity ^0.8.20;

import {DoubleEndedQueue} from "../../../openzeppelin-contracts/contracts/utils/structs/DoubleEndedQueue.sol";

contract MyDoubleEndedQueue {
    DoubleEndedQueue.Bytes32Deque deque;

    function pushBack(bytes32 value) public {
        DoubleEndedQueue.pushBack(deque, value);
    }

    function back() public returns(bytes32) {
        return DoubleEndedQueue.back(deque);
    }

    function popBack() public returns(bytes32) {
        return DoubleEndedQueue.popBack(deque);
    }

    function pushFront(bytes32 value) public {
        DoubleEndedQueue.pushFront(deque, value);
    }

    function front() public returns(bytes32) {
        return DoubleEndedQueue.front(deque);
    }

    function at(uint256 index) public returns(bytes32) {
        return DoubleEndedQueue.at(deque, index);
    }

    function popFront() public returns(bytes32) {
        return DoubleEndedQueue.popFront(deque);
    }

    function length() public returns(uint256) {
        return DoubleEndedQueue.length(deque);
    }

    function clear() public {
        return DoubleEndedQueue.clear(deque);
    }

    function empty() public returns(bool){
        return DoubleEndedQueue.empty(deque);
    }
    
}