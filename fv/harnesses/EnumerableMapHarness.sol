// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {EnumerableMap} from "../patched/utils/structs/EnumerableMap.sol";

contract EnumerableMapHarness {
    using EnumerableMap for EnumerableMap.Bytes32ToBytes32Map;

    EnumerableMap.Bytes32ToBytes32Map private _map;

    function set(bytes32 key, bytes32 value) public returns (bool) {
        return _map.set(key, value);
    }

    function remove(bytes32 key) public returns (bool) {
        return _map.remove(key);
    }

    function contains(bytes32 key) public view returns (bool) {
        return _map.contains(key);
    }

    function length() public view returns (uint256) {
        return _map.length();
    }

    function key_at(uint256 index) public view returns (bytes32) {
        (bytes32 key,) = _map.at(index);
        return key;
    }

    function value_at(uint256 index) public view returns (bytes32) {
        (,bytes32 value) = _map.at(index);
        return value;
    }

    function tryGet_contains(bytes32 key) public view returns (bool) {
        (bool contained,) = _map.tryGet(key);
        return contained;
    }

    function tryGet_value(bytes32 key) public view returns (bytes32) {
        (,bytes32 value) = _map.tryGet(key);
        return value;
    }

    function get(bytes32 key) public view returns (bytes32) {
        return _map.get(key);
    }

    function _positionOf(bytes32 key) public view returns (uint256) {
        return _map._keys._inner._positions[key];
    }
}
