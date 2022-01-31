// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Vector.sol";

library LIFO {
    using Vector for Vector.Bytes32Vector;

    struct Bytes32LIFO {
        Vector.Bytes32Vector _data;
    }

    function push(Bytes32LIFO storage lifo, bytes32 value) internal {
        lifo._data.pushBack(value);
    }

    function pop(Bytes32LIFO storage lifo) internal returns (bytes32) {
        return lifo._data.popBack();
    }

    function top(Bytes32LIFO storage lifo) internal view returns (bytes32) {
        return lifo._data.back();
    }

    function clear(Bytes32LIFO storage lifo) internal {
        lifo._data.clear();
    }

    function empty(Bytes32LIFO storage lifo) internal view returns (bool) {
        return lifo._data.empty();
    }
}
