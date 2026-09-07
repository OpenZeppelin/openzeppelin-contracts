// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (utils/structs/EnumerableMap.sol)
// This file was procedurally generated from scripts/generate/templates/EnumerableMap.sol.eta.

pragma solidity ^0.8.24;

import {EnumerableSet} from "./EnumerableSet.sol";

/**
 * @dev Library for managing an enumerable variant of Solidity's
 * https://solidity.readthedocs.io/en/latest/types.html#mapping-types[`mapping`]
 * type.
 *
 * Maps have the following properties:
 *
 * - Entries are added, removed, and checked for existence in constant time
 * (O(1)).
 * - Entries are enumerated in O(n). No guarantees are made on the ordering.
 * - Map can be cleared (all entries removed) in O(n).
 *
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using EnumerableMap for EnumerableMap.UintToAddressMap;
 *
 *     // Declare a set state variable
 *     EnumerableMap.UintToAddressMap private myMap;
 * }
 * ```
 *
 * The following map types are supported:
 *
 * - `uint256 -> address` (`UintToAddressMap`) since v3.0.0
 * - `address -> uint256` (`AddressToUintMap`) since v4.6.0
 * - `bytes32 -> bytes32` (`Bytes32ToBytes32Map`) since v4.6.0
 * - `uint256 -> uint256` (`UintToUintMap`) since v4.7.0
 * - `bytes32 -> uint256` (`Bytes32ToUintMap`) since v4.7.0
 * - `uint256 -> bytes32` (`UintToBytes32Map`) since v5.1.0
 * - `address -> address` (`AddressToAddressMap`) since v5.1.0
 * - `address -> bytes32` (`AddressToBytes32Map`) since v5.1.0
 * - `bytes32 -> address` (`Bytes32ToAddressMap`) since v5.1.0
 * - `bytes -> bytes` (`BytesToBytesMap`) since v5.4.0
 * - `bytes4 -> address` (`Bytes4ToAddressMap`) since v5.6.0
 *
 * [WARNING]
 * ====
 * Trying to delete such a structure from storage will likely result in data corruption, rendering the structure
 * unusable.
 * See https://github.com/ethereum/solidity/pull/11843[ethereum/solidity#11843] for more info.
 *
 * In order to clean an EnumerableMap, you can either remove all elements one by one or create a fresh instance using an
 * array of EnumerableMap.
 * ====
 */
