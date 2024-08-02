const format = require('../format-lines');
const { capitalize } = require('../../helpers');
const { OPTS } = require('./Checkpoints.opts.js');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Checkpoints} from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
`;

const template = opts => `\
using Checkpoints for Checkpoints.${opts.historyTypeName};

// Maximum gap between keys used during the fuzzing tests: the \`_prepareKeys\` function with make sure that
// key#n+1 is in the [key#n, key#n + _KEY_MAX_GAP] range.
uint8 internal constant _KEY_MAX_GAP = 64;

Checkpoints.${opts.historyTypeName} internal _ckpts;

// helpers
function _bound${capitalize(opts.keyTypeName)}(${opts.keyTypeName} x, ${opts.keyTypeName} min, ${
  opts.keyTypeName
} max) internal pure returns (${opts.keyTypeName}) {
    return SafeCast.to${capitalize(opts.keyTypeName)}(bound(uint256(x), uint256(min), uint256(max)));
}

function _prepareKeys(${opts.keyTypeName}[] memory keys, ${opts.keyTypeName} maxSpread) internal pure {
    ${opts.keyTypeName} lastKey = 0;
    for (uint256 i = 0; i < keys.length; ++i) {
        ${opts.keyTypeName} key = _bound${capitalize(opts.keyTypeName)}(keys[i], lastKey, lastKey + maxSpread);
        keys[i] = key;
        lastKey = key;
    }
}

function _assertLatestCheckpoint(bool exist, ${opts.keyTypeName} key, ${opts.valueTypeName} value) internal {
    (bool _exist, ${opts.keyTypeName} _key, ${opts.valueTypeName} _value) = _ckpts.latestCheckpoint();
    assertEq(_exist, exist);
    assertEq(_key, key);
    assertEq(_value, value);
}

// tests
function testPush(${opts.keyTypeName}[] memory keys, ${opts.valueTypeName}[] memory values, ${
  opts.keyTypeName
} pastKey) public {
    vm.assume(values.length > 0 && values.length <= keys.length);
    _prepareKeys(keys, _KEY_MAX_GAP);

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
        _ckpts.push(key, value);

        // check length & latest
        assertEq(_ckpts.length(), i + 1 - duplicates);
        assertEq(_ckpts.latest(), value);
        _assertLatestCheckpoint(true, key, value);
    }

    if (keys.length > 0) {
        ${opts.keyTypeName} lastKey = keys[keys.length - 1];
        if (lastKey > 0) {
            pastKey = _bound${capitalize(opts.keyTypeName)}(pastKey, 0, lastKey - 1);

            vm.expectRevert();
            this.push(pastKey, values[keys.length % values.length]);
        }
    }
}

// used to test reverts
function push(${opts.keyTypeName} key, ${opts.valueTypeName} value) external {
    _ckpts.push(key, value);
}

function testLookup(${opts.keyTypeName}[] memory keys, ${opts.valueTypeName}[] memory values, ${
  opts.keyTypeName
} lookup) public {
    vm.assume(values.length > 0 && values.length <= keys.length);
    _prepareKeys(keys, _KEY_MAX_GAP);

    ${opts.keyTypeName} lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
    lookup = _bound${capitalize(opts.keyTypeName)}(lookup, 0, lastKey + _KEY_MAX_GAP);

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
        // find the first key that is not smaller than the lookup key
        if (key >= lookup && (i == 0 || keys[i - 1] < lookup)) {
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

// GENERATE
module.exports = format(
  header,
  ...OPTS.flatMap(opts => [
    `contract Checkpoints${opts.historyTypeName}Test is Test {`,
    [template(opts).trimEnd()],
    '}',
    '',
  ]),
);
