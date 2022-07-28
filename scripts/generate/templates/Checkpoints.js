const format = require('../format-lines');

const LENGTHS = [ 224, 160 ];

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

const legacy = () => `\
struct History {
    Checkpoint224[] _checkpoints;
}

/**
 * @dev Returns the value in the latest checkpoint, or zero if there are no checkpoints.
 */
function latest(History storage self) internal view returns (uint256) {
    return latest(self._checkpoints);
}

/**
 * @dev Returns the value at a given block number. If a checkpoint is not available at that block, the closest one
 * before it is returned, or zero otherwise.
 */
function getAtBlock(History storage self, uint256 blockNumber) internal view returns (uint256) {
    require(blockNumber < block.number, "Checkpoints: block not yet mined");

    return upperLookupRecent(self._checkpoints, SafeCast.toUint32(blockNumber));
}

/**
 * @dev Pushes a value onto a History so that it is stored as the checkpoint for the current block.
 *
 * Returns previous value and new value.
 */
function push(History storage self, uint256 value) internal returns (uint256, uint256) {
    return push(self._checkpoints, SafeCast.toUint32(block.number), SafeCast.toUint224(value));
}

/**
 * @dev Pushes a value onto a History, by updating the latest value using binary operation \`op\`. The new value will
 * be set to \`op(latest, delta)\`.
 *
 * Returns previous value and new value.
 */
function push(
    History storage self,
    function(uint256, uint256) view returns (uint256) op,
    uint256 delta
) internal returns (uint256, uint256) {
    return push(self, op(latest(self), delta));
}
`;

/* eslint-disable max-len */
const checkpoint = length => `\
struct Checkpoint${length} {
    uint${256 - length} _key;
    uint${length} _value;
}

function latest(Checkpoint${length}[] storage self) internal view returns (uint${length}) {
    uint256 pos = self.length;
    return pos == 0 ? 0 : self[pos - 1]._value;
}

function push(
    Checkpoint${length}[] storage self,
    uint${256 - length} key,
    uint${length} value
) internal returns (uint${length}, uint${length}) {
    uint256 pos = self.length;
    uint${length} old = latest(self);
    if (pos > 0 && self[pos - 1]._key == key) {
        self[pos - 1]._value = value;
    } else {
        self.push(Checkpoint${length}({_key: key, _value: value}));
    }
    return (old, value);
}

function lowerLookup(Checkpoint${length}[] storage self, uint${256 - length} key) internal view returns (uint${length}) {
    uint256 length = self.length;
    uint256 pos = _lowerDichotomicLookup(self, key, 0, length);
    return pos == length ? 0 : self[pos]._value;
}

function upperLookup(Checkpoint${length}[] storage self, uint${256 - length} key) internal view returns (uint${length}) {
    uint256 length = self.length;
    uint256 pos = _upperDichotomicLookup(self, key, 0, length);
    return pos == 0 ? 0 : self[pos - 1]._value;
}

function upperLookupRecent(Checkpoint${length}[] storage self, uint${256 - length} key) internal view returns (uint224) {
    uint256 length = self.length;
    uint256 offset = 1;

    while (offset <= length && self[length - offset]._key > key) {
        offset <<= 1;
    }

    uint256 low = offset < length ? length - offset : 0;
    uint256 high = length - (offset >> 1);
    uint256 pos = _upperDichotomicLookup(self, key, low, high);

    return pos == 0 ? 0 : self[pos - 1]._value;
}

function _upperDichotomicLookup(
    Checkpoint${length}[] storage self,
    uint${256 - length} key,
    uint256 low,
    uint256 high
) private view returns (uint256) {
    while (low < high) {
        uint256 mid = Math.average(low, high);
        if (self[mid]._key > key) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }
    return high;
}

function _lowerDichotomicLookup(
    Checkpoint${length}[] storage self,
    uint${256 - length} key,
    uint256 low,
    uint256 high
) private view returns (uint256) {
    while (low < high) {
        uint256 mid = Math.average(low, high);
        if (self[mid]._key < key) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return high;
}
`;
/* eslint-enable max-len */

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Checkpoints {',
  [
    ...LENGTHS.map(checkpoint),
    legacy().trimEnd(),
  ],
  '}',
);
