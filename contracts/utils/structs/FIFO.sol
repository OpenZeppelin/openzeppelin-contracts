// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Vector.sol";

library FIFO {
    using Vector for Vector.Bytes32Vector;

    struct Bytes32FIFO {
        Vector.Bytes32Vector _data;
    }

    function push(Bytes32FIFO storage fifo, bytes32 value) internal {
        fifo._data.pushBack(value);
    }

    function pop(Bytes32FIFO storage fifo) internal returns (bytes32) {
        return fifo._data.popFront();
    }

    function top(Bytes32FIFO storage fifo) internal view returns (bytes32) {
        return fifo._data.front();
    }

    function clear(Bytes32FIFO storage fifo) internal {
        fifo._data.clear();
    }

    function empty(Bytes32FIFO storage fifo) internal view returns (bool) {
        return fifo._data.empty();
    }
}
