// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/structs/EnumerableMap.sol";

contract EnumerableMapMock {
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    event OperationResult(bool result);

    EnumerableMap.UintToAddressMap private _map;

    function contains(uint256 key) public view returns (bool) {
        return _map.contains(key);
    }

    function set(uint256 key, address value) public {
        bool result = _map.set(key, value);
        emit OperationResult(result);
    }

    function remove(uint256 key) public {
        bool result = _map.remove(key);
        emit OperationResult(result);
    }

    function length() public view returns (uint256) {
        return _map.length();
    }

    function at(uint256 index) public view returns (uint256 key, address value) {
        return _map.at(index);
    }

    function tryGet(uint256 key) public view returns (bool, address) {
        return _map.tryGet(key);
    }

    function get(uint256 key) public view returns (address) {
        return _map.get(key);
    }

    function getWithMessage(uint256 key, string calldata errorMessage) public view returns (address) {
        return _map.get(key, errorMessage);
    }
}
