const format = require('../../format-lines');
const { capitalize } = require('../../../helpers');

const VALUE_SIZES = [224, 160];

// TEMPLATE
const header = `\
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../contracts/utils/Checkpoints.sol";
import "../../contracts/utils/math/SafeCast.sol";
`;

/* eslint-disable max-len */
const common = ({ structType, keyType, valueType }) => `\
using Checkpoints for Checkpoints.${structType};

Checkpoints.${structType} internal _ckpts;

// helpers
function _bound${capitalize(keyType)}(${keyType} x, ${keyType} min, ${keyType} max) internal view returns (${keyType}) {
    return SafeCast.to${capitalize(keyType)}(bound(uint256(x), uint256(min), uint256(max)));
}

function _prepareKeys(${keyType}[] memory keys, ${keyType} maxSpread) internal view {
    ${keyType} lastKey = 0;
    for (${keyType} i = 0; i < keys.length; ++i) {
        ${keyType} key = _bound${capitalize(keyType)}(keys[i], lastKey, lastKey + maxSpread);
        keys[i] = key;
        lastKey = key;
    }
}

function _assertLatestCheckpoint(
    bool exist,
    ${keyType} key,
    ${valueType} value
) internal {
    (bool _exist, ${keyType} _key, ${valueType} _value) = _ckpts.latestCheckpoint();
    assertTrue(_exist == exist);
    assertTrue(_key == key);
    assertTrue(_value == value);
}
`;

const traceXXX = ({ keyType, valueType }) => `\
// tests
function testPush(${keyType}[] memory keys, ${valueType}[] memory values) public {
    vm.assume(values.length > 0);
    _prepareKeys(keys, 64);

    // initial state
    assertTrue(_ckpts.length() == 0);
    assertTrue(_ckpts.latest() == 0);
    _assertLatestCheckpoint(false, 0, 0);

    ${keyType} duplicates = 0;
    for (${keyType} i = 0; i < keys.length; ++i) {
        ${keyType} key = keys[i];
        ${valueType} value = values[i % values.length];
        if (i > 0 && key == keys[i-1]) ++duplicates;

        // push
        _ckpts.push(key, value);

        // check length & latest
        assertTrue(_ckpts.length() == i + 1 - duplicates);
        assertTrue(_ckpts.latest() == value);
        _assertLatestCheckpoint(true, key, value);
    }
}

function testLookup(${keyType}[] memory keys, ${valueType}[] memory values, ${keyType} lookup) public {
    vm.assume(values.length > 0);
    _prepareKeys(keys, 64);

    ${keyType} lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
    lookup = _bound${capitalize(keyType)}(lookup, 0, lastKey + 64);

    ${valueType} upper = 0;
    ${valueType} lower = 0;
    ${keyType} lowerKey = type(${keyType}).max;
    for (${keyType} i = 0; i < keys.length; ++i) {
        ${keyType} key = keys[i];
        ${valueType} value = values[i % values.length];

        // push
        _ckpts.push(key, value);

        // track expected result of lookups
        if (key <= lookup) {
            upper = value;
        }
        if (key >= lookup && (i == 0 || keys[i-1] < lookup)) {
            lowerKey = key;
        }
        if (key == lowerKey) {
            lower = value;
        }
    }

    // check lookup
    assertTrue(_ckpts.lowerLookup(lookup) == lower);
    assertTrue(_ckpts.upperLookup(lookup) == upper);
    assertTrue(_ckpts.upperLookupRecent(lookup) == upper);
}
`;

const history = () => `\
// tests
function testPush(uint32[] memory keys, uint224[] memory values) public {
    vm.assume(values.length > 0);
    _prepareKeys(keys, 64);

    // initial state
    assertTrue(_ckpts.length() == 0);
    assertTrue(_ckpts.latest() == 0);
    _assertLatestCheckpoint(false, 0, 0);

    uint32 duplicates = 0;
    for (uint32 i = 0; i < keys.length; ++i) {
        uint32 key = keys[i];
        uint224 value = values[i % values.length];
        if (i > 0 && key == keys[i - 1]) ++duplicates;

        // push
        vm.roll(key);
        _ckpts.push(value);

        // check length & latest
        assertTrue(_ckpts.length() == i + 1 - duplicates);
        assertTrue(_ckpts.latest() == value);
        _assertLatestCheckpoint(true, key, value);
    }
}

function testLookup(uint32[] memory keys, uint224[] memory values, uint32 lookup) public {
    vm.assume(keys.length > 0);
    vm.assume(values.length > 0);
    _prepareKeys(keys, 64);

    uint32 lastKey = keys[keys.length - 1];
    vm.assume(lastKey > 0);
    lookup = _boundUint32(lookup, 0, lastKey - 1);

    uint224 upper = 0;
    for (uint32 i = 0; i < keys.length; ++i) {
        uint32 key = keys[i];
        uint224 value = values[i % values.length];

        // push
        vm.roll(key);
        _ckpts.push(value);

        // track expected result of lookups
        if (key <= lookup) {
            upper = value;
        }
    }

    // check lookup
    assertTrue(_ckpts.getAtBlock(lookup) == upper);
    assertTrue(_ckpts.getAtProbablyRecentBlock(lookup) == upper);

    vm.expectRevert(); _ckpts.getAtBlock(lastKey);
    vm.expectRevert(); _ckpts.getAtBlock(lastKey + 1);
    vm.expectRevert(); _ckpts.getAtProbablyRecentBlock(lastKey);
    vm.expectRevert(); _ckpts.getAtProbablyRecentBlock(lastKey + 1);
}
`;
/* eslint-enable max-len */

// GENERATE
module.exports = format(
  header,
  // HISTORY
  'contract CheckpointsHistoryTest is Test {',
  [common({ structType: 'History', keyType: 'uint32', valueType: 'uint224' }), history()],
  '}',
  // TRACEXXX
  ...VALUE_SIZES.flatMap(length => [
    `contract CheckpointsTrace${length}Test is Test {`,
    [
      common({ structType: `Trace${length}`, keyType: `uint${256 - length}`, valueType: `uint${length}` }),
      traceXXX({ structType: `Trace${length}`, keyType: `uint${256 - length}`, valueType: `uint${length}` }),
    ],
    '}',
  ]),
);
