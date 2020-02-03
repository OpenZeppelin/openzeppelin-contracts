pragma solidity ^0.5.0;

/**
 * @notice Key sets with enumeration and delete. Uses mappings for random
 * and existence checks and dynamic arrays for enumeration. Key uniqueness is enforced. 
 * @dev Sets are unordered. Delete operations reorder keys. All operations have a 
 * fixed gas cost at any scale, O(1). 
 */

import "./Bytes32Set.sol";
import "./AddressSet.sol";
import "./UintSet.sol";
import "./StringSet.sol";

contract ExampleBytes32Set {
    
    using Bytes32Set for Bytes32Set.Set;
    Bytes32Set.Set set;
    
    event LogUpdate(address sender, string action, bytes32 key);
    
    function exists(bytes32 key) public view returns(bool) {
        return set.exists(key);
    }
    
    function insert(bytes32 key) public {
        set.insert(key);
        emit LogUpdate(msg.sender, "insert", key);
    }
    
    function remove(bytes32 key) public {
        set.remove(key);
        emit LogUpdate(msg.sender, "remove", key);
    }
    
    function count() public view returns(uint) {
        return set.count();
    }
    
    function keyAtIndex(uint index) public view returns(bytes32) {
        return set.keyAtIndex(index);
    }
    
    function nukeSet() public {
        set.nukeSet();
    }
}

contract ExampleAddressSet {
    
    using AddressSet for AddressSet.Set;
    AddressSet.Set set;
    
    event LogUpdate(address sender, string action, address key);
    
    function exists(address key) public view returns(bool) {
        return set.exists(key);
    }
    
    function insert(address key) public {
        set.insert(key);
        emit LogUpdate(msg.sender, "insert", key);
    }
    
    function remove(address key) public {
        set.remove(key);
        emit LogUpdate(msg.sender, "remove", key);
    }
    
    function count() public view returns(uint) {
        return set.count();
    }
    
    function keyAtIndex(uint index) public view returns(address) {
        return set.keyAtIndex(index);
    }
    
    function nukeSet() public {
        set.nukeSet();
    }
}

contract ExampleUintSet {
    
    using UintSet for UintSet.Set;
    UintSet.Set set;
    
    event LogUpdate(address sender, string action, uint key);
    
    function exists(uint key) public view returns(bool) {
        return set.exists(key);
    }
    
    function insert(uint key) public {
        set.insert(key);
        emit LogUpdate(msg.sender, "insert", key);
    }
    
    function remove(uint key) public {
        set.remove(key);
        emit LogUpdate(msg.sender, "remove", key);
    }
    
    function count() public view returns(uint) {
        return set.count();
    }
    
    function keyAtIndex(uint index) public view returns(uint) {
        return set.keyAtIndex(index);
    }
    
    function nukeSet() public {
        set.nukeSet();
    }
}

contract ExampleStringSet {
    
    using StringSet for StringSet.Set;
    StringSet.Set set;
    
    event LogUpdate(address sender, string action, string key);
    
    function exists(string memory key) public view returns(bool) {
        return set.exists(key);
    }
    
    function insert(string memory key) public {
        set.insert(key);
        emit LogUpdate(msg.sender, "insert", key);
    }
    
    function remove(string memory key) public {
        set.remove(key);
        emit LogUpdate(msg.sender, "remove", key);
    }
    
    function count() public view returns(uint) {
        return set.count();
    }
    
    function keyAtIndex(uint index) public view returns(string memory) {
        return set.keyAtIndex(index);
    }
    
    function nukeSet() public {
        set.nukeSet();
    }
}
