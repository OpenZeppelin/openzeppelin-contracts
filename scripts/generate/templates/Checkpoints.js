const format = require('../format-lines');
const { OPTS } = require('./Checkpoints.opts');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";

/**
 * @dev This library defines the \`Trace*\` struct, for checkpointing values as they change at different points in
 * time, and later looking up past values by block number. See {Votes} as an example.
 *
 * To create a history of checkpoints define a variable type \`Checkpoints.Trace*\` in your contract, and store a new
 * checkpoint for the current transaction block using the {push} function.
 */
`;

const errors = `\
/**
 * @dev A value was attempted to be inserted on a past checkpoint.
 */
error CheckpointUnorderedInsertion();
`;

const template = opts => `\
struct ${opts.historyTypeName} {
    ${opts.checkpointTypeName}[] ${opts.checkpointFieldName};
}

struct ${opts.checkpointTypeName} {
    ${opts.keyTypeName} ${opts.keyFieldName};
    ${opts.valueTypeName} ${opts.valueFieldName};
}

/**
 * @dev Pushes a (\`key\`, \`value\`) pair into a ${opts.historyTypeName} so that it is stored as the checkpoint.
 *
 * Returns previous value and new value.
 *
 * IMPORTANT: Never accept \`key\` as a user input, since an arbitrary \`type(${opts.keyTypeName}).max\` key set will disable the
 * library.
 */
function push(
    ${opts.historyTypeName} storage self,
    ${opts.keyTypeName} key,
    ${opts.valueTypeName} value
) internal returns (${opts.valueTypeName} oldValue, ${opts.valueTypeName} newValue) {
    return _insert(self.${opts.checkpointFieldName}, key, value);
}

/**
 * @dev Returns the value in the first (oldest) checkpoint with key greater or equal than the search key, or zero if
 * there is none.
 */
function lowerLookup(${opts.historyTypeName} storage self, ${opts.keyTypeName} key) internal view returns (${opts.valueTypeName}) {
    uint256 len = self.${opts.checkpointFieldName}.length;
    uint256 pos = _lowerBinaryLookup(self.${opts.checkpointFieldName}, key, 0, len);
    return pos == len ? 0 : _unsafeAccess(self.${opts.checkpointFieldName}, pos).${opts.valueFieldName};
}

/**
 * @dev Returns the value in the last (most recent) checkpoint with key lower or equal than the search key, or zero
 * if there is none.
 */
function upperLookup(${opts.historyTypeName} storage self, ${opts.keyTypeName} key) internal view returns (${opts.valueTypeName}) {
    uint256 len = self.${opts.checkpointFieldName}.length;
    uint256 pos = _upperBinaryLookup(self.${opts.checkpointFieldName}, key, 0, len);
    return pos == 0 ? 0 : _unsafeAccess(self.${opts.checkpointFieldName}, pos - 1).${opts.valueFieldName};
}

/**
 * @dev Returns the value in the last (most recent) checkpoint with key lower or equal than the search key, or zero
 * if there is none.
 *
 * NOTE: This is a variant of {upperLookup} that is optimized to find "recent" checkpoint (checkpoints with high
 * keys).
 */
