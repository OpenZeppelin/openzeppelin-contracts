pragma solidity ^0.6.0;

/**
 * @dev Library for managing
 * https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
 * types.
 *
 * Sets have the following properties:
 *
 * - Elements are added, removed, and checked for existence in constant time
 * (O(1)).
 * - Elements are enumerated in O(n). No guarantees are made on the ordering.
 *
 * As of v2.5.0, only `address` sets are supported.
 *
 * Include with `using EnumerableSet for EnumerableSet.AddressSet;`.
 *
 * @author Alberto Cuesta Cañada
 */
library EnumerableSet {

    struct AddressSet {
        address[] keys;
        // Position of the key in the `keys` array, plus 1 because index 0
        // means a key is not in the set.
        mapping (address => uint256) indexes;
    }

    /**
     * @dev Add a key to a set. O(1).
     *
     * Returns false if the key was already in the set.
     */
    function add(AddressSet storage set, address key)
        internal
        returns (bool)
    {
        if (!contains(set, key)) {
            set.keys.push(key);
            // The key is stored at length-1, but we add 1 to all indexes
            // and use 0 as a sentinel value
            set.indexes[key] = set.keys.length;
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes a key from a set. O(1).
     *
     * Returns false if the key was not present in the set.
     */
    function remove(AddressSet storage set, address key)
        internal
        returns (bool)
    {
        if (contains(set, key)){
            uint256 toDeleteIndex = set.indexes[key] - 1;
            uint256 lastIndex = set.keys.length - 1;

            // If the key we're deleting is the last one, we can just remove it without doing a swap
            if (lastIndex != toDeleteIndex) {
                address lastKey = set.keys[lastIndex];

                // Move the last key to the index where the deleted key is
                set.keys[toDeleteIndex] = lastKey;
                // Update the index for the moved key
                set.indexes[lastKey] = toDeleteIndex + 1; // All indexes are 1-based
            }

            // Delete the slot where the moved key was stored
            set.keys.pop();

            // Delete the index for the deleted slot
            delete set.indexes[key];

            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns true if the key is in the set. O(1).
     */
    function contains(AddressSet storage set, address key)
        internal
        view
        returns (bool)
    {
        return set.indexes[key] != 0;
    }

    /**
     * @dev Returns an array with all keys in the set. O(N).
     *
     * Note that there are no guarantees on the ordering of keys inside the
     * array, and it may change when more keys are added or removed.

     * WARNING: This function may run out of gas on large sets: use {length} and
     * {get} instead in these cases.
     */
    function enumerate(AddressSet storage set)
        internal
        view
        returns (address[] memory)
    {
        address[] memory output = new address[](set.keys.length);
        for (uint256 i; i < set.keys.length; i++){
            output[i] = set.keys[i];
        }
        return output;
    }

    /**
     * @dev Returns the number of keys on the set. O(1).
     */
    function length(AddressSet storage set)
        internal
        view
        returns (uint256)
    {
        return set.keys.length;
    }

   /**
    * @dev Returns the key stored at position `index` in the set. O(1).
    *
    * Note that there are no guarantees on the ordering of keys inside the
    * array, and it may change when more keys are added or removed.
    *
    * Requirements:
    *
    * - `index` must be strictly less than {length}.
    */
    function get(AddressSet storage set, uint256 index)
        internal
        view
        returns (address)
    {
        require(set.keys.length > index, "EnumerableSet: index out of bounds");
        return set.keys[index];
    }
}
