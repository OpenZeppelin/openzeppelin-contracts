// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/structs/EnumerableMap.sol";

// UintToAddressMap
contract UintToAddressMapMock {
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

// AddressToUintMap
contract AddressToUintMapMock {
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    event OperationResult(bool result);

    EnumerableMap.AddressToUintMap private _map;

    function contains(address key) public view returns (bool) {
        return _map.contains(key);
    }

    function set(address key, uint256 value) public {
        bool result = _map.set(key, value);
        emit OperationResult(result);
    }

    function remove(address key) public {
        bool result = _map.remove(key);
        emit OperationResult(result);
    }

    function length() public view returns (uint256) {
        return _map.length();
    }

    function at(uint256 index) public view returns (address key, uint256 value) {
        return _map.at(index);
    }

    function tryGet(address key) public view returns (bool, uint256) {
        return _map.tryGet(key);
    }

    function get(address key) public view returns (uint256) {
        return _map.get(key);
    }

    function getWithMessage(address key, string calldata errorMessage) public view returns (uint256) {
        return _map.get(key, errorMessage);
    }
}

contract Bytes32ToBytes32MapMock {
    using EnumerableMap for EnumerableMap.Bytes32ToBytes32Map;

    event OperationResult(bool result);

    EnumerableMap.Bytes32ToBytes32Map private _map;

    function contains(bytes32 key) public view returns (bool) {
        return _map.contains(key);
    }

    function set(bytes32 key, bytes32 value) public {
        bool result = _map.set(key, value);
        emit OperationResult(result);
    }

    function remove(bytes32 key) public {
        bool result = _map.remove(key);
        emit OperationResult(result);
    }

    function length() public view returns (uint256) {
        return _map.length();
    }

    function at(uint256 index) public view returns (bytes32 key, bytes32 value) {
        return _map.at(index);
    }

    function tryGet(bytes32 key) public view returns (bool, bytes32) {
        return _map.tryGet(key);
    }

    function get(bytes32 key) public view returns (bytes32) {
        return _map.get(key);
    }

    function getWithMessage(bytes32 key, string calldata errorMessage) public view returns (bytes32) {
        return _map.get(key, errorMessage);
    }
}
