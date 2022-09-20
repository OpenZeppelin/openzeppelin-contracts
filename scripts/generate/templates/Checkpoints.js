const format = require('../format-lines');

const VALUE_SIZES = [ 224, 160 ];

const header = `\
pragma solidity ^0.8.0;

import "./math/Math.sol";
import "./math/SafeCast.sol";

/**
 * @dev This library defines the \`History\` struct, for checkpointing values as they change at different points in
 * time, and later looking up past values by block number. See {Votes} as an example.
 *
 * To create a history of checkpoints define a variable type \`Checkpoints.History\` in your contract, and store a new
 * checkpoint for the current transaction block using the {push} function.
 *
 * _Available since v4.5._
 */
`;

const types = opts => `\
struct ${opts.historyTypeName} {
    ${opts.checkpointTypeName}[] ${opts.checkpointFieldName};
}

struct ${opts.checkpointTypeName} {
    ${opts.keyTypeName} ${opts.keyFieldName};
    ${opts.valueTypeName} ${opts.valueFieldName};
}
`;

/* eslint-disable max-len */
const operations = opts => `\
/**
 * @dev Pushes a (\`key\`, \`value\`) pair into a ${opts.historyTypeName} so that it is stored as the checkpoint.
 *
 * Returns previous value and new value.
 */
function push(
    ${opts.historyTypeName} storage self,
    ${opts.keyTypeName} key,
    ${opts.valueTypeName} value
) internal returns (${opts.valueTypeName}, ${opts.valueTypeName}) {
    return _insert(self.${opts.checkpointFieldName}, key, value);
}

/**
 * @dev Returns the value in the oldest checkpoint with key greater or equal than the search key, or zero if there is none.
 */
function lowerLookup(${opts.historyTypeName} storage self, ${opts.keyTypeName} key) internal view returns (${opts.valueTypeName}) {
    uint256 len = self.${opts.checkpointFieldName}.length;
    uint256 pos = _lowerBinaryLookup(self.${opts.checkpointFieldName}, key, 0, len);
    return pos == len ? 0 : _unsafeAccess(self.${opts.checkpointFieldName}, pos).${opts.valueFieldName};
}

/**
 * @dev Returns the value in the most recent checkpoint with key lower or equal than the search key.
 */
function upperLookup(${opts.historyTypeName} storage self, ${opts.keyTypeName} key) internal view returns (${opts.valueTypeName}) {
    uint256 len = self.${opts.checkpointFieldName}.length;
    uint256 pos = _upperBinaryLookup(self.${opts.checkpointFieldName}, key, 0, len);
    return pos == 0 ? 0 : _unsafeAccess(self.${opts.checkpointFieldName}, pos - 1).${opts.valueFieldName};
}
`;

const legacyOperations = opts => `\
/**
 * @dev Returns the value at a given block number. If a checkpoint is not available at that block, the closest one
 * before it is returned, or zero otherwise.
 */
function getAtBlock(${opts.historyTypeName} storage self, uint256 blockNumber) internal view returns (uint256) {
    require(blockNumber < block.number, "Checkpoints: block not yet mined");
    uint32 key = SafeCast.toUint32(blockNumber);

    uint256 len = self.${opts.checkpointFieldName}.length;
    uint256 pos = _upperBinaryLookup(self.${opts.checkpointFieldName}, key, 0, len);
    return pos == 0 ? 0 : _unsafeAccess(self.${opts.checkpointFieldName}, pos - 1).${opts.valueFieldName};
}

/**
 * @dev Returns the value at a given block number. If a checkpoint is not available at that block, the closest one
 * before it is returned, or zero otherwise. Similar to {upperLookup} but optimized for the case when the searched
 * checkpoint is probably "recent", defined as being among the last sqrt(N) checkpoints where N is the number of
 * checkpoints.
 */
function getAtProbablyRecentBlock(${opts.historyTypeName} storage self, uint256 blockNumber) internal view returns (uint256) {
    require(blockNumber < block.number, "Checkpoints: block not yet mined");
    uint32 key = SafeCast.toUint32(blockNumber);

    uint256 len = self.${opts.checkpointFieldName}.length;

    uint256 low = 0;
    uint256 high = len;

    if (len > 5) {
        uint256 mid = len - Math.sqrt(len);
        if (key < _unsafeAccess(self.${opts.checkpointFieldName}, mid)._blockNumber) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    uint256 pos = _upperBinaryLookup(self.${opts.checkpointFieldName}, key, low, high);

    return pos == 0 ? 0 : _unsafeAccess(self.${opts.checkpointFieldName}, pos - 1).${opts.valueFieldName};
}

/**
 * @dev Pushes a value onto a History so that it is stored as the checkpoint for the current block.
 *
 * Returns previous value and new value.
 */
function push(${opts.historyTypeName} storage self, uint256 value) internal returns (uint256, uint256) {
    return _insert(self.${opts.checkpointFieldName}, SafeCast.toUint32(block.number), SafeCast.toUint224(value));
}

/**
 * @dev Pushes a value onto a History, by updating the latest value using binary operation \`op\`. The new value will
 * be set to \`op(latest, delta)\`.
 *
 * Returns previous value and new value.
 */
function push(
    ${opts.historyTypeName} storage self,
    function(uint256, uint256) view returns (uint256) op,
    uint256 delta
) internal returns (uint256, uint256) {
    return push(self, op(latest(self), delta));
}
`;

