// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Checkpoints.test.js.

pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../contracts/utils/Checkpoints.sol";
import "../../contracts/utils/math/SafeCast.sol";

contract CheckpointsHistoryTest is Test {
    using Checkpoints for Checkpoints.History;

    Checkpoints.History internal _ckpts;

    // helpers
    function _boundUint32(uint32 x, uint32 min, uint32 max) internal view returns (uint32) {
        return SafeCast.toUint32(bound(uint256(x), uint256(min), uint256(max)));
    }

    function _prepareKeys(uint32[] memory keys, uint32 maxSpread) internal view {
        uint32 lastKey = 0;
        for (uint32 i = 0; i < keys.length; ++i) {
            uint32 key = _boundUint32(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint32 key, uint224 value) internal {
        (bool _exist, uint32 _key, uint224 _value) = _ckpts.latestCheckpoint();
        assertTrue(_exist == exist);
        assertTrue(_key == key);
        assertTrue(_value == value);
    }

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

        vm.expectRevert();
        _ckpts.getAtBlock(lastKey);
        vm.expectRevert();
        _ckpts.getAtBlock(lastKey + 1);
        vm.expectRevert();
        _ckpts.getAtProbablyRecentBlock(lastKey);
        vm.expectRevert();
        _ckpts.getAtProbablyRecentBlock(lastKey + 1);
    }
}

contract CheckpointsTrace224Test is Test {
    using Checkpoints for Checkpoints.Trace224;

    Checkpoints.Trace224 internal _ckpts;

    // helpers
    function _boundUint32(uint32 x, uint32 min, uint32 max) internal view returns (uint32) {
        return SafeCast.toUint32(bound(uint256(x), uint256(min), uint256(max)));
    }

    function _prepareKeys(uint32[] memory keys, uint32 maxSpread) internal view {
        uint32 lastKey = 0;
        for (uint32 i = 0; i < keys.length; ++i) {
            uint32 key = _boundUint32(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint32 key, uint224 value) internal {
        (bool _exist, uint32 _key, uint224 _value) = _ckpts.latestCheckpoint();
        assertTrue(_exist == exist);
        assertTrue(_key == key);
        assertTrue(_value == value);
    }

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
            _ckpts.push(key, value);

            // check length & latest
            assertTrue(_ckpts.length() == i + 1 - duplicates);
            assertTrue(_ckpts.latest() == value);
            _assertLatestCheckpoint(true, key, value);
        }
    }

    function testLookup(uint32[] memory keys, uint224[] memory values, uint32 lookup) public {
        vm.assume(values.length > 0);
        _prepareKeys(keys, 64);

        uint32 lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
        lookup = _boundUint32(lookup, 0, lastKey + 64);

        uint224 upper = 0;
        uint224 lower = 0;
        uint32 lowerKey = type(uint32).max;
        for (uint32 i = 0; i < keys.length; ++i) {
            uint32 key = keys[i];
            uint224 value = values[i % values.length];

            // push
            _ckpts.push(key, value);

            // track expected result of lookups
            if (key <= lookup) {
                upper = value;
            }
            if (key >= lookup && (i == 0 || keys[i - 1] < lookup)) {
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
}

contract CheckpointsTrace160Test is Test {
    using Checkpoints for Checkpoints.Trace160;

    Checkpoints.Trace160 internal _ckpts;

    // helpers
    function _boundUint96(uint96 x, uint96 min, uint96 max) internal view returns (uint96) {
        return SafeCast.toUint96(bound(uint256(x), uint256(min), uint256(max)));
    }

    function _prepareKeys(uint96[] memory keys, uint96 maxSpread) internal view {
        uint96 lastKey = 0;
        for (uint96 i = 0; i < keys.length; ++i) {
            uint96 key = _boundUint96(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint96 key, uint160 value) internal {
        (bool _exist, uint96 _key, uint160 _value) = _ckpts.latestCheckpoint();
        assertTrue(_exist == exist);
        assertTrue(_key == key);
        assertTrue(_value == value);
    }

    // tests
    function testPush(uint96[] memory keys, uint160[] memory values) public {
        vm.assume(values.length > 0);
        _prepareKeys(keys, 64);

        // initial state
        assertTrue(_ckpts.length() == 0);
        assertTrue(_ckpts.latest() == 0);
        _assertLatestCheckpoint(false, 0, 0);

        uint96 duplicates = 0;
        for (uint96 i = 0; i < keys.length; ++i) {
            uint96 key = keys[i];
            uint160 value = values[i % values.length];
            if (i > 0 && key == keys[i - 1]) ++duplicates;

            // push
            _ckpts.push(key, value);

            // check length & latest
            assertTrue(_ckpts.length() == i + 1 - duplicates);
            assertTrue(_ckpts.latest() == value);
            _assertLatestCheckpoint(true, key, value);
        }
    }

    function testLookup(uint96[] memory keys, uint160[] memory values, uint96 lookup) public {
        vm.assume(values.length > 0);
        _prepareKeys(keys, 64);

        uint96 lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
        lookup = _boundUint96(lookup, 0, lastKey + 64);

        uint160 upper = 0;
        uint160 lower = 0;
        uint96 lowerKey = type(uint96).max;
        for (uint96 i = 0; i < keys.length; ++i) {
            uint96 key = keys[i];
            uint160 value = values[i % values.length];

            // push
            _ckpts.push(key, value);

            // track expected result of lookups
            if (key <= lookup) {
                upper = value;
            }
            if (key >= lookup && (i == 0 || keys[i - 1] < lookup)) {
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
}
