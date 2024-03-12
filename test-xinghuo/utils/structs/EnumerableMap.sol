pragma solidity ^0.8.20;

import {EnumerableMap} from "../../../openzeppelin-contracts/contracts/utils/structs/EnumerableMap.sol";

contract MyEnumerableMap {
    EnumerableMap.UintToAddressMap map;

    function set(uint256 key, address value) public returns(bool) {
        return EnumerableMap.set(map, key, value);
    }

    function remove(uint256 key) public returns(bool) {
        return EnumerableMap.remove(map, key);
    }

    function contains(uint256 key) public returns(bool) {
        return EnumerableMap.contains(map, key);
    }

    function length() public returns(uint256) {
        return EnumerableMap.length(map);
    }

    function at(uint256 index) public returns(uint256, address) {
        return EnumerableMap.at(map, index);
    }

    function tryGet(uint256 key) public returns(bool, address) {
        return EnumerableMap.tryGet(map, key);
    }

    function get(uint256 key) public returns(address) {
        return EnumerableMap.get(map, key);
    }

    function keys() public returns(uint256[] memory) {
        return EnumerableMap.keys(map);
    }
    
}