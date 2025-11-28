const format = require('../format-lines');
const { fromBytes32, toBytes32 } = require('./conversion');
const { SET_TYPES } = require('./Enumerable.opts');

const header = `\
pragma solidity ^0.8.24;

import {Arrays} from "../Arrays.sol";
import {Math} from "../math/Math.sol";

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
 * - Set can be cleared (all elements removed) in O(n).
 *
 * \`\`\`solidity
 * contract Example {
 *     // Add the library methods
 *     using EnumerableSet for EnumerableSet.AddressSet;
 *
 *     // Declare a set state variable
 *     EnumerableSet.AddressSet private mySet;
 * }
 * \`\`\`
 *
 * The following types are supported:
 *
 * - \`bytes32\` (\`Bytes32Set\`) since v3.3.0
 * - \`address\` (\`AddressSet\`) since v3.3.0
 * - \`uint256\` (\`UintSet\`) since v3.3.0
 * - \`string\` (\`StringSet\`) since v5.4.0
 * - \`bytes\` (\`BytesSet\`) since v5.4.0
 * - \`bytes4\` (\`Bytes4Set\`) since v5.6.0
 *
 * [WARNING]
 * ====
 * Trying to delete such a structure from storage will likely result in data corruption, rendering the structure
 * unusable.
 * See https://github.com/ethereum/solidity/pull/11843[ethereum/solidity#11843] for more info.
 *
 * In order to clean an EnumerableSet, you can either remove all elements one by one or create a fresh instance using an
 * array of EnumerableSet.
 * ====
 */
`;

// NOTE: this should be deprecated in favor of a more native construction in v6.0
const defaultSet = `\
// To implement this library for multiple types with as little code
// repetition as possible, we write it in terms of a generic Set type with
// bytes32 values.
// The Set implementation uses private functions, and user-facing
// implementations (such as AddressSet) are just wrappers around the
// underlying Set.
// This means that we can only create new EnumerableSets for types that fit
// in bytes32.

struct Set {
    // Storage of set values
    bytes32[] _values;
    // Position is the index of the value in the \`values\` array plus 1.
    // Position 0 is used to mean a value is not in the set.
    mapping(bytes32 value => uint256) _positions;
}

/**
 * @dev Add a value to a set. O(1).
 *
 * Returns true if the value was added to the set, that is if it was not
 * already present.
 */
function _add(Set storage set, bytes32 value) private returns (bool) {
    if (!_contains(set, value)) {
        set._values.push(value);
        // The value is stored at length-1, but we add 1 to all indexes
        // and use 0 as a sentinel value
        set._positions[value] = set._values.length;
        return true;
    } else {
        return false;
    }
}

/**
 * @dev Removes a value from a set. O(1).
 *
 * Returns true if the value was removed from the set, that is if it was
 * present.
 */
function _remove(Set storage set, bytes32 value) private returns (bool) {
    // We cache the value's position to prevent multiple reads from the same storage slot
    uint256 position = set._positions[value];

    if (position != 0) {
        // Equivalent to contains(set, value)
        // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
        // the array, and then remove the last element (sometimes called as 'swap and pop').
        // This modifies the order of the array, as noted in {at}.

        uint256 valueIndex = position - 1;
        uint256 lastIndex = set._values.length - 1;

        if (valueIndex != lastIndex) {
            bytes32 lastValue = set._values[lastIndex];

            // Move the lastValue to the index where the value to delete is
            set._values[valueIndex] = lastValue;
            // Update the tracked position of the lastValue (that was just moved)
            set._positions[lastValue] = position;
        }

        // Delete the slot where the moved value was stored
        set._values.pop();

        // Delete the tracked position for the deleted slot
        delete set._positions[value];

        return true;
    } else {
        return false;
    }
}

/**
 * @dev Removes all the values from a set. O(n).
 *
 * WARNING: This function has an unbounded cost that scales with set size. Developers should keep in mind that
 * using it may render the function uncallable if the set grows to the point where clearing it consumes too much
 * gas to fit in a block.
 */
function _clear(Set storage set) private {
    uint256 len = _length(set);
    for (uint256 i = 0; i < len; ++i) {
        delete set._positions[set._values[i]];
    }
    Arrays.unsafeSetLength(set._values, 0);
}

/**
 * @dev Returns true if the value is in the set. O(1).
 */
function _contains(Set storage set, bytes32 value) private view returns (bool) {
    return set._positions[value] != 0;
}

/**
 * @dev Returns the number of values on the set. O(1).
 */
function _length(Set storage set) private view returns (uint256) {
    return set._values.length;
}

/**
 * @dev Returns the value stored at position \`index\` in the set. O(1).
 *
 * Note that there are no guarantees on the ordering of values inside the
 * array, and it may change when more values are added or removed.
 *
 * Requirements:
 *
 * - \`index\` must be strictly less than {length}.
 */
function _at(Set storage set, uint256 index) private view returns (bytes32) {
    return set._values[index];
}

/**
 * @dev Return the entire set in an array
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function _values(Set storage set) private view returns (bytes32[] memory) {
    return set._values;
}

/**
 * @dev Return a slice of the set in an array
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function _values(Set storage set, uint256 start, uint256 end) private view returns (bytes32[] memory) {
    unchecked {
        end = Math.min(end, _length(set));
        start = Math.min(start, end);

        uint256 len = end - start;
        bytes32[] memory result = new bytes32[](len);
        for (uint256 i = 0; i < len; ++i) {
            result[i] = Arrays.unsafeAccess(set._values, start + i).value;
        }
        return result;
    }
}
`;

