const format = require('../format-lines');
const { TYPES } = require('./Heap.opts');
const { capitalize } = require('../../helpers');

/* eslint-disable max-len */
const header = `\
pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";
import {SafeCast} from "../math/SafeCast.sol";
import {Comparators} from "../Comparators.sol";
import {Panic} from "../Panic.sol";

/**
 * @dev Library for managing https://en.wikipedia.org/wiki/Binary_heap[binary heap] that can be used as
 * https://en.wikipedia.org/wiki/Priority_queue[priority queue].
 *
 * Heaps are represented as an array of Node objects. This array stores two overlapping structures:
 * * A tree structure where the first element (index 0) is the root, and where the node at index i is the child of the
 *   node at index (i-1)/2 and the father of nodes at index 2*i+1 and 2*i+2. Each node stores the index (in the array)
 *   where the corresponding value is stored.
 * * A list of payloads values where each index contains a value and a lookup index. The type of the value depends on
 *   the variant being used. The lookup is the index of the node (in the tree) that points to this value.
 *
 * Some invariants:
 *   \`\`\`
 *   i == heap.data[heap.data[i].index].lookup // for all indices i
 *   i == heap.data[heap.data[i].lookup].index // for all indices i
 *   \`\`\`
 *
 * The structure is ordered so that each node is bigger than its parent. An immediate consequence is that the
 * highest priority value is the one at the root. This value can be looked up in constant time (O(1)) at
 * \`heap.data[heap.data[0].index].value\`
 *
 * The structure is designed to perform the following operations with the corresponding complexities:
 *
 * * peek (get the highest priority value): O(1)
 * * insert (insert a value): O(log(n))
 * * pop (remove the highest priority value): O(log(n))
 * * replace (replace the highest priority value with a new value): O(log(n))
 * * length (get the number of elements): O(1)
 * * clear (remove all elements): O(1)
 */
`;

