// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/structs/LIFO.sol";

contract Bytes32LIFOMock {
    using LIFO for LIFO.Bytes32LIFO;

    event OperationResult(bytes32 value);

    LIFO.Bytes32LIFO private _lifo;

    function push(bytes32 value) public {
        _lifo.push(value);
    }

    function pop() public returns (bytes32) {
        bytes32 value = _lifo.pop();
        emit OperationResult(value);
        return value;
    }

    function top() public view returns (bytes32) {
        return _lifo.top();
    }

    function empty() public view returns (bool) {
        return _lifo.empty();
    }

    function clear() public {
        _lifo.clear();
    }
}
