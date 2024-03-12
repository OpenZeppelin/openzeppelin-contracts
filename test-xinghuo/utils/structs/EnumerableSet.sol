pragma solidity ^0.8.20;

import {EnumerableSet} from "../../../openzeppelin-contracts/contracts/utils/structs/EnumerableSet.sol";

contract MyEnumerableSet {
    EnumerableSet.Bytes32Set set;

    function add(bytes32 value) public returns(bool) {
        return EnumerableSet.add(set, value);
    }

    function remove(bytes32 value) public returns(bool) {
        return EnumerableSet.remove(set, value);
    }

    function contains(bytes32 value) public returns(bool) {
        return EnumerableSet.contains(set, value);
    }

    function length() public returns(uint256) {
        return EnumerableSet.length(set);
    }

    function at(uint256 index) public returns(bytes32) {
        return EnumerableSet.at(set, index);
    }

    function values() public returns(bytes32[] memory) {
        return EnumerableSet.values(set);
    }
    
}