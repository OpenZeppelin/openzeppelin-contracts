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
        address[] _values;
        // Position of the value in the `values` array, plus 1 because index 0
        // means a value is not in the set.
        mapping (address => uint256) _indexes;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns false if the value was already in the set.
     */
    function add(AddressSet storage set, address value)
        internal
        returns (bool)
    {
        if (!contains(set, value)) {
            set._values.push(value);
            // The value is stored at length-1, but we add 1 to all indexes
            // and use 0 as a sentinel value
            set._indexes[value] = set._values.length;
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns false if the value was not present in the set.
     */
    function remove(AddressSet storage set, address value)
        internal
        returns (bool)
    {
        if (contains(set, value)){
            uint256 toDeleteIndex = set._indexes[value] - 1;
            uint256 lastIndex = set._values.length - 1;

            // If the value we're deleting is the last one, we can just remove it without doing a swap
            if (lastIndex != toDeleteIndex) {
                address lastvalue = set._values[lastIndex];

                // Move the last value to the index where the deleted value is
                set._values[toDeleteIndex] = lastvalue;
                // Update the index for the moved value
                set._indexes[lastvalue] = toDeleteIndex + 1; // All indexes are 1-based
            }

            // Delete the slot where the moved value was stored
            set._values.pop();

            // Delete the index for the deleted slot
            delete set._indexes[value];

            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(AddressSet storage set, address value)
        internal
        view
        returns (bool)
    {
        return set._indexes[value] != 0;
    }

    /**
     * @dev Returns an array with all values in the set. O(N).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.

     * WARNING: This function may run out of gas on large sets: use {length} and
     * {at} instead in these cases.
     */
    function enumerate(AddressSet storage set)
        internal
        view
        returns (address[] memory)
    {
        address[] memory output = new address[](set._values.length);
        for (uint256 i; i < set._values.length; i++){
            output[i] = set._values[i];
        }
        return output;
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function length(AddressSet storage set)
        internal
        view
        returns (uint256)
    {
        return set._values.length;
    }

   /**
    * @dev Returns the value stored at position `index` in the set. O(1).
    *
    * Note that there are no guarantees on the ordering of values inside the
    * array, and it may change when more values are added or removed.
    *
    * Requirements:
    *
    * - `index` must be strictly less than {length}.
    */
    function at(AddressSet storage set, uint256 index)
        internal
        view
        returns (address)
    {
        require(set._values.length > index, "EnumerableSet: index out of bounds");
        return set._values[index];
    }
}
