// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (utils/structs/EnumerableSet.sol)
// This file was procedurally generated from scripts/generate/templates/EnumerableSet.sol.eta.

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
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using EnumerableSet for EnumerableSet.AddressSet;
 *
 *     // Declare a set state variable
 *     EnumerableSet.AddressSet private mySet;
 * }
 * ```
 *
 * The following types are supported:
 *
 * - `bytes32` (`Bytes32Set`) since v3.3.0
 * - `address` (`AddressSet`) since v3.3.0
 * - `uint256` (`UintSet`) since v3.3.0
 * - `string` (`StringSet`) since v5.4.0
 * - `bytes` (`BytesSet`) since v5.4.0
 * - `bytes4` (`Bytes4Set`) since v5.6.0
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
library EnumerableSet {
    // Bytes32Set

    struct Bytes32Set {
        // Storage of set values
        bytes32[] _values;
        // Position is the index of the value in the `values` array plus 1.
        // Position 0 is used to mean a value is not in the set.
        mapping(bytes32 value => uint256) _positions;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(Bytes32Set storage set, bytes32 value) internal returns (bool) {
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
    function remove(Bytes32Set storage set, bytes32 value) internal returns (bool) {
        uint256 position = set._positions[value];

        if (position != 0) {
            _removeValueAt(set, value, position - 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * Returns the removed value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of values inside the array, and it may change when more
     * values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(Bytes32Set storage set, uint256 index) internal returns (bytes32 value) {
        value = set._values[index];
        _removeValueAt(set, value, index);
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * To delete an element from the `_values` array in O(1), we swap the element to delete with the last one in the
     * array, and then remove the last element (sometimes called as 'swap and pop'). This modifies the order of the
     * array, as noted in {at}.
     *
     * IMPORTANT: This does not verify that `value` is the value currently stored at `index`. Callers must ensure
     * both arguments are consistent, otherwise the set is left in a corrupted state.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function _removeValueAt(Bytes32Set storage set, bytes32 value, uint256 index) private {
        uint256 lastIndex = set._values.length - 1;

        if (index != lastIndex) {
            bytes32 lastValue = set._values[lastIndex];

            // Move the lastValue to the index where the value to delete is
            set._values[index] = lastValue;
            // Update the tracked position of the lastValue (that was just moved)
            set._positions[lastValue] = index + 1;
        }

        // Delete the slot where the moved value was stored
        set._values.pop();

        // Delete the tracked position for the deleted slot
        delete set._positions[value];
    }

    /**
     * @dev Removes all the values from a set. O(n).
     *
     * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
     * function uncallable if the set grows to the point where clearing it consumes too much gas to fit in a block.
     */
    function clear(Bytes32Set storage set) internal {
        uint256 len = length(set);
        for (uint256 i = 0; i < len; ++i) {
            delete set._positions[set._values[i]];
        }
        bytes32[] storage _values = set._values;
        assembly ("memory-safe") {
            sstore(_values.slot, 0)
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(Bytes32Set storage set, bytes32 value) internal view returns (bool) {
        return set._positions[value] != 0;
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(Bytes32Set storage set) internal view returns (uint256) {
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
    function pos(Bytes32Set storage set, uint256 index) internal view returns (bytes32) {
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
    function values(Bytes32Set storage set) internal view returns (bytes32[] memory) {
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
    function values(Bytes32Set storage set, uint256 start, uint256 end) internal view returns (bytes32[] memory) {
        unchecked {
            end = Math.min(end, length(set));
            start = Math.min(start, end);

            uint256 len = end - start;
            bytes32[] memory result = new bytes32[](len);

            for (uint256 i = 0; i < len; ++i) {
                result[i] = Arrays.unsafeAccess(set._values, start + i).value;
            }
            return result;
        }
    }

    // Bytes4Set

    struct Bytes4Set {
        // Storage of set values
        bytes4[] _values;
        // Position is the index of the value in the `values` array plus 1.
        // Position 0 is used to mean a value is not in the set.
        mapping(bytes4 value => uint256) _positions;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(Bytes4Set storage set, bytes4 value) internal returns (bool) {
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
    function remove(Bytes4Set storage set, bytes4 value) internal returns (bool) {
        uint256 position = set._positions[value];

        if (position != 0) {
            _removeValueAt(set, value, position - 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * Returns the removed value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of values inside the array, and it may change when more
     * values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(Bytes4Set storage set, uint256 index) internal returns (bytes4 value) {
        value = set._values[index];
        _removeValueAt(set, value, index);
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * To delete an element from the `_values` array in O(1), we swap the element to delete with the last one in the
     * array, and then remove the last element (sometimes called as 'swap and pop'). This modifies the order of the
     * array, as noted in {at}.
     *
     * IMPORTANT: This does not verify that `value` is the value currently stored at `index`. Callers must ensure
     * both arguments are consistent, otherwise the set is left in a corrupted state.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function _removeValueAt(Bytes4Set storage set, bytes4 value, uint256 index) private {
        uint256 lastIndex = set._values.length - 1;

        if (index != lastIndex) {
            bytes4 lastValue = set._values[lastIndex];

            // Move the lastValue to the index where the value to delete is
            set._values[index] = lastValue;
            // Update the tracked position of the lastValue (that was just moved)
            set._positions[lastValue] = index + 1;
        }

        // Delete the slot where the moved value was stored
        set._values.pop();

        // Delete the tracked position for the deleted slot
        delete set._positions[value];
    }

    /**
     * @dev Removes all the values from a set. O(n).
     *
     * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
     * function uncallable if the set grows to the point where clearing it consumes too much gas to fit in a block.
     */
    function clear(Bytes4Set storage set) internal {
        uint256 len = length(set);
        for (uint256 i = 0; i < len; ++i) {
            delete set._positions[set._values[i]];
        }
        bytes4[] storage _values = set._values;
        assembly ("memory-safe") {
            sstore(_values.slot, 0)
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(Bytes4Set storage set, bytes4 value) internal view returns (bool) {
        return set._positions[value] != 0;
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(Bytes4Set storage set) internal view returns (uint256) {
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
    function pos(Bytes4Set storage set, uint256 index) internal view returns (bytes4) {
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
    function values(Bytes4Set storage set) internal view returns (bytes4[] memory) {
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
    function values(Bytes4Set storage set, uint256 start, uint256 end) internal view returns (bytes4[] memory) {
        unchecked {
            end = Math.min(end, length(set));
            start = Math.min(start, end);

            uint256 len = end - start;
            bytes4[] memory result = new bytes4[](len);

            for (uint256 i = 0; i < len; ++i) {
                result[i] = set._values[start + i];
            }
            return result;
        }
    }

    // AddressSet

    struct AddressSet {
        // Storage of set values
        address[] _values;
        // Position is the index of the value in the `values` array plus 1.
        // Position 0 is used to mean a value is not in the set.
        mapping(address value => uint256) _positions;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(AddressSet storage set, address value) internal returns (bool) {
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
    function remove(AddressSet storage set, address value) internal returns (bool) {
        uint256 position = set._positions[value];

        if (position != 0) {
            _removeValueAt(set, value, position - 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * Returns the removed value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of values inside the array, and it may change when more
     * values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(AddressSet storage set, uint256 index) internal returns (address value) {
        value = set._values[index];
        _removeValueAt(set, value, index);
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * To delete an element from the `_values` array in O(1), we swap the element to delete with the last one in the
     * array, and then remove the last element (sometimes called as 'swap and pop'). This modifies the order of the
     * array, as noted in {at}.
     *
     * IMPORTANT: This does not verify that `value` is the value currently stored at `index`. Callers must ensure
     * both arguments are consistent, otherwise the set is left in a corrupted state.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function _removeValueAt(AddressSet storage set, address value, uint256 index) private {
        uint256 lastIndex = set._values.length - 1;

        if (index != lastIndex) {
            address lastValue = set._values[lastIndex];

            // Move the lastValue to the index where the value to delete is
            set._values[index] = lastValue;
            // Update the tracked position of the lastValue (that was just moved)
            set._positions[lastValue] = index + 1;
        }

        // Delete the slot where the moved value was stored
        set._values.pop();

        // Delete the tracked position for the deleted slot
        delete set._positions[value];
    }

    /**
     * @dev Removes all the values from a set. O(n).
     *
     * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
     * function uncallable if the set grows to the point where clearing it consumes too much gas to fit in a block.
     */
    function clear(AddressSet storage set) internal {
        uint256 len = length(set);
        for (uint256 i = 0; i < len; ++i) {
            delete set._positions[set._values[i]];
        }
        address[] storage _values = set._values;
        assembly ("memory-safe") {
            sstore(_values.slot, 0)
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(AddressSet storage set, address value) internal view returns (bool) {
        return set._positions[value] != 0;
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(AddressSet storage set) internal view returns (uint256) {
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
    function pos(AddressSet storage set, uint256 index) internal view returns (address) {
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
    function values(AddressSet storage set) internal view returns (address[] memory) {
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
    function values(AddressSet storage set, uint256 start, uint256 end) internal view returns (address[] memory) {
        unchecked {
            end = Math.min(end, length(set));
            start = Math.min(start, end);

            uint256 len = end - start;
            address[] memory result = new address[](len);

            for (uint256 i = 0; i < len; ++i) {
                result[i] = Arrays.unsafeAccess(set._values, start + i).value;
            }
            return result;
        }
    }

    // UintSet

    struct UintSet {
        // Storage of set values
        uint256[] _values;
        // Position is the index of the value in the `values` array plus 1.
        // Position 0 is used to mean a value is not in the set.
        mapping(uint256 value => uint256) _positions;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(UintSet storage set, uint256 value) internal returns (bool) {
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
    function remove(UintSet storage set, uint256 value) internal returns (bool) {
        uint256 position = set._positions[value];

        if (position != 0) {
            _removeValueAt(set, value, position - 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * Returns the removed value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of values inside the array, and it may change when more
     * values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(UintSet storage set, uint256 index) internal returns (uint256 value) {
        value = set._values[index];
        _removeValueAt(set, value, index);
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * To delete an element from the `_values` array in O(1), we swap the element to delete with the last one in the
     * array, and then remove the last element (sometimes called as 'swap and pop'). This modifies the order of the
     * array, as noted in {at}.
     *
     * IMPORTANT: This does not verify that `value` is the value currently stored at `index`. Callers must ensure
     * both arguments are consistent, otherwise the set is left in a corrupted state.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function _removeValueAt(UintSet storage set, uint256 value, uint256 index) private {
        uint256 lastIndex = set._values.length - 1;

        if (index != lastIndex) {
            uint256 lastValue = set._values[lastIndex];

            // Move the lastValue to the index where the value to delete is
            set._values[index] = lastValue;
            // Update the tracked position of the lastValue (that was just moved)
            set._positions[lastValue] = index + 1;
        }

        // Delete the slot where the moved value was stored
        set._values.pop();

        // Delete the tracked position for the deleted slot
        delete set._positions[value];
    }

    /**
     * @dev Removes all the values from a set. O(n).
     *
     * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
     * function uncallable if the set grows to the point where clearing it consumes too much gas to fit in a block.
     */
    function clear(UintSet storage set) internal {
        uint256 len = length(set);
        for (uint256 i = 0; i < len; ++i) {
            delete set._positions[set._values[i]];
        }
        uint256[] storage _values = set._values;
        assembly ("memory-safe") {
            sstore(_values.slot, 0)
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(UintSet storage set, uint256 value) internal view returns (bool) {
        return set._positions[value] != 0;
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(UintSet storage set) internal view returns (uint256) {
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
    function pos(UintSet storage set, uint256 index) internal view returns (uint256) {
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
    function values(UintSet storage set) internal view returns (uint256[] memory) {
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
    function values(UintSet storage set, uint256 start, uint256 end) internal view returns (uint256[] memory) {
        unchecked {
            end = Math.min(end, length(set));
            start = Math.min(start, end);

            uint256 len = end - start;
            uint256[] memory result = new uint256[](len);

            for (uint256 i = 0; i < len; ++i) {
                result[i] = Arrays.unsafeAccess(set._values, start + i).value;
            }
            return result;
        }
    }

    // StringSet

    struct StringSet {
        // Storage of set values
        string[] _values;
        // Position is the index of the value in the `values` array plus 1.
        // Position 0 is used to mean a value is not in the set.
        mapping(string value => uint256) _positions;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(StringSet storage set, string memory value) internal returns (bool) {
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
    function remove(StringSet storage set, string memory value) internal returns (bool) {
        uint256 position = set._positions[value];

        if (position != 0) {
            _removeValueAt(set, value, position - 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * Returns the removed value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of values inside the array, and it may change when more
     * values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(StringSet storage set, uint256 index) internal returns (string memory value) {
        value = set._values[index];
        _removeValueAt(set, value, index);
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * To delete an element from the `_values` array in O(1), we swap the element to delete with the last one in the
     * array, and then remove the last element (sometimes called as 'swap and pop'). This modifies the order of the
     * array, as noted in {at}.
     *
     * IMPORTANT: This does not verify that `value` is the value currently stored at `index`. Callers must ensure
     * both arguments are consistent, otherwise the set is left in a corrupted state.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function _removeValueAt(StringSet storage set, string memory value, uint256 index) private {
        uint256 lastIndex = set._values.length - 1;

        if (index != lastIndex) {
            string memory lastValue = set._values[lastIndex];

            // Move the lastValue to the index where the value to delete is
            set._values[index] = lastValue;
            // Update the tracked position of the lastValue (that was just moved)
            set._positions[lastValue] = index + 1;
        }

        // Delete the slot where the moved value was stored
        set._values.pop();

        // Delete the tracked position for the deleted slot
        delete set._positions[value];
    }

    /**
     * @dev Removes all the values from a set. O(n).
     *
     * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
     * function uncallable if the set grows to the point where clearing it consumes too much gas to fit in a block.
     */
    function clear(StringSet storage set) internal {
        uint256 len = length(set);
        for (uint256 i = 0; i < len; ++i) {
            delete set._positions[set._values[i]];
        }
        string[] storage _values = set._values;
        assembly ("memory-safe") {
            sstore(_values.slot, 0)
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(StringSet storage set, string memory value) internal view returns (bool) {
        return set._positions[value] != 0;
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(StringSet storage set) internal view returns (uint256) {
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
    function pos(StringSet storage set, uint256 index) internal view returns (string memory) {
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
    function values(StringSet storage set) internal view returns (string[] memory) {
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
    function values(StringSet storage set, uint256 start, uint256 end) internal view returns (string[] memory) {
        unchecked {
            end = Math.min(end, length(set));
            start = Math.min(start, end);

            uint256 len = end - start;
            string[] memory result = new string[](len);

            for (uint256 i = 0; i < len; ++i) {
                result[i] = Arrays.unsafeAccess(set._values, start + i).value;
            }
            return result;
        }
    }

    // BytesSet

    struct BytesSet {
        // Storage of set values
        bytes[] _values;
        // Position is the index of the value in the `values` array plus 1.
        // Position 0 is used to mean a value is not in the set.
        mapping(bytes value => uint256) _positions;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(BytesSet storage set, bytes memory value) internal returns (bool) {
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
    function remove(BytesSet storage set, bytes memory value) internal returns (bool) {
        uint256 position = set._positions[value];

        if (position != 0) {
            _removeValueAt(set, value, position - 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * Returns the removed value.
     *
     * This is cheaper than {remove} when the caller already knows the index, because it skips the position lookup
     * that {remove} performs.
     *
     * Note that there are no guarantees on the ordering of values inside the array, and it may change when more
     * values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function removeAt(BytesSet storage set, uint256 index) internal returns (bytes memory value) {
        value = set._values[index];
        _removeValueAt(set, value, index);
    }

    /**
     * @dev Removes the value stored at position `index` from a set. O(1).
     *
     * To delete an element from the `_values` array in O(1), we swap the element to delete with the last one in the
     * array, and then remove the last element (sometimes called as 'swap and pop'). This modifies the order of the
     * array, as noted in {at}.
     *
     * IMPORTANT: This does not verify that `value` is the value currently stored at `index`. Callers must ensure
     * both arguments are consistent, otherwise the set is left in a corrupted state.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function _removeValueAt(BytesSet storage set, bytes memory value, uint256 index) private {
        uint256 lastIndex = set._values.length - 1;

        if (index != lastIndex) {
            bytes memory lastValue = set._values[lastIndex];

            // Move the lastValue to the index where the value to delete is
            set._values[index] = lastValue;
            // Update the tracked position of the lastValue (that was just moved)
            set._positions[lastValue] = index + 1;
        }

        // Delete the slot where the moved value was stored
        set._values.pop();

        // Delete the tracked position for the deleted slot
        delete set._positions[value];
    }

    /**
     * @dev Removes all the values from a set. O(n).
     *
     * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
     * function uncallable if the set grows to the point where clearing it consumes too much gas to fit in a block.
     */
    function clear(BytesSet storage set) internal {
        uint256 len = length(set);
        for (uint256 i = 0; i < len; ++i) {
            delete set._positions[set._values[i]];
        }
        bytes[] storage _values = set._values;
        assembly ("memory-safe") {
            sstore(_values.slot, 0)
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(BytesSet storage set, bytes memory value) internal view returns (bool) {
        return set._positions[value] != 0;
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(BytesSet storage set) internal view returns (uint256) {
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
    function pos(BytesSet storage set, uint256 index) internal view returns (bytes memory) {
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
    function values(BytesSet storage set) internal view returns (bytes[] memory) {
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
    function values(BytesSet storage set, uint256 start, uint256 end) internal view returns (bytes[] memory) {
        unchecked {
            end = Math.min(end, length(set));
            start = Math.min(start, end);

            uint256 len = end - start;
            bytes[] memory result = new bytes[](len);

            for (uint256 i = 0; i < len; ++i) {
                result[i] = Arrays.unsafeAccess(set._values, start + i).value;
            }
            return result;
        }
    }
}
