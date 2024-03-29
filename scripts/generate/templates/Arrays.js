const format = require('../format-lines');
const { capitalize } = require('../../helpers');
const { TYPES } = require('./Arrays.opts');

const header = `\
pragma solidity ^0.8.20;

import {SlotDerivation} from "./SlotDerivation.sol";
import {StorageSlot} from "./StorageSlot.sol";
import {Math} from "./math/Math.sol";

/**
 * @dev Collection of functions related to array types.
 */
`;

const sort = type => `\
    /**
     * @dev Sort an array of ${type} (in memory) following the provided comparator function.
     *
     * This function does the sorting "in place", meaning that it overrides the input. The object is returned for
     * convenience, but that returned value can be discarded safely if the caller has a memory pointer to the array.
     *
     * NOTE: this function's cost is \`O(n · log(n))\` in average, with n the length of the
     * array. Using it in view functions that are executed through \`eth_call\` is safe, but one should be very careful
     * when executing this as part of a transaction. If the array being sorted is too large, the sort operation may
     * consume more gas than is available in a block, leading to potential DoS.
     */
    function sort(
        ${type}[] memory array,
        function(${type}, ${type}) pure returns (bool) comp
    ) internal pure returns (${type}[] memory) {
        ${
          type === 'bytes32'
            ? '_mergeSort(_begin(array), _end(array), comp);'
            : 'sort(_castToBytes32Array(array), _castToBytes32Comp(comp));'
        }
        return array;
    }

    /**
     * @dev Variant of {sort} that sorts an array of ${type} in increasing order.
     */
    function sort(${type}[] memory array) internal pure returns (${type}[] memory) {
        ${type === 'bytes32' ? 'sort(array, _defaultComp);' : 'sort(_castToBytes32Array(array), _defaultComp);'}
        return array;
    }
`;

const mergeSort = `
/**
 * @dev Performs a merge sort of a segment of memory. The segment sorted starts at \`begin\` (inclusive), and stops
 * at end (exclusive). Sorting follows the \`comp\` comparator.
 *
 * Invariant: \`begin <= end\`. This is the case when initially called by {sort} and is preserved in subcalls.
 *
 * IMPORTANT: Memory locations between \`begin\` and \`end\` are not validated/zeroed. This function should
 * be used only if the limits are within a memory array.
 */
function _mergeSort(
    uint256 begin, 
    uint256 end, 
    function(bytes32, bytes32) pure returns (bool) comp
) private pure {
    if(end - begin < 0x40) return;

    uint256 middle = Math.average(begin, end);
    _mergeSort(begin, middle, comp);
    _mergeSort(middle, end, comp);

    _merge(begin, middle, end, comp);
}

/**
 * @dev Pointer to the memory location of the first element of \`array\`.
 */
function _begin(bytes32[] memory array) private pure returns (uint256 ptr) {
    /// @solidity memory-safe-assembly
    assembly {
        ptr := add(array, 0x20)
    }
}

/**
 * @dev Pointer to the memory location of the first memory word (32bytes) after \`array\`. This is the memory word
 * that comes just after the last element of the array.
 */
function _end(bytes32[] memory array) private pure returns (uint256 ptr) {
    unchecked {
        return _begin(array) + array.length * 0x20;
    }
}

/**
 * @dev Load memory word (as a bytes32) at location \`ptr\`.
 */
function _mload(uint256 ptr) private pure returns (bytes32 value) {
    assembly {
        value := mload(ptr)
    }
}

/**
 * @dev Store a bytes32 \`val\` in memory at location \`ptr\`.
 */
function _mstore(uint256 ptr, bytes32 val) private pure {
    assembly {
        mstore(ptr, val)
    }
}

/**
 * @dev Copies a memory region of size \`size\` starting from \`ptr1\` to \`ptr2\`.
 * 
 * WARNING: Only use if \`size\` is multiple of 32.
 */
function _mcopy(uint256 ptr1, uint256 ptr2, uint256 size) private pure {
    for(uint256 i=0; i<size; i += 0x20) {
        bytes32 val = _mload(ptr1 + i);
        _mstore(ptr2 + i, val);
    }
}

/**
 * @dev Merge two consecutives arrays in memory.
 */
function _merge(
    uint256 begin, 
    uint256 middle, 
    uint256 end,
    function(bytes32, bytes32) pure returns (bool) comp
) private pure {
    uint256 ptr = uint256(_mload(0x40));

    uint256 i = begin;
    uint256 j = middle;
    uint256 k = ptr;

    for(; i < middle && j < end; k += 0x20) {
        bytes32 a = _mload(i);
        bytes32 b = _mload(j);

        if(comp(a, b)) {
            _mstore(k, a);
            i += 0x20;
        } else {
            _mstore(k, b);
            j += 0x20;
        }
    }

    if(i < middle) {
        uint256 size = middle - i;
        _mcopy(i, end - size, size);
    }

    _mcopy(ptr, begin, k - ptr);
}
`;

const defaultComparator = `
    /// @dev Comparator for sorting arrays in increasing order.
    function _defaultComp(bytes32 a, bytes32 b) private pure returns (bool) {
        return a < b;
    }
`;