function upperLookupRecent(${opts.historyTypeName} storage self, ${opts.keyTypeName} key) internal view returns (${opts.valueTypeName}) {
    uint256 len = self.${opts.checkpointFieldName}.length;

    uint256 low = 0;
    uint256 high = len;

    if (len > 5) {
        uint256 mid = len - Math.sqrt(len);
        if (key < _unsafeAccess(self.${opts.checkpointFieldName}, mid)._key) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    uint256 pos = _upperBinaryLookup(self.${opts.checkpointFieldName}, key, low, high);

    return pos == 0 ? 0 : _unsafeAccess(self.${opts.checkpointFieldName}, pos - 1).${opts.valueFieldName};
}

/**
 * @dev Returns the value in the most recent checkpoint, or zero if there are no checkpoints.
 */
function latest(${opts.historyTypeName} storage self) internal view returns (${opts.valueTypeName}) {
    uint256 pos = self.${opts.checkpointFieldName}.length;
    return pos == 0 ? 0 : _unsafeAccess(self.${opts.checkpointFieldName}, pos - 1).${opts.valueFieldName};
}

/**
 * @dev Returns whether there is a checkpoint in the structure (i.e. it is not empty), and if so the key and value
 * in the most recent checkpoint.
 */
function latestCheckpoint(${opts.historyTypeName} storage self) internal view returns (bool exists, ${opts.keyTypeName} ${opts.keyFieldName}, ${opts.valueTypeName} ${opts.valueFieldName}) {
    uint256 pos = self.${opts.checkpointFieldName}.length;
    if (pos == 0) {
        return (false, 0, 0);
    } else {
        ${opts.checkpointTypeName} storage ckpt = _unsafeAccess(self.${opts.checkpointFieldName}, pos - 1);
        return (true, ckpt.${opts.keyFieldName}, ckpt.${opts.valueFieldName});
    }
}

/**
 * @dev Returns the number of checkpoints.
 */
function length(${opts.historyTypeName} storage self) internal view returns (uint256) {
    return self.${opts.checkpointFieldName}.length;
}

/**
 * @dev Returns checkpoint at given position.
 */
function at(${opts.historyTypeName} storage self, uint32 pos) internal view returns (${opts.checkpointTypeName} memory) {
    return self.${opts.checkpointFieldName}[pos];
}

/**
 * @dev Pushes a (\`key\`, \`value\`) pair into an ordered list of checkpoints, either by inserting a new checkpoint,
 * or by updating the last one.
 */
function _insert(
    ${opts.checkpointTypeName}[] storage self,
    ${opts.keyTypeName} key,
    ${opts.valueTypeName} value
) private returns (${opts.valueTypeName} oldValue, ${opts.valueTypeName} newValue) {
    uint256 pos = self.length;

    if (pos > 0) {
        ${opts.checkpointTypeName} storage last = _unsafeAccess(self, pos - 1);
        ${opts.keyTypeName} lastKey = last.${opts.keyFieldName};
        ${opts.valueTypeName} lastValue = last.${opts.valueFieldName};

        // Checkpoint keys must be non-decreasing.
        if (lastKey > key) {
            revert CheckpointUnorderedInsertion();
        }

        // Update or push new checkpoint
        if (lastKey == key) {
            last.${opts.valueFieldName} = value;
        } else {
            self.push(${opts.checkpointTypeName}({${opts.keyFieldName}: key, ${opts.valueFieldName}: value}));
        }
        return (lastValue, value);
    } else {
        self.push(${opts.checkpointTypeName}({${opts.keyFieldName}: key, ${opts.valueFieldName}: value}));
        return (0, value);
    }
}

/**
 * @dev Return the index of the first (oldest) checkpoint with key strictly bigger than the search key, or \`high\`
 * if there is none. \`low\` and \`high\` define a section where to do the search, with inclusive \`low\` and exclusive
 * \`high\`.
 *
 * WARNING: \`high\` should not be greater than the array's length.
 */
function _upperBinaryLookup(
    ${opts.checkpointTypeName}[] storage self,
    ${opts.keyTypeName} key,
    uint256 low,
    uint256 high
) private view returns (uint256) {
    while (low < high) {
        uint256 mid = Math.average(low, high);
        if (_unsafeAccess(self, mid).${opts.keyFieldName} > key) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }
    return high;
}

/**
 * @dev Return the index of the first (oldest) checkpoint with key greater or equal than the search key, or \`high\`
 * if there is none. \`low\` and \`high\` define a section where to do the search, with inclusive \`low\` and exclusive
 * \`high\`.
 *
 * WARNING: \`high\` should not be greater than the array's length.
 */
function _lowerBinaryLookup(
    ${opts.checkpointTypeName}[] storage self,
    ${opts.keyTypeName} key,
    uint256 low,
    uint256 high
) private view returns (uint256) {
    while (low < high) {
        uint256 mid = Math.average(low, high);
        if (_unsafeAccess(self, mid).${opts.keyFieldName} < key) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return high;
}

/**
 * @dev Access an element of the array without performing bounds check. The position is assumed to be within bounds.
 */
function _unsafeAccess(
    ${opts.checkpointTypeName}[] storage self,
    uint256 pos
) private pure returns (${opts.checkpointTypeName} storage result) {
    assembly {
        mstore(0, self.slot)
        result.slot := add(keccak256(0, 0x20), pos)
    }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Checkpoints {',
  format(
    [].concat(
      errors,
      OPTS.map(opts => template(opts)),
    ),
  ).trimEnd(),
  '}',
);
