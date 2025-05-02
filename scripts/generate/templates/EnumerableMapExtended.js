const format = require('../format-lines');
const { EXTENDED_SET_TYPES, EXTENDED_MAP_TYPES } = require('./Enumerable.opts');

const header = `\
pragma solidity ^0.8.20;

import {EnumerableSet} from "./EnumerableSet.sol";
import {EnumerableSetExtended} from "./EnumerableSetExtended.sol";

/**
 * @dev Library for managing an enumerable variant of Solidity's
 * https://solidity.readthedocs.io/en/latest/types.html#mapping-types[\`mapping\`]
 * type for non-value types as keys.
 *
 * Maps have the following properties:
 *
 * - Entries are added, removed, and checked for existence in constant time
 * (O(1)).
 * - Entries are enumerated in O(n). No guarantees are made on the ordering.
 * - Map can be cleared (all entries removed) in O(n).
 *
 * \`\`\`solidity
 * contract Example {
 *     // Add the library methods
 *     using EnumerableMapExtended for EnumerableMapExtended.BytesToUintMap;
 *
 *     // Declare a set state variable
 *     EnumerableMapExtended.BytesToUintMap private myMap;
 * }
 * \`\`\`
 *
 * The following map types are supported:
 *
 * - \`bytes -> uint256\` (\`BytesToUintMap\`)
 * - \`string -> string\` (\`StringToStringMap\`)
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
 *
 * NOTE: Extensions of {EnumerableMap}
 */
`;

const map = ({ name, keySet, key, value }) => `\
/**
 * @dev Query for a nonexistent map key.
 */
error EnumerableMapNonexistent${key.name}Key(${key.type} key);

struct ${name} {
    // Storage of keys
    ${EXTENDED_SET_TYPES.some(el => el.name == keySet.name) ? 'EnumerableSetExtended' : 'EnumerableSet'}.${keySet.name} _keys;
    mapping(${key.type} key => ${value.type}) _values;
}

/**
 * @dev Adds a key-value pair to a map, or updates the value for an existing
 * key. O(1).
 *
 * Returns true if the key was added to the map, that is if it was not
 * already present.
 */
function set(${name} storage map, ${key.typeLoc} key, ${value.typeLoc} value) internal returns (bool) {
    map._values[key] = value;
    return map._keys.add(key);
}

/**
 * @dev Removes a key-value pair from a map. O(1).
 *
 * Returns true if the key was removed from the map, that is if it was present.
 */
function remove(${name} storage map, ${key.typeLoc} key) internal returns (bool) {
    delete map._values[key];
    return map._keys.remove(key);
}

/**
 * @dev Removes all the entries from a map. O(n).
 *
 * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
 * function uncallable if the map grows to the point where clearing it consumes too much gas to fit in a block.
 */
function clear(${name} storage map) internal {
    uint256 len = length(map);
    for (uint256 i = 0; i < len; ++i) {
        delete map._values[map._keys.at(i)];
    }
    map._keys.clear();
}

/**
 * @dev Returns true if the key is in the map. O(1).
 */
function contains(${name} storage map, ${key.typeLoc} key) internal view returns (bool) {
    return map._keys.contains(key);
}

/**
 * @dev Returns the number of key-value pairs in the map. O(1).
 */
function length(${name} storage map) internal view returns (uint256) {
    return map._keys.length();
}

/**
 * @dev Returns the key-value pair stored at position \`index\` in the map. O(1).
 *
 * Note that there are no guarantees on the ordering of entries inside the
 * array, and it may change when more entries are added or removed.
 *
 * Requirements:
 *
 * - \`index\` must be strictly less than {length}.
 */
function at(
    ${name} storage map,
    uint256 index
) internal view returns (${key.typeLoc} key, ${value.typeLoc} value) {
    key = map._keys.at(index);
    value = map._values[key];
}

/**
 * @dev Tries to returns the value associated with \`key\`. O(1).
 * Does not revert if \`key\` is not in the map.
 */
function tryGet(
    ${name} storage map,
    ${key.typeLoc} key
) internal view returns (bool exists, ${value.typeLoc} value) {
    value = map._values[key];
    exists = ${value.memory ? 'bytes(value).length != 0' : `value != ${value.type}(0)`} || contains(map, key);
}

/**
 * @dev Returns the value associated with \`key\`. O(1).
 *
 * Requirements:
 *
 * - \`key\` must be in the map.
 */
function get(${name} storage map, ${key.typeLoc} key) internal view returns (${value.typeLoc} value) {
    bool exists;
    (exists, value) = tryGet(map, key);
    if (!exists) {
        revert EnumerableMapNonexistent${key.name}Key(key);
    }
}

/**
 * @dev Return the an array containing all the keys
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function keys(${name} storage map) internal view returns (${key.type}[] memory) {
    return map._keys.values();
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library EnumerableMapExtended {',
  format(
    [].concat('using EnumerableSet for *;', 'using EnumerableSetExtended for *;', '', EXTENDED_MAP_TYPES.map(map)),
  ).trimEnd(),
  '}',
);
