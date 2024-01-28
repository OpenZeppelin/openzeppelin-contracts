const format = require('../format-lines');
const { capitalize } = require('../../helpers');

const TYPES_STORAGE = ['address', 'bytes32', 'uint256'];
const TYPES_MEMORY = ['uint256', 'address'];

const header = `\
pragma solidity ^0.8.20;

import {StorageSlot} from "./StorageSlot.sol";
import {Math} from "./math/Math.sol";

/**
 * @dev Collection of functions related to array types.
 */
`;

const findUpperBound = `
using StorageSlot for bytes32;

/**
 * @dev Searches a sorted \`array\` and returns the first index that contains
 * a value greater or equal to \`element\`. If no such index exists (i.e. all
 * values in the array are strictly less than \`element\`), the array length is
 * returned. Time complexity O(log n).
 *
 * \`array\` is expected to be sorted in ascending order, and to contain no
 * repeated elements.
 */
function findUpperBound(uint256[] storage array, uint256 element) internal view returns (uint256) {
    uint256 low = 0;
    uint256 high = array.length;

    if (high == 0) {
        return 0;
    }

    while (low < high) {
        uint256 mid = Math.average(low, high);

        // Note that mid will always be strictly less than high (i.e. it will be a valid array index)
        // because Math.average rounds towards zero (it does integer division with truncation).
        if (unsafeAccess(array, mid).value > element) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    // At this point \`low\` is the exclusive upper bound. We will return the inclusive upper bound.
    if (low > 0 && unsafeAccess(array, low - 1).value == element) {
        return low - 1;
    } else {
        return low;
    }
}
`;

const unsafeAccessStorage = type => `
/**
* @dev Access an array in an "unsafe" way. Skips solidity "index-out-of-range" check.
*
* WARNING: Only use if you are certain \`pos\` is lower than the array length.
*/
function unsafeAccess(${type}[] storage arr, uint256 pos) internal pure returns (StorageSlot.${capitalize(
  type,
)}Slot storage) {
   bytes32 slot;
   // We use assembly to calculate the storage slot of the element at index \`pos\` of the dynamic array \`arr\`
   // following https://docs.soliditylang.org/en/v0.8.20/internals/layout_in_storage.html#mappings-and-dynamic-arrays.

   /// @solidity memory-safe-assembly
   assembly {
       mstore(0, arr.slot)
       slot := add(keccak256(0, 0x20), pos)
   }
   return slot.get${capitalize(type)}Slot();
}`;

const unsafeAccessMemory = type => `
/**
 * @dev Access an array in an "unsafe" way. Skips solidity "index-out-of-range" check.
 *
 * WARNING: Only use if you are certain \`pos\` is lower than the array length.
 */
function unsafeMemoryAccess(${type}[] memory arr, uint256 pos) internal pure returns (${type} res) {
    assembly {
        res := mload(add(add(arr, 0x20), mul(pos, 0x20)))
    }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Arrays {',
  [findUpperBound, ...TYPES_STORAGE.map(unsafeAccessStorage), ...TYPES_MEMORY.map(unsafeAccessMemory)],
  '}',
);
