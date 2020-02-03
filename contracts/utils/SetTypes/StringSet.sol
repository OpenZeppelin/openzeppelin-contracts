pragma solidity ^0.5.0;

/**
 * @notice Key sets with enumeration and delete. Uses mappings for random
 * and existence checks and dynamic arrays for enumeration. Key uniqueness is enforced. 
 * @dev Sets are unordered. Delete operations reorder keys. All operations have a 
 * fixed gas cost at any scale, O(1). 
 */

library StringSet {
    
    struct Set {
        mapping(bytes32 => uint) keyPointers;
        mapping(bytes32 => string) strings;
        string[] keyList;
    }

    /**
     * @notice insert a key. 
     * @dev duplicate keys are not permitted.
     * @param self storage pointer to a Set. 
     * @param key value to insert.
     */ 
    function insert(Set storage self, string memory key) internal {
        require(!exists(self, key), "StringSet: key already exists in the set.");
        self.keyPointers[_toBytes32(key)] = self.keyList.push(key)-1;
    }

    /**
     * @notice remove a key.
     * @dev key to remove must exist. 
     * @param self storage pointer to a Set.
     * @param key value to remove.
     */  
    function remove(Set storage self, string memory key) internal {
        require(exists(self, key), "StringSet: key does not exist in the set.");
        uint last = count(self) - 1;
        string memory keyToMove = self.keyList[last];
        uint rowToReplace = self.keyPointers[_toBytes32(key)];
        if(rowToReplace != last) {
            self.keyPointers[_toBytes32(keyToMove)] = rowToReplace;
            self.keyList[rowToReplace] = keyToMove;
        }
        delete self.keyPointers[_toBytes32(key)];
        self.keyList.length--;
    }
    
    function count(Set storage self) internal view returns(uint) {
        return(self.keyList.length);
    }

    /**
     * @notice check if a key is in the Set.
     * @param self storage pointer to a Set.
     * @param key value to check. 
     * @return bool true: Set member, false: not a Set member.
     */ 
    function exists(Set storage self, string memory key) internal view returns (bool) {
        if(self.keyList.length == 0) return false;
        return _toBytes32(self.keyList[self.keyPointers[_toBytes32(key)]]) == _toBytes32(key);
    }

    /**
     * @notice fetch a key by row (enumerate).
     * @param self storage pointer to a Set.
     * @param index row to enumerate. Must be < count() - 1.
     */      
    function keyAtIndex(Set storage self, uint index) internal view returns (string memory) {
        return self.keyList[index];
    }

    
    /**
     * @notice destroy the Set. The Set will have zero members.
     * @dev does not prune mapped data. Enumerate keys and delete individually
     * to fully remove.
     * @param self storage pointer to a Set. 
     */     
    function nukeSet(Set storage self) public {
        delete self.keyList;
    }
    
    function _toBytes32(string memory s) private pure returns (bytes32) {
        return(keccak256(bytes(s)));
    }
}