// NOTE: this should be deprecated in favor of a more native construction in v6.0
const customSet = ({ name, value: { type } }) => `\
// ${name}

struct ${name} {
    Set _inner;
}

/**
 * @dev Add a value to a set. O(1).
 *
 * Returns true if the value was added to the set, that is if it was not
 * already present.
 */
function add(${name} storage set, ${type} value) internal returns (bool) {
    return _add(set._inner, ${toBytes32(type, 'value')});
}

/**
 * @dev Removes a value from a set. O(1).
 *
 * Returns true if the value was removed from the set, that is if it was
 * present.
 */
function remove(${name} storage set, ${type} value) internal returns (bool) {
    return _remove(set._inner, ${toBytes32(type, 'value')});
}

/**
 * @dev Removes all the values from a set. O(n).
 *
 * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
 * function uncallable if the set grows to the point where clearing it consumes too much gas to fit in a block.
 */
function clear(${name} storage set) internal {
    _clear(set._inner);
}

/**
 * @dev Returns true if the value is in the set. O(1).
 */
function contains(${name} storage set, ${type} value) internal view returns (bool) {
    return _contains(set._inner, ${toBytes32(type, 'value')});
}

/**
 * @dev Returns the number of values in the set. O(1).
 */
function length(${name} storage set) internal view returns (uint256) {
    return _length(set._inner);
}

/**
 * @dev Returns the value stored at position \`index\` in the set. O(1).
 *
 * Note that there are no guarantees on the ordering of values inside the
 * array, and it may change when more values are added or removed.
 *
 * Requirements:
 *
 * - \`index\` must be strictly less than {length}.
 */
function at(${name} storage set, uint256 index) internal view returns (${type}) {
    return ${fromBytes32(type, '_at(set._inner, index)')};
}

/**
 * @dev Return the entire set in an array
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function values(${name} storage set) internal view returns (${type}[] memory) {
    bytes32[] memory store = _values(set._inner);
    ${type}[] memory result;

    assembly ("memory-safe") {
        result := store
    }

    return result;
}

/**
 * @dev Return a slice of the set in an array
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function values(${name} storage set, uint256 start, uint256 end) internal view returns (${type}[] memory) {
    bytes32[] memory store = _values(set._inner, start, end);
    ${type}[] memory result;

    assembly ("memory-safe") {
        result := store
    }

    return result;
}
`;