const common = opts => `\
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
function latestCheckpoint(${opts.historyTypeName} storage self)
    internal
    view
    returns (
        bool exists,
        ${opts.keyTypeName} ${opts.keyFieldName},
        ${opts.valueTypeName} ${opts.valueFieldName}
    )
{
    uint256 pos = self.${opts.checkpointFieldName}.length;
    if (pos == 0) {
        return (false, 0, 0);
    } else {
        ${opts.checkpointTypeName} memory ckpt = _unsafeAccess(self.${opts.checkpointFieldName}, pos - 1);
        return (true, ckpt.${opts.keyFieldName}, ckpt.${opts.valueFieldName});
    }
}

/**
 * @dev Returns the number of checkpoint.
 */
function length(${opts.historyTypeName} storage self) internal view returns (uint256) {
    return self.${opts.checkpointFieldName}.length;
}

/**
 * @dev Pushes a (\`key\`, \`value\`) pair into an ordered list of checkpoints, either by inserting a new checkpoint,
 * or by updating the last one.
 */
function _insert(
    ${opts.checkpointTypeName}[] storage self,
    ${opts.keyTypeName} key,
    ${opts.valueTypeName} value
) private returns (${opts.valueTypeName}, ${opts.valueTypeName}) {
    uint256 pos = self.length;

    if (pos > 0) {
        // Copying to memory is important here.
        ${opts.checkpointTypeName} memory last = _unsafeAccess(self, pos - 1);

        // Checkpoints keys must be increasing.
        require(last.${opts.keyFieldName} <= key, "Checkpoint: invalid key");

        // Update or push new checkpoint
        if (last.${opts.keyFieldName} == key) {
            _unsafeAccess(self, pos - 1).${opts.valueFieldName} = value;
        } else {
            self.push(${opts.checkpointTypeName}({${opts.keyFieldName}: key, ${opts.valueFieldName}: value}));
        }
        return (last.${opts.valueFieldName}, value);
    } else {
        self.push(${opts.checkpointTypeName}({${opts.keyFieldName}: key, ${opts.valueFieldName}: value}));
        return (0, value);
    }
}

/**
 * @dev Return the index of the oldest checkpoint whose key is greater than the search key, or \`high\` if there is none.
 * \`low\` and \`high\` define a section where to do the search, with inclusive \`low\` and exclusive \`high\`.
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
 * @dev Return the index of the oldest checkpoint whose key is greater or equal than the search key, or \`high\` if there is none.
 * \`low\` and \`high\` define a section where to do the search, with inclusive \`low\` and exclusive \`high\`.
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

function _unsafeAccess(${opts.checkpointTypeName}[] storage self, uint256 pos)
    private
    pure
    returns (${opts.checkpointTypeName} storage result)
{
    assembly {
        mstore(0, self.slot)
        result.slot := add(keccak256(0, 0x20), pos)
    }
}
`;
/* eslint-enable max-len */

// OPTIONS
const defaultOpts = (size) => ({
  historyTypeName: `Trace${size}`,
  checkpointTypeName: `Checkpoint${size}`,
  checkpointFieldName: '_checkpoints',
  keyTypeName: `uint${256 - size}`,
  keyFieldName: '_key',
  valueTypeName: `uint${size}`,
  valueFieldName: '_value',
});

const OPTS = VALUE_SIZES.map(size => defaultOpts(size));

const LEGACY_OPTS = {
  ...defaultOpts(224),
  historyTypeName: 'History',
  checkpointTypeName: 'Checkpoint',
  keyFieldName: '_blockNumber',
};

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Checkpoints {',
  [
    // Legacy types & functions
    types(LEGACY_OPTS),
    legacyOperations(LEGACY_OPTS),
    common(LEGACY_OPTS),
    // New flavors
    ...OPTS.flatMap(opts => [
      types(opts),
      operations(opts),
      common(opts),
    ]),
  ],
  '}',
);