library EnumerableMap {
    using EnumerableSet for *;

    error EnumerableMapNonexistentUint256Key(uint256 key);

    error EnumerableMapNonexistentAddressKey(address key);

    error EnumerableMapNonexistentBytes32Key(bytes32 key);

    error EnumerableMapNonexistentBytes4Key(bytes4 key);

    error EnumerableMapNonexistentBytesKey(bytes key);

    // UintToUintMap

    struct UintToUintMap {
        EnumerableSet.UintSet _keys;
        mapping(uint256 key => uint256) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(UintToUintMap storage map, uint256 key, uint256 value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(UintToUintMap storage map, uint256 key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(UintToUintMap storage map, uint256 index) internal returns (uint256 key, uint256 value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(UintToUintMap storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(UintToUintMap storage map, uint256 key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(UintToUintMap storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(UintToUintMap storage map, uint256 index) internal view returns (uint256 key, uint256 value) {
        uint256 atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(UintToUintMap storage map, uint256 key) internal view returns (bool exists, uint256 value) {
        uint256 _value = map._values[key];
        return (_value != uint256(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(UintToUintMap storage map, uint256 key) internal view returns (uint256) {
        uint256 _value = map._values[key];
        if (_value == uint256(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentUint256Key(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(UintToUintMap storage map) internal view returns (uint256[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(UintToUintMap storage map, uint256 start, uint256 end) internal view returns (uint256[] memory) {
        return map._keys.values(start, end);
    }

    // UintToAddressMap

    struct UintToAddressMap {
        EnumerableSet.UintSet _keys;
        mapping(uint256 key => address) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(UintToAddressMap storage map, uint256 key, address value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(UintToAddressMap storage map, uint256 key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(UintToAddressMap storage map, uint256 index) internal returns (uint256 key, address value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(UintToAddressMap storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(UintToAddressMap storage map, uint256 key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(UintToAddressMap storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(UintToAddressMap storage map, uint256 index) internal view returns (uint256 key, address value) {
        uint256 atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(UintToAddressMap storage map, uint256 key) internal view returns (bool exists, address value) {
        address _value = map._values[key];
        return (_value != address(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(UintToAddressMap storage map, uint256 key) internal view returns (address) {
        address _value = map._values[key];
        if (_value == address(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentUint256Key(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(UintToAddressMap storage map) internal view returns (uint256[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(UintToAddressMap storage map, uint256 start, uint256 end) internal view returns (uint256[] memory) {
        return map._keys.values(start, end);
    }

    // UintToBytes32Map

    struct UintToBytes32Map {
        EnumerableSet.UintSet _keys;
        mapping(uint256 key => bytes32) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(UintToBytes32Map storage map, uint256 key, bytes32 value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(UintToBytes32Map storage map, uint256 key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(UintToBytes32Map storage map, uint256 index) internal returns (uint256 key, bytes32 value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(UintToBytes32Map storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(UintToBytes32Map storage map, uint256 key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(UintToBytes32Map storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(UintToBytes32Map storage map, uint256 index) internal view returns (uint256 key, bytes32 value) {
        uint256 atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(UintToBytes32Map storage map, uint256 key) internal view returns (bool exists, bytes32 value) {
        bytes32 _value = map._values[key];
        return (_value != bytes32(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(UintToBytes32Map storage map, uint256 key) internal view returns (bytes32) {
        bytes32 _value = map._values[key];
        if (_value == bytes32(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentUint256Key(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(UintToBytes32Map storage map) internal view returns (uint256[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(UintToBytes32Map storage map, uint256 start, uint256 end) internal view returns (uint256[] memory) {
        return map._keys.values(start, end);
    }

    // AddressToUintMap

    struct AddressToUintMap {
        EnumerableSet.AddressSet _keys;
        mapping(address key => uint256) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(AddressToUintMap storage map, address key, uint256 value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(AddressToUintMap storage map, address key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(AddressToUintMap storage map, uint256 index) internal returns (address key, uint256 value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(AddressToUintMap storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(AddressToUintMap storage map, address key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(AddressToUintMap storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(AddressToUintMap storage map, uint256 index) internal view returns (address key, uint256 value) {
        address atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(AddressToUintMap storage map, address key) internal view returns (bool exists, uint256 value) {
        uint256 _value = map._values[key];
        return (_value != uint256(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(AddressToUintMap storage map, address key) internal view returns (uint256) {
        uint256 _value = map._values[key];
        if (_value == uint256(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentAddressKey(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(AddressToUintMap storage map) internal view returns (address[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(AddressToUintMap storage map, uint256 start, uint256 end) internal view returns (address[] memory) {
        return map._keys.values(start, end);
    }

    // AddressToAddressMap

    struct AddressToAddressMap {
        EnumerableSet.AddressSet _keys;
        mapping(address key => address) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(AddressToAddressMap storage map, address key, address value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(AddressToAddressMap storage map, address key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(AddressToAddressMap storage map, uint256 index) internal returns (address key, address value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(AddressToAddressMap storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(AddressToAddressMap storage map, address key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(AddressToAddressMap storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(AddressToAddressMap storage map, uint256 index) internal view returns (address key, address value) {
        address atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(AddressToAddressMap storage map, address key) internal view returns (bool exists, address value) {
        address _value = map._values[key];
        return (_value != address(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(AddressToAddressMap storage map, address key) internal view returns (address) {
        address _value = map._values[key];
        if (_value == address(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentAddressKey(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(AddressToAddressMap storage map) internal view returns (address[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(
        AddressToAddressMap storage map,
        uint256 start,
        uint256 end
    ) internal view returns (address[] memory) {
        return map._keys.values(start, end);
    }

    // AddressToBytes32Map

    struct AddressToBytes32Map {
        EnumerableSet.AddressSet _keys;
        mapping(address key => bytes32) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(AddressToBytes32Map storage map, address key, bytes32 value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(AddressToBytes32Map storage map, address key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(AddressToBytes32Map storage map, uint256 index) internal returns (address key, bytes32 value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(AddressToBytes32Map storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(AddressToBytes32Map storage map, address key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(AddressToBytes32Map storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(AddressToBytes32Map storage map, uint256 index) internal view returns (address key, bytes32 value) {
        address atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(AddressToBytes32Map storage map, address key) internal view returns (bool exists, bytes32 value) {
        bytes32 _value = map._values[key];
        return (_value != bytes32(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(AddressToBytes32Map storage map, address key) internal view returns (bytes32) {
        bytes32 _value = map._values[key];
        if (_value == bytes32(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentAddressKey(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(AddressToBytes32Map storage map) internal view returns (address[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(
        AddressToBytes32Map storage map,
        uint256 start,
        uint256 end
    ) internal view returns (address[] memory) {
        return map._keys.values(start, end);
    }

    // Bytes32ToUintMap

    struct Bytes32ToUintMap {
        EnumerableSet.Bytes32Set _keys;
        mapping(bytes32 key => uint256) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(Bytes32ToUintMap storage map, bytes32 key, uint256 value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(Bytes32ToUintMap storage map, bytes32 key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(Bytes32ToUintMap storage map, uint256 index) internal returns (bytes32 key, uint256 value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(Bytes32ToUintMap storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(Bytes32ToUintMap storage map, bytes32 key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(Bytes32ToUintMap storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(Bytes32ToUintMap storage map, uint256 index) internal view returns (bytes32 key, uint256 value) {
        bytes32 atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(Bytes32ToUintMap storage map, bytes32 key) internal view returns (bool exists, uint256 value) {
        uint256 _value = map._values[key];
        return (_value != uint256(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(Bytes32ToUintMap storage map, bytes32 key) internal view returns (uint256) {
        uint256 _value = map._values[key];
        if (_value == uint256(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentBytes32Key(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(Bytes32ToUintMap storage map) internal view returns (bytes32[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(Bytes32ToUintMap storage map, uint256 start, uint256 end) internal view returns (bytes32[] memory) {
        return map._keys.values(start, end);
    }

    // Bytes32ToAddressMap

    struct Bytes32ToAddressMap {
        EnumerableSet.Bytes32Set _keys;
        mapping(bytes32 key => address) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(Bytes32ToAddressMap storage map, bytes32 key, address value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(Bytes32ToAddressMap storage map, bytes32 key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(Bytes32ToAddressMap storage map, uint256 index) internal returns (bytes32 key, address value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(Bytes32ToAddressMap storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(Bytes32ToAddressMap storage map, bytes32 key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(Bytes32ToAddressMap storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(Bytes32ToAddressMap storage map, uint256 index) internal view returns (bytes32 key, address value) {
        bytes32 atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(Bytes32ToAddressMap storage map, bytes32 key) internal view returns (bool exists, address value) {
        address _value = map._values[key];
        return (_value != address(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(Bytes32ToAddressMap storage map, bytes32 key) internal view returns (address) {
        address _value = map._values[key];
        if (_value == address(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentBytes32Key(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(Bytes32ToAddressMap storage map) internal view returns (bytes32[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(
        Bytes32ToAddressMap storage map,
        uint256 start,
        uint256 end
    ) internal view returns (bytes32[] memory) {
        return map._keys.values(start, end);
    }

    // Bytes32ToBytes32Map

    struct Bytes32ToBytes32Map {
        EnumerableSet.Bytes32Set _keys;
        mapping(bytes32 key => bytes32) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(Bytes32ToBytes32Map storage map, bytes32 key, bytes32 value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(Bytes32ToBytes32Map storage map, bytes32 key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(Bytes32ToBytes32Map storage map, uint256 index) internal returns (bytes32 key, bytes32 value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(Bytes32ToBytes32Map storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(Bytes32ToBytes32Map storage map, bytes32 key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(Bytes32ToBytes32Map storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(Bytes32ToBytes32Map storage map, uint256 index) internal view returns (bytes32 key, bytes32 value) {
        bytes32 atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(Bytes32ToBytes32Map storage map, bytes32 key) internal view returns (bool exists, bytes32 value) {
        bytes32 _value = map._values[key];
        return (_value != bytes32(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(Bytes32ToBytes32Map storage map, bytes32 key) internal view returns (bytes32) {
        bytes32 _value = map._values[key];
        if (_value == bytes32(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentBytes32Key(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(Bytes32ToBytes32Map storage map) internal view returns (bytes32[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(
        Bytes32ToBytes32Map storage map,
        uint256 start,
        uint256 end
    ) internal view returns (bytes32[] memory) {
        return map._keys.values(start, end);
    }

    // Bytes4ToAddressMap

    struct Bytes4ToAddressMap {
        EnumerableSet.Bytes4Set _keys;
        mapping(bytes4 key => address) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(Bytes4ToAddressMap storage map, bytes4 key, address value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(Bytes4ToAddressMap storage map, bytes4 key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(Bytes4ToAddressMap storage map, uint256 index) internal returns (bytes4 key, address value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(Bytes4ToAddressMap storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(Bytes4ToAddressMap storage map, bytes4 key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(Bytes4ToAddressMap storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(Bytes4ToAddressMap storage map, uint256 index) internal view returns (bytes4 key, address value) {
        bytes4 atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(Bytes4ToAddressMap storage map, bytes4 key) internal view returns (bool exists, address value) {
        address _value = map._values[key];
        return (_value != address(0) || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(Bytes4ToAddressMap storage map, bytes4 key) internal view returns (address) {
        address _value = map._values[key];
        if (_value == address(0) && !contains(map, key)) {
            revert EnumerableMapNonexistentBytes4Key(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(Bytes4ToAddressMap storage map) internal view returns (bytes4[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(Bytes4ToAddressMap storage map, uint256 start, uint256 end) internal view returns (bytes4[] memory) {
        return map._keys.values(start, end);
    }

    // BytesToBytesMap

    struct BytesToBytesMap {
        EnumerableSet.BytesSet _keys;
        mapping(bytes key => bytes) _values;
    }

    /**
     * @dev Adds a key-value pair to a map, or updates the value for an existing
     * key. O(1).
     *
     * Returns true if the key was added to the map, that is if it was not
     * already present.
     */
    function set(BytesToBytesMap storage map, bytes memory key, bytes memory value) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    /**
     * @dev Removes a value from a map. O(1).
     *
     * Returns true if the key was removed from the map, that is if it was present.
     */
    function remove(BytesToBytesMap storage map, bytes memory key) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    /**
     * @dev Removes the key-value pair stored at position `index` in the map. O(1).
     *
     * Returns the removed key and its associated value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of the entries inside the map, and it may change when more
     * entries are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(
        BytesToBytesMap storage map,
        uint256 index
    ) internal returns (bytes memory key, bytes memory value) {
        key = map._keys.removeAt(index);
        value = map._values[key];
        delete map._values[key];
    }

    /**
     * @dev Removes all the entries from a map. O(n).
     *
     * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
     * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
     * gas to fit in a block.
     */
    function clear(BytesToBytesMap storage map) internal {
        uint256 len = length(map);
        for (uint256 i = 0; i < len; ++i) {
            delete map._values[map._keys.pos(i)];
        }
        map._keys.clear();
    }

    /**
     * @dev Returns true if the key is in the map. O(1).
     */
    function contains(BytesToBytesMap storage map, bytes memory key) internal view returns (bool) {
        return map._keys.contains(key);
    }

    /**
     * @dev Returns the number of elements in the map. O(1).
     */
    function length(BytesToBytesMap storage map) internal view returns (uint256) {
        return map._keys.length();
    }

    /**
     * @dev Returns the element stored at position `index` in the map. O(1).
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function pos(
        BytesToBytesMap storage map,
        uint256 index
    ) internal view returns (bytes memory key, bytes memory value) {
        bytes memory atKey = map._keys.pos(index);
        return (atKey, map._values[atKey]);
    }

    /**
     * @dev Tries to return the value associated with `key`. O(1).
     * Does not revert if `key` is not in the map.
     */
    function tryGet(
        BytesToBytesMap storage map,
        bytes memory key
    ) internal view returns (bool exists, bytes memory value) {
        bytes memory _value = map._values[key];
        return (bytes(_value).length != 0 || contains(map, key), _value);
    }

    /**
     * @dev Returns the value associated with `key`. O(1).
     *
     * Requirements:
     *
     * - `key` must be in the map.
     */
    function get(BytesToBytesMap storage map, bytes memory key) internal view returns (bytes memory) {
        bytes memory _value = map._values[key];
        if (bytes(_value).length == 0 && !contains(map, key)) {
            revert EnumerableMapNonexistentBytesKey(key);
        }
        return _value;
    }

    /**
     * @dev Returns an array containing all the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(BytesToBytesMap storage map) internal view returns (bytes[] memory) {
        return map._keys.values();
    }

    /**
     * @dev Returns an array containing a slice of the keys
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function keys(BytesToBytesMap storage map, uint256 start, uint256 end) internal view returns (bytes[] memory) {
        return map._keys.values(start, end);
    }
}
