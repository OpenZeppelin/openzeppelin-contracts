// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/structs/FIFO.sol";

contract Bytes32FIFOMock {
    using FIFO for FIFO.Bytes32FIFO;

    event OperationResult(bytes32 value);

    FIFO.Bytes32FIFO private _fifo;

    function push(bytes32 value) public {
        _fifo.push(value);
    }

    function pop() public returns (bytes32) {
        bytes32 value = _fifo.pop();
        emit OperationResult(value);
        return value;
    }

    function top() public view returns (bytes32) {
        return _fifo.top();
    }

    function empty() public view returns (bool) {
        return _fifo.empty();
    }

    function clear() public {
        _fifo.clear();
    }
}
