// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {EnumerableSet} from "../patched/utils/structs/EnumerableSet.sol";

contract EnumerableSetHarness {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    EnumerableSet.Bytes32Set private _set;

    function add(bytes32 value) public returns (bool) {
        return _set.add(value);
    }

    function remove(bytes32 value) public returns (bool) {
        return _set.remove(value);
    }

    function contains(bytes32 value) public view returns (bool) {
        return _set.contains(value);
    }

    function length() public view returns (uint256) {
        return _set.length();
    }

    function at_(uint256 index) public view returns (bytes32) {
        return _set.at(index);
    }

    function _indexOf(bytes32 value) public view returns (uint256) {
        return _set._inner._indexes[value];
    }
}