const castArray = type => `\
    /// @dev Helper: low level cast ${type} memory array to uint256 memory array
    function _castToBytes32Array(${type}[] memory input) private pure returns (bytes32[] memory output) {
        assembly {
            output := input
        }
    }
`;

const castComparator = type => `\
    /// @dev Helper: low level cast ${type} comp function to bytes32 comp function
    function _castToBytes32Comp(
        function(${type}, ${type}) pure returns (bool) input
    ) private pure returns (function(bytes32, bytes32) pure returns (bool) output) {
        assembly {
            output := input
        }
    }
`;

const search = `
/**
 * @dev Searches a sorted \`array\` and returns the first index that contains
 * a value greater or equal to \`element\`. If no such index exists (i.e. all
 * values in the array are strictly less than \`element\`), the array length is
 * returned. Time complexity O(log n).
 *
 * NOTE: The \`array\` is expected to be sorted in ascending order, and to
 * contain no repeated elements.
 *
 * IMPORTANT: Deprecated. This implementation behaves as {lowerBound} but lacks
 * support for repeated elements in the array. The {lowerBound} function should
 * be used instead.
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

/**
 * @dev Searches an \`array\` sorted in ascending order and returns the first
 * index that contains a value greater or equal than \`element\`. If no such index
 * exists (i.e. all values in the array are strictly less than \`element\`), the array
 * length is returned. Time complexity O(log n).
 *
 * See C++'s https://en.cppreference.com/w/cpp/algorithm/lower_bound[lower_bound].
 */
function lowerBound(uint256[] storage array, uint256 element) internal view returns (uint256) {
    uint256 low = 0;
    uint256 high = array.length;

    if (high == 0) {
        return 0;
    }

    while (low < high) {
        uint256 mid = Math.average(low, high);

        // Note that mid will always be strictly less than high (i.e. it will be a valid array index)
        // because Math.average rounds towards zero (it does integer division with truncation).
        if (unsafeAccess(array, mid).value < element) {
            // this cannot overflow because mid < high
            unchecked {
                low = mid + 1;
            }
        } else {
            high = mid;
        }
    }

    return low;
}

/**
 * @dev Searches an \`array\` sorted in ascending order and returns the first
 * index that contains a value strictly greater than \`element\`. If no such index
 * exists (i.e. all values in the array are strictly less than \`element\`), the array
 * length is returned. Time complexity O(log n).
 *
 * See C++'s https://en.cppreference.com/w/cpp/algorithm/upper_bound[upper_bound].
 */
function upperBound(uint256[] storage array, uint256 element) internal view returns (uint256) {
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
            // this cannot overflow because mid < high
            unchecked {
                low = mid + 1;
            }
        }
    }

    return low;
}

/**
 * @dev Same as {lowerBound}, but with an array in memory.
 */
function lowerBoundMemory(uint256[] memory array, uint256 element) internal pure returns (uint256) {
    uint256 low = 0;
    uint256 high = array.length;

    if (high == 0) {
        return 0;
    }

    while (low < high) {
        uint256 mid = Math.average(low, high);

        // Note that mid will always be strictly less than high (i.e. it will be a valid array index)
        // because Math.average rounds towards zero (it does integer division with truncation).
        if (unsafeMemoryAccess(array, mid) < element) {
            // this cannot overflow because mid < high
            unchecked {
                low = mid + 1;
            }
        } else {
            high = mid;
        }
    }

    return low;
}

/**
 * @dev Same as {upperBound}, but with an array in memory.
 */
function upperBoundMemory(uint256[] memory array, uint256 element) internal pure returns (uint256) {
    uint256 low = 0;
    uint256 high = array.length;

    if (high == 0) {
        return 0;
    }

    while (low < high) {
        uint256 mid = Math.average(low, high);

        // Note that mid will always be strictly less than high (i.e. it will be a valid array index)
        // because Math.average rounds towards zero (it does integer division with truncation).
        if (unsafeMemoryAccess(array, mid) > element) {
            high = mid;
        } else {
            // this cannot overflow because mid < high
            unchecked {
                low = mid + 1;
            }
        }
    }

    return low;
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
    /// @solidity memory-safe-assembly
    assembly {
        slot := arr.slot
    }
    return slot.deriveArray().offset(pos).get${capitalize(type)}Slot();
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

const unsafeSetLength = type => `
/**
 * @dev Helper to set the length of an dynamic array. Directly writing to \`.length\` is forbidden.
 *
 * WARNING: this does not clear elements if length is reduced, of initialize elements if length is increased.
 */
function unsafeSetLength(${type}[] storage array, uint256 len) internal {
    assembly {
        sstore(array.slot, len)
    }
}`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Arrays {',
  'using SlotDerivation for bytes32;',
  'using StorageSlot for bytes32;',
  // sorting, comparator, helpers and internal
  sort('bytes32'),
  TYPES.filter(type => type !== 'bytes32').map(sort),
  mergeSort,
  defaultComparator,
  TYPES.filter(type => type !== 'bytes32').map(castArray),
  TYPES.filter(type => type !== 'bytes32').map(castComparator),
  // lookup
  search,
  // unsafe (direct) storage and memory access
  TYPES.map(unsafeAccessStorage),
  TYPES.map(unsafeAccessMemory),
  TYPES.map(unsafeSetLength),
  '}',
);