const memorySet = ({ name, value }) => `\
struct ${name} {
    // Storage of set values
    ${value.type}[] _values;
    // Position is the index of the value in the \`values\` array plus 1.
    // Position 0 is used to mean a value is not in the set.
    mapping(${value.type} value => uint256) _positions;
}

/**
 * @dev Add a value to a set. O(1).
 *
 * Returns true if the value was added to the set, that is if it was not
 * already present.
 */
function add(${name} storage set, ${value.type} memory value) internal returns (bool) {
    if (!contains(set, value)) {
        set._values.push(value);
        // The value is stored at length-1, but we add 1 to all indexes
        // and use 0 as a sentinel value
        set._positions[value] = set._values.length;
        return true;
    } else {
        return false;
    }
}

/**
 * @dev Removes a value from a set. O(1).
 *
 * Returns true if the value was removed from the set, that is if it was
 * present.
 */
function remove(${name} storage set, ${value.type} memory value) internal returns (bool) {
    // We cache the value's position to prevent multiple reads from the same storage slot
    uint256 position = set._positions[value];

    if (position != 0) {
        // Equivalent to contains(set, value)
        // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
        // the array, and then remove the last element (sometimes called as 'swap and pop').
        // This modifies the order of the array, as noted in {at}.

        uint256 valueIndex = position - 1;
        uint256 lastIndex = set._values.length - 1;

        if (valueIndex != lastIndex) {
            ${value.type} memory lastValue = set._values[lastIndex];

            // Move the lastValue to the index where the value to delete is
            set._values[valueIndex] = lastValue;
            // Update the tracked position of the lastValue (that was just moved)
            set._positions[lastValue] = position;
        }

        // Delete the slot where the moved value was stored
        set._values.pop();

        // Delete the tracked position for the deleted slot
        delete set._positions[value];

        return true;
    } else {
        return false;
    }
}

/**
 * @dev Removes all the values from a set. O(n).
 *
 * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
 * function uncallable if the set grows to the point where clearing it consumes too much gas to fit in a block.
 */
function clear(${name} storage set) internal {
    uint256 len = length(set);
    for (uint256 i = 0; i < len; ++i) {
        delete set._positions[set._values[i]];
    }
    Arrays.unsafeSetLength(set._values, 0);
}

/**
 * @dev Returns true if the value is in the set. O(1).
 */
function contains(${name} storage set, ${value.type} memory value) internal view returns (bool) {
    return set._positions[value] != 0;
}

/**
 * @dev Returns the number of values on the set. O(1).
 */
function length(${name} storage set) internal view returns (uint256) {
    return set._values.length;
}

/**
 * @dev Returns the value stored at position \`index\` in the set. O(1).
 *
 * Note that there are no guarantees on the ordering of values inside the
 * array, and it may change when more values are added or removed.
 *
 * Requirements:
 *
 * - \`index\` must be strictly less than {length}.
 */
function at(${name} storage set, uint256 index) internal view returns (${value.type} memory) {
    return set._values[index];
}

/**
 * @dev Return the entire set in an array
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function values(${name} storage set) internal view returns (${value.type}[] memory) {
    return set._values;
}

/**
 * @dev Return a slice of the set in an array
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function values(${name} storage set, uint256 start, uint256 end) internal view returns (${value.type}[] memory) {
    unchecked {
        end = Math.min(end, length(set));
        start = Math.min(start, end);

        uint256 len = end - start;
        ${value.type}[] memory result = new ${value.type}[](len);
        for (uint256 i = 0; i < len; ++i) {
            result[i] = Arrays.unsafeAccess(set._values, start + i).value;
        }
        return result;
    }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library EnumerableSet {',
  format(
    [].concat(
      defaultSet,
      SET_TYPES.filter(({ value }) => !value.memory).map(customSet),
      SET_TYPES.filter(({ value }) => value.memory).map(memorySet),
    ),
  ).trimEnd(),
  '}',
);
