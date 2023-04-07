const format = require('../format-lines');
const { capitalize } = require('../../helpers');
const { OPTS, LEGACY_OPTS } = require('./Checkpoints.opts.js');

// TEMPLATE
const header = `\
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../contracts/utils/Checkpoints.sol";
import "../../contracts/utils/math/SafeCast.sol";
`;

/* eslint-disable max-len */
const common = opts => `\
using Checkpoints for Checkpoints.${opts.historyTypeName};

uint8 internal constant KEY_MAX_GAP = 64;

Checkpoints.${opts.historyTypeName} internal _ckpts;

// helpers
function _bound${capitalize(opts.keyTypeName)}(
    ${opts.keyTypeName} x,
    ${opts.keyTypeName} min,
    ${opts.keyTypeName} max
) internal view returns (${opts.keyTypeName}) {
    return SafeCast.to${capitalize(opts.keyTypeName)}(bound(uint256(x), uint256(min), uint256(max)));
}

function _prepareKeys(
    ${opts.keyTypeName}[] memory keys,
    ${opts.keyTypeName} maxSpread
) internal view {
    ${opts.keyTypeName} lastKey = 0;
    for (uint256 i = 0; i < keys.length; ++i) {
        ${opts.keyTypeName} key = _bound${capitalize(opts.keyTypeName)}(keys[i], lastKey, lastKey + maxSpread);
        keys[i] = key;
        lastKey = key;
    }
}

function _assertLatestCheckpoint(
    bool exist,
    ${opts.keyTypeName} key,
    ${opts.valueTypeName} value
) internal {
    (bool _exist, ${opts.keyTypeName} _key, ${opts.valueTypeName} _value) = _ckpts.latestCheckpoint();
    assertEq(_exist, exist);
    assertEq(_key, key);
    assertEq(_value, value);
}
`;

const testTrace = opts => `\
// tests
function testPush(
    ${opts.keyTypeName}[] memory keys,
    ${opts.valueTypeName}[] memory values
) public {
    vm.assume(values.length > 0 && values.length <= keys.length);
    _prepareKeys(keys, KEY_MAX_GAP);

    // initial state
    assertEq(_ckpts.length(), 0);
    assertEq(_ckpts.latest(), 0);
    _assertLatestCheckpoint(false, 0, 0);

    uint256 duplicates = 0;
    for (uint256 i = 0; i < keys.length; ++i) {
        ${opts.keyTypeName} key = keys[i];
        ${opts.valueTypeName} value = values[i % values.length];
        if (i > 0 && key == keys[i-1]) ++duplicates;

        // push
        _ckpts.push(key, value);

        // check length & latest
        assertEq(_ckpts.length(), i + 1 - duplicates);
        assertEq(_ckpts.latest(), value);
        _assertLatestCheckpoint(true, key, value);
    }
}

function testLookup(
    ${opts.keyTypeName}[] memory keys,
    ${opts.valueTypeName}[] memory values,
    ${opts.keyTypeName} lookup
) public {
    vm.assume(values.length > 0 && values.length <= keys.length);
    _prepareKeys(keys, KEY_MAX_GAP);

    ${opts.keyTypeName} lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
    lookup = _bound${capitalize(opts.keyTypeName)}(lookup, 0, lastKey + KEY_MAX_GAP);

    ${opts.valueTypeName} upper = 0;
    ${opts.valueTypeName} lower = 0;
    ${opts.keyTypeName} lowerKey = type(${opts.keyTypeName}).max;
    for (uint256 i = 0; i < keys.length; ++i) {
        ${opts.keyTypeName} key = keys[i];
        ${opts.valueTypeName} value = values[i % values.length];

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
    assertEq(_ckpts.lowerLookup(lookup), lower);
    assertEq(_ckpts.upperLookup(lookup), upper);
    assertEq(_ckpts.upperLookupRecent(lookup), upper);
}
`;

const testHistory = opts => `\
// tests
function testPush(
    ${opts.keyTypeName}[] memory keys,
    ${opts.valueTypeName}[] memory values
) public {
    vm.assume(values.length > 0 && values.length <= keys.length);
    _prepareKeys(keys, KEY_MAX_GAP);

    // initial state
    assertEq(_ckpts.length(), 0);
    assertEq(_ckpts.latest(), 0);
    _assertLatestCheckpoint(false, 0, 0);

    uint256 duplicates = 0;
    for (uint256 i = 0; i < keys.length; ++i) {
        ${opts.keyTypeName} key = keys[i];
        ${opts.valueTypeName} value = values[i % values.length];
        if (i > 0 && key == keys[i - 1]) ++duplicates;

        // push
        vm.roll(key);
        _ckpts.push(value);

        // check length & latest
        assertEq(_ckpts.length(), i + 1 - duplicates);
        assertEq(_ckpts.latest(), value);
        _assertLatestCheckpoint(true, key, value);
    }
}

function testLookup(
    ${opts.keyTypeName}[] memory keys,
    ${opts.valueTypeName}[] memory values,
    ${opts.keyTypeName} lookup
) public {
    vm.assume(keys.length > 0);
    vm.assume(values.length > 0 && values.length <= keys.length);
    _prepareKeys(keys, KEY_MAX_GAP);

    ${opts.keyTypeName} lastKey = keys[keys.length - 1];
    vm.assume(lastKey > 0);
    lookup = _bound${capitalize(opts.keyTypeName)}(lookup, 0, lastKey - 1);

    ${opts.valueTypeName} upper = 0;
    for (uint256 i = 0; i < keys.length; ++i) {
        ${opts.keyTypeName} key = keys[i];
        ${opts.valueTypeName} value = values[i % values.length];

        // push
        vm.roll(key);
        _ckpts.push(value);

        // track expected result of lookups
        if (key <= lookup) {
            upper = value;
        }
    }

    // check lookup
    assertEq(_ckpts.getAtBlock(lookup), upper);
    assertEq(_ckpts.getAtProbablyRecentBlock(lookup), upper);

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
  `contract Checkpoints${LEGACY_OPTS.historyTypeName}Test is Test {`,
  [common(LEGACY_OPTS), testHistory(LEGACY_OPTS)],
  '}',
  // TRACEXXX
  ...OPTS.flatMap(opts => [
    `contract Checkpoints${opts.historyTypeName}Test is Test {`,
    [common(opts), testTrace(opts)],
    '}',
  ]),
);
