const format = require('../../format-lines');

const VALUE_SIZES = [224, 160];

// TEMPLATE
const header = `\
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../contracts/utils/Checkpoints.sol";
`;

/* eslint-disable max-len */
const common = ({ structType, keyType, valueType }) => `\
using Checkpoints for Checkpoints.${structType};

Checkpoints.${structType} internal instance;

// helpers
function bound_${keyType}(${keyType} x, ${keyType} min, ${keyType} max) internal view returns (${keyType}) {
    return ${keyType}(bound(uint256(x), uint256(min), uint256(max)));
}

function prepareKeys(${keyType}[] memory keys, ${keyType} maxSpread) private view {
    ${keyType} lastKey = 0;
    for (${keyType} i = 0; i < keys.length; ++i) {
        ${keyType} key = bound_${keyType}(keys[i], lastKey, lastKey + maxSpread);
        keys[i] = key;
        lastKey = key;
    }
}

function assertLatestCheckpoint(
    bool exist,
    ${keyType} key,
    ${valueType} value
) internal {
    (bool _exist, ${keyType} _key, ${valueType} _value) = instance.latestCheckpoint();
    assertTrue(_exist == exist);
    assertTrue(_key == key);
    assertTrue(_value == value);
}
`;

const traceXXX = ({ keyType, valueType }) => `\
// tests
function testPush(${keyType}[] memory keys, ${valueType}[] memory values) public {
    vm.assume(values.length > 0);
    prepareKeys(keys, 64);

    // initial state
    assertTrue(instance.length() == 0);
    assertTrue(instance.latest() == 0);
    assertLatestCheckpoint(false, 0, 0);

    ${keyType} duplicates = 0;
    for (${keyType} i = 0; i < keys.length; ++i) {
        ${keyType} key = keys[i];
        ${valueType} value = values[i % values.length];
        if (i > 0 && key == keys[i-1]) ++duplicates;

        // push
        instance.push(key, value);

        // check length & latest
        assertTrue(instance.length() == i + 1 - duplicates);
        assertTrue(instance.latest() == value);
        assertLatestCheckpoint(true, key, value);
    }
}

function testLookup(${keyType}[] memory keys, ${valueType}[] memory values, ${keyType} lookup) public {
    vm.assume(values.length > 0);
    prepareKeys(keys, 64);

    ${keyType} lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
    lookup = bound_${keyType}(lookup, 0, lastKey + 64);

    ${valueType} upper = 0;
    ${valueType} lower = 0;
    ${keyType} lowerKey = type(${keyType}).max;
    for (${keyType} i = 0; i < keys.length; ++i) {
        ${keyType} key = keys[i];
        ${valueType} value = values[i % values.length];

        // push
        instance.push(key, value);

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
    assertTrue(instance.lowerLookup(lookup) == lower);
    assertTrue(instance.upperLookup(lookup) == upper);
    assertTrue(instance.upperLookupRecent(lookup) == upper);
}
`;

const history = () => `\
// tests
function testPush(uint32[] memory keys, uint224[] memory values) public {
    vm.assume(values.length > 0);
    prepareKeys(keys, 64);

    // initial state
    assertTrue(instance.length() == 0);
    assertTrue(instance.latest() == 0);
    assertLatestCheckpoint(false, 0, 0);

    uint32 duplicates = 0;
    for (uint32 i = 0; i < keys.length; ++i) {
        uint32 key = keys[i];
        uint224 value = values[i % values.length];
        if (i > 0 && key == keys[i - 1]) ++duplicates;

        // push
        vm.roll(key);
        instance.push(value);

        // check length & latest
        assertTrue(instance.length() == i + 1 - duplicates);
        assertTrue(instance.latest() == value);
        assertLatestCheckpoint(true, key, value);
    }
}

function testLookup(uint32[] memory keys, uint224[] memory values, uint32 lookup) public {
    vm.assume(keys.length > 0);
    vm.assume(values.length > 0);
    prepareKeys(keys, 64);

    uint32 lastKey = keys[keys.length - 1];
    vm.assume(lastKey > 0);
    lookup = bound_uint32(lookup, 0, lastKey - 1);

    uint224 upper = 0;
    for (uint32 i = 0; i < keys.length; ++i) {
        uint32 key = keys[i];
        uint224 value = values[i % values.length];

        // push
        vm.roll(key);
        instance.push(value);

        // track expected result of lookups
        if (key <= lookup) {
            upper = value;
        }
    }

    // check lookup
    assertTrue(instance.getAtBlock(lookup) == upper);
    assertTrue(instance.getAtProbablyRecentBlock(lookup) == upper);

    vm.expectRevert(); instance.getAtBlock(lastKey);
    vm.expectRevert(); instance.getAtBlock(lastKey + 1);
    vm.expectRevert(); instance.getAtProbablyRecentBlock(lastKey);
    vm.expectRevert(); instance.getAtProbablyRecentBlock(lastKey + 1);
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
