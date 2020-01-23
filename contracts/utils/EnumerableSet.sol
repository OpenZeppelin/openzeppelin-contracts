pragma solidity ^0.5.0;


/**
 * @title EnumerableSet
 * @dev Data structure - https://en.wikipedia.org/wiki/Set_(abstract_data_type)
 *
 * An EnumerableSet.AddressSet is a data structure containing a number of unique addresses.
 *
 *  - It is possible to add and remove addresses in O(1).
 *  - It is also possible to query if the AddressSet contains an address in O(1).
 *  - It is possible to retrieve an array with all the addresses in the AddressSet using enumerate.
 *    This operation is O(N) where N is the number of addresses in the AddressSet. The order in
 *    which the addresses are retrieved is not guaranteed.
 *
 * Initialization of a set must include an empty array:
 * `EnumerableSet.AddressSet set = EnumerableSet.AddressSet({values: new address[](0)});`
 *
 * @author Alberto Cuesta Cañada
 */
library EnumerableSet {

    struct AddressSet {
        // Position of the value in the `values` array, plus 1 because index 0
        // means a value is not in the set.
        mapping (address => uint256) index;
        address[] values;
    }

    /**
     * @dev Add a value. O(1).
     */
    function add(AddressSet storage set, address value)
        internal
    {
        if (!contains(set, value)){
            set.index[value] = set.values.push(value);
        }
    }

    /**
     * @dev Remove a value. O(1).
     */
    function remove(AddressSet storage set, address value)
        internal
    {
        if (contains(set, value)) {
            set.values[set.index[value] - 1] = set.values[set.values.length - 1];
            set.values.pop();
            delete set.index[value];
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
        return set.index[value] != 0;
    }

    /**
     * @dev Return an array with all values in the set. O(N).
     */
    function enumerate(AddressSet storage set)
        internal
        view
        returns (address[] memory)
    {
        address[] memory output = new address[](set.values.length);
        for (uint256 i; i < set.values.length; i++){
            output[i] = set.values[i];
        }
        return output;
    }
}
