const format = require('../format-lines');
const { TYPES } = require('./Heap.opts');
const { capitalize } = require('../../helpers');

/* eslint-disable max-len */
const header = `\
pragma solidity ^0.8.20;

import {SafeCast} from "../math/SafeCast.sol";
import {Comparators} from "../Comparators.sol";
import {Panic} from "../Panic.sol";
`;

const generate = ({ struct, node, valueType, indexType, blockSize }) => `\
/**
 * A Heap is represented as an array of Node objects. In this array we store two overlapping structures:
 * - A tree structure, where index 0 is the root, and for each index i, the children are 2*i+1 and 2*i+2.
 *   For each index in this tree we have the \`index\` pointer that gives the position of the corresponding value.
 * - An array of values (payload). At each index we store a ${valueType} \`value\` and \`lookup\`, the index of the node
 *   that points to this value.
 *
 * Some invariant:
 *   \`\`\`
 *   i == heap.data[heap[data].index].lookup // for all index i
 *   i == heap.data[heap[data].lookup].index // for all index i
 *   \`\`\`
 *
 * The structure is order so that each node is bigger then its parent. An immediate consequence is that the
 * smallest value is the one at the root. It can be retrieved in O(1) at \`heap.data[heap.data[0].index].value\`
 *
 * This structure is designed for the following complexities:
 * - insert: 0(log(n))
 * - pop (remove smallest value in set): O(log(n))
 * - top (get smallest value in set): O(1)
 */
struct ${struct} {
    ${node}[] data;
}

struct ${node} {
    ${valueType} value;
    ${indexType} index; // position -> value
    ${indexType} lookup; // value -> position
}

/**
 * @dev Lookup the root element of the heap.
 */
function top(${struct} storage self) internal view returns (${valueType}) {
    return _unsafeNodeAccess(self, self.data[0].index).value;
}

/**
 * @dev Remove (and return) the root element for the heap using the default comparator.
 *
 * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function pop(${struct} storage self) internal returns (${valueType}) {
    return pop(self, Comparators.lt);
}

/**
 * @dev Remove (and return) the root element for the heap using the provided comparator.
 *
 * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function pop(
    ${struct} storage self,
    function(uint256, uint256) view returns (bool) comp
) internal returns (${valueType}) {
    ${indexType} size = length(self);

    if (size == 0) Panic.panic(Panic.EMPTY_ARRAY_POP);

    ${indexType} last = size - 1; // could be unchecked (check above)

    // get root location (in the data array) and value
    ${node} storage rootNode = _unsafeNodeAccess(self, 0);
    ${indexType} rootIdx = rootNode.index;
    ${node} storage rootData = _unsafeNodeAccess(self, rootIdx);
    ${node} storage lastNode = _unsafeNodeAccess(self, last);
    ${valueType} rootDataValue = rootData.value;

    // if root is not the last element of the data array (that will get pop-ed), reorder the data array.
    if (rootIdx != last) {
        // get details about the value stored in the last element of the array (that will get pop-ed)
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
    _heapifyDown(self, last, 0, lastValue, comp);

    // return root value
    return rootDataValue;
}

/**
 * @dev Insert a new element in the heap using the default comparator.
 *
 * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function insert(${struct} storage self, ${valueType} value) internal {
    insert(self, value, Comparators.lt);
}

/**
 * @dev Insert a new element in the heap using the provided comparator.
 *
 * Note: All inserting and removal from a heap should always be done using the same comparator. Mixing comparator
 * during the lifecycle of a heap will result in undefined behavior.
 */
function insert(
    ${struct} storage self,
    ${valueType} value,
    function(uint256, uint256) view returns (bool) comp
) internal {
    ${indexType} size = length(self);
    self.data.push(${struct}Node({index: size, lookup: size, value: value}));
    _heapifyUp(self, size, value, comp);
}

/**
 * @dev Returns the number of elements in the heap.
 */
function length(${struct} storage self) internal view returns (${indexType}) {
    return self.data.length.to${capitalize(indexType)}();
}

function clear(${struct} storage self) internal {
    ${struct}Node[] storage data = self.data;
    /// @solidity memory-safe-assembly
    assembly {
        sstore(data.slot, 0)
    }
}

/*
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
 * Note: This is a private function that is called in a trusted context with already cached parameters. \`length\`
 * and \`value\` could be extracted from \`self\` and \`pos\`, but that would require redundant storage read. These
 * parameters are not verified. It is the caller role to make sure the parameters are correct.
 */
function _heapifyDown(
    ${struct} storage self,
    ${indexType} size,
    ${indexType} pos,
    ${valueType} value,
    function(uint256, uint256) view returns (bool) comp
) private {
    ${indexType} left = 2 * pos + 1;
    ${indexType} right = 2 * pos + 2;

    if (right < size) {
        ${valueType} lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, left).index).value;
        ${valueType} rValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, right).index).value;
        if (comp(lValue, value) || comp(rValue, value)) {
            if (comp(lValue, rValue)) {
                _swap(self, pos, left);
                _heapifyDown(self, size, left, value, comp);
            } else {
                _swap(self, pos, right);
                _heapifyDown(self, size, right, value, comp);
            }
        }
    } else if (left < size) {
        ${valueType} lValue = _unsafeNodeAccess(self, _unsafeNodeAccess(self, left).index).value;
        if (comp(lValue, value)) {
            _swap(self, pos, left);
            _heapifyDown(self, size, left, value, comp);
        }
    }
}

/**
 * @dev Perform heap maintenance on \`self\`, starting at position \`pos\` (with the \`value\`), using \`comp\` as a
 * comparator, and moving toward the root of the underlying tree.
 *
 * Note: This is a private function that is called in a trusted context with already cached parameters. \`value\`
 * could be extracted from \`self\` and \`pos\`, but that would require redundant storage read. This parameters is not
 * verified. It is the caller role to make sure the parameters are correct.
 */
function _heapifyUp(
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
        result.slot := add(keccak256(0x00, 0x20), mul(pos, ${blockSize}))
    }
}
`;

// GENERATE
module.exports = format(
  header,
  'library Heap {',
  format(
    [].concat(
      'using SafeCast for *;',
      '',
      TYPES.map(type => generate(type)),
    ),
  ).trimEnd(),
  '}',
);