const generate = ({ struct, node, valueType, indexType, blockSize }) => `\
/**
 * @dev Binary heap that support values of type ${valueType}.
 *
 * Each element of that structure uses ${blockSize} storage slots.
 */
struct ${struct} {
    ${node}[] data;
}

/**
 * @dev Internal node type for ${struct}. Stores a value of type ${valueType}.
 */
struct ${node} {
    ${valueType} value;
    ${indexType} index; // position -> value
    ${indexType} lookup; // value -> position
}

/**
 * @dev Lookup the root element of the heap.
 */
function peek(${struct} storage self) internal view returns (${valueType}) {
    // self.data[0] will \`ARRAY_ACCESS_OUT_OF_BOUNDS\` panic if heap is empty.
    return _unsafeNodeAccess(self, self.data[0].index).value;
}

/**
 * @dev Remove (and return) the root element for the heap using the default comparator.
 *
 * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function pop(${struct} storage self) internal returns (${valueType}) {
    return pop(self, Comparators.lt);
}

/**
 * @dev Remove (and return) the root element for the heap using the provided comparator.
 *
 * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function pop(
    ${struct} storage self,
    function(uint256, uint256) view returns (bool) comp
) internal returns (${valueType}) {
    unchecked {
        ${indexType} size = length(self);
        if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

        ${indexType} last = size - 1;

        // get root location (in the data array) and value
        ${node} storage rootNode = _unsafeNodeAccess(self, 0);
        ${indexType} rootIdx = rootNode.index;
        ${node} storage rootData = _unsafeNodeAccess(self, rootIdx);
        ${node} storage lastNode = _unsafeNodeAccess(self, last);
        ${valueType} rootDataValue = rootData.value;

        // if root is not the last element of the data array (that will get popped), reorder the data array.
        if (rootIdx != last) {
            // get details about the value stored in the last element of the array (that will get popped)
            ${indexType} lastDataIdx = lastNode.lookup;
            ${valueType} lastDataValue = lastNode.value;
            // copy these values to the location of the root (that is safe, and that we no longer use)
            rootData.value = lastDataValue;
            rootData.lookup = lastDataIdx;
            // update the tree node that used to point to that last element (value now located where the root was)
            _unsafeNodeAccess(self, lastDataIdx).index = rootIdx;
        }

        // get last leaf location (in the data array) and value
        ${indexType} lastIdx = lastNode.index;
        ${valueType} lastValue = _unsafeNodeAccess(self, lastIdx).value;

        // move the last leaf to the root, pop last leaf ...
        rootNode.index = lastIdx;
        _unsafeNodeAccess(self, lastIdx).lookup = 0;
        self.data.pop();

        // ... and heapify
        _siftDown(self, last, 0, lastValue, comp);

        // return root value
        return rootDataValue;
    }
}

/**
 * @dev Insert a new element in the heap using the default comparator.
 *
 * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function insert(${struct} storage self, ${valueType} value) internal {
    insert(self, value, Comparators.lt);
}

/**
 * @dev Insert a new element in the heap using the provided comparator.
 *
 * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function insert(
    ${struct} storage self,
    ${valueType} value,
    function(uint256, uint256) view returns (bool) comp
) internal {
    ${indexType} size = length(self);
    if (size == type(${indexType}).max) Panic.panic(Panic.RESOURCE_ERROR);

    self.data.push(${struct}Node({index: size, lookup: size, value: value}));
    _siftUp(self, size, value, comp);
}

/**
 * @dev Return the root element for the heap, and replace it with a new value, using the default comparator.
 * This is equivalent to using {pop} and {insert}, but requires only one rebalancing operation.
 *
 * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function replace(${struct} storage self, ${valueType} newValue) internal returns (${valueType}) {
    return replace(self, newValue, Comparators.lt);
}

/**
 * @dev Return the root element for the heap, and replace it with a new value, using the provided comparator.
 * This is equivalent to using {pop} and {insert}, but requires only one rebalancing operation.
 *
 * NOTE: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function replace(
    ${struct} storage self,
    ${valueType} newValue,
    function(uint256, uint256) view returns (bool) comp
) internal returns (${valueType}) {
    ${indexType} size = length(self);
    if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

    // position of the node that holds the data for the root
    ${indexType} rootIdx = _unsafeNodeAccess(self, 0).index;
    // storage pointer to the node that holds the data for the root
    ${node} storage rootData = _unsafeNodeAccess(self, rootIdx);

    // cache old value and replace it
    ${valueType} oldValue = rootData.value;
    rootData.value = newValue;

    // re-heapify
    _siftDown(self, size, 0, newValue, comp);

    // return old root value
    return oldValue;
}

/**
 * @dev Returns the number of elements in the heap.
 */
function length(${struct} storage self) internal view returns (${indexType}) {
    return self.data.length.to${capitalize(indexType)}();
}

/**
 * @dev Removes all elements in the heap.
 */
function clear(${struct} storage self) internal {
    ${struct}Node[] storage data = self.data;
    /// @solidity memory-safe-assembly
    assembly {
        sstore(data.slot, 0)
    }
}

/**
 * @dev Swap node \`i\` and \`j\` in the tree.
 */
function _swap(${struct} storage self, ${indexType} i, ${indexType} j) private {
    ${node} storage ni = _unsafeNodeAccess(self, i);
    ${node} storage nj = _unsafeNodeAccess(self, j);
    ${indexType} ii = ni.index;
    ${indexType} jj = nj.index;
    // update pointers to the data (swap the value)
    ni.index = jj;
    nj.index = ii;
    // update lookup pointers for consistency
    _unsafeNodeAccess(self, ii).lookup = j;
    _unsafeNodeAccess(self, jj).lookup = i;
}

/**
 * @dev Perform heap maintenance on \`self\`, starting at position \`pos\` (with the \`value\`), using \`comp\` as a
 * comparator, and moving toward the leafs of the underlying tree.
 *
 * NOTE: This is a private function that is called in a trusted context with already cached parameters. \`length\`
 * and \`value\` could be extracted from \`self\` and \`pos\`, but that would require redundant storage read. These
 * parameters are not verified. It is the caller role to make sure the parameters are correct.
 */
function _siftDown(
    ${struct} storage self,
    ${indexType} size,
    ${indexType} pos,
    ${valueType} value,
    function(uint256, uint256) view returns (bool) comp
) private {
    uint256 left = 2 * pos + 1; // this could overflow ${indexType}
    uint256 right = 2 * pos + 2; // this could overflow ${indexType}

    if (right < size) {
        // the check guarantees that \`left\` and \`right\` are both valid ${indexType}
        ${indexType} lIndex = ${indexType}(left);
        ${indexType} rIndex = ${indexType}(right);
        ${valueType} lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, lIndex).index).value;
        ${valueType} rValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, rIndex).index).value;
        if (comp(lValue, value) || comp(rValue, value)) {
            ${indexType} index = ${indexType}(comp(lValue, rValue).ternary(lIndex, rIndex));
            _swap(self, pos, index);
            _siftDown(self, size, index, value, comp);
        }
    } else if (left < size) {
        // the check guarantees that \`left\` is a valid ${indexType}
        ${indexType} lIndex = ${indexType}(left);
        ${valueType} lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, lIndex).index).value;
        if (comp(lValue, value)) {
            _swap(self, pos, lIndex);
            _siftDown(self, size, lIndex, value, comp);
        }
    }
}

/**
 * @dev Perform heap maintenance on \`self\`, starting at position \`pos\` (with the \`value\`), using \`comp\` as a
 * comparator, and moving toward the root of the underlying tree.
 *
 * NOTE: This is a private function that is called in a trusted context with already cached parameters. \`value\`
 * could be extracted from \`self\` and \`pos\`, but that would require redundant storage read. These parameters are not
 * verified. It is the caller role to make sure the parameters are correct.
 */
function _siftUp(
    ${struct} storage self,
    ${indexType} pos,
    ${valueType} value,
    function(uint256, uint256) view returns (bool) comp
) private {
    unchecked {
        while (pos > 0) {
            ${indexType} parent = (pos - 1) / 2;
            ${valueType} parentValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, parent).index).value;
            if (comp(parentValue, value)) break;
            _swap(self, pos, parent);
            pos = parent;
        }
    }
}

function _unsafeNodeAccess(
    ${struct} storage self,
    ${indexType} pos
) private pure returns (${node} storage result) {
    assembly ("memory-safe") {
        mstore(0x00, self.slot)
        result.slot := add(keccak256(0x00, 0x20), ${blockSize == 1 ? 'pos' : `mul(pos, ${blockSize})`})
    }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Heap {',
  format(
    [].concat(
      'using Math for *;',
      'using SafeCast for *;',
      '',
      TYPES.map(type => generate(type)),
    ),
  ).trimEnd(),
  '}',
);
