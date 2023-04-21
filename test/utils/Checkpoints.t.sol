// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Checkpoints.t.js.

pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../contracts/utils/Checkpoints.sol";
import "../../contracts/utils/math/SafeCast.sol";

contract CheckpointsHistoryTest is Test {
    using Checkpoints for Checkpoints.History;

    // Maximum gap between keys used during the fuzzing tests: the `_prepareKeys` function with make sure that
    // key#n+1 is in the [key#n, key#n + _KEY_MAX_GAP] range.
    uint8 internal constant _KEY_MAX_GAP = 64;

    Checkpoints.History internal _ckpts;

    // helpers
    function _boundUint32(uint32 x, uint32 min, uint32 max) internal view returns (uint32) {
        return SafeCast.toUint32(bound(uint256(x), uint256(min), uint256(max)));
    }

    function _prepareKeys(uint32[] memory keys, uint32 maxSpread) internal view {
        uint32 lastKey = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint32 key = _boundUint32(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint32 key, uint224 value) internal {
        (bool _exist, uint32 _key, uint224 _value) = _ckpts.latestCheckpoint();
        assertEq(_exist, exist);
        assertEq(_key, key);
        assertEq(_value, value);
    }

    // tests
    function testPush(uint32[] memory keys, uint224[] memory values, uint32 pastKey) public {
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        // initial state
        assertEq(_ckpts.length(), 0);
        assertEq(_ckpts.latest(), 0);
        _assertLatestCheckpoint(false, 0, 0);

        uint256 duplicates = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint32 key = keys[i];
            uint224 value = values[i % values.length];
            if (i > 0 && key == keys[i - 1]) ++duplicates;

            // push
            vm.roll(key);
            _ckpts.push(value);

            // check length & latest
            assertEq(_ckpts.length(), i + 1 - duplicates);
            assertEq(_ckpts.latest(), value);
            _assertLatestCheckpoint(true, key, value);
        }

        // Can't push any key in the past
        if (keys.length > 0) {
            uint32 lastKey = keys[keys.length - 1];
            pastKey = _boundUint32(pastKey, 0, lastKey - 1);

            vm.roll(pastKey);
            vm.expectRevert();
            this.push(values[keys.length % values.length]);
        }
    }

    // used to test reverts
    function push(uint224 value) external {
        _ckpts.push(value);
    }

    function testLookup(uint32[] memory keys, uint224[] memory values, uint32 lookup) public {
        vm.assume(keys.length > 0);
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        uint32 lastKey = keys[keys.length - 1];
        vm.assume(lastKey > 0);
        lookup = _boundUint32(lookup, 0, lastKey - 1);

        uint224 upper = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
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
        assertEq(_ckpts.getAtBlock(lookup), upper);
        assertEq(_ckpts.getAtProbablyRecentBlock(lookup), upper);

        vm.expectRevert();
        this.getAtBlock(lastKey);
        vm.expectRevert();
        this.getAtBlock(lastKey + 1);
        vm.expectRevert();
        this.getAtProbablyRecentBlock(lastKey);
        vm.expectRevert();
        this.getAtProbablyRecentBlock(lastKey + 1);
    }

    // used to test reverts
    function getAtBlock(uint32 key) external view {
        _ckpts.getAtBlock(key);
    }

    // used to test reverts
    function getAtProbablyRecentBlock(uint32 key) external view {
        _ckpts.getAtProbablyRecentBlock(key);
    }
}

contract CheckpointsTrace224Test is Test {
    using Checkpoints for Checkpoints.Trace224;

    // Maximum gap between keys used during the fuzzing tests: the `_prepareKeys` function with make sure that
    // key#n+1 is in the [key#n, key#n + _KEY_MAX_GAP] range.
    uint8 internal constant _KEY_MAX_GAP = 64;

    Checkpoints.Trace224 internal _ckpts;

    // helpers
    function _boundUint32(uint32 x, uint32 min, uint32 max) internal view returns (uint32) {
        return SafeCast.toUint32(bound(uint256(x), uint256(min), uint256(max)));
    }

    function _prepareKeys(uint32[] memory keys, uint32 maxSpread) internal view {
        uint32 lastKey = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint32 key = _boundUint32(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint32 key, uint224 value) internal {
        (bool _exist, uint32 _key, uint224 _value) = _ckpts.latestCheckpoint();
        assertEq(_exist, exist);
        assertEq(_key, key);
        assertEq(_value, value);
    }

    // tests
    function testPush(uint32[] memory keys, uint224[] memory values, uint32 pastKey) public {
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        // initial state
        assertEq(_ckpts.length(), 0);
        assertEq(_ckpts.latest(), 0);
        _assertLatestCheckpoint(false, 0, 0);

        uint256 duplicates = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint32 key = keys[i];
            uint224 value = values[i % values.length];
            if (i > 0 && key == keys[i - 1]) ++duplicates;

            // push
            _ckpts.push(key, value);

            // check length & latest
            assertEq(_ckpts.length(), i + 1 - duplicates);
            assertEq(_ckpts.latest(), value);
            _assertLatestCheckpoint(true, key, value);
        }

        if (keys.length > 0) {
            uint32 lastKey = keys[keys.length - 1];
            pastKey = _boundUint32(pastKey, 0, lastKey - 1);

            vm.expectRevert();
            this.push(pastKey, values[keys.length % values.length]);
        }
    }

    // used to test reverts
    function push(uint32 key, uint224 value) external {
        _ckpts.push(key, value);
    }

    function testLookup(uint32[] memory keys, uint224[] memory values, uint32 lookup) public {
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        uint32 lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
        lookup = _boundUint32(lookup, 0, lastKey + _KEY_MAX_GAP);

        uint224 upper = 0;
        uint224 lower = 0;
        uint32 lowerKey = type(uint32).max;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint32 key = keys[i];
            uint224 value = values[i % values.length];

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
}

contract CheckpointsTrace160Test is Test {
    using Checkpoints for Checkpoints.Trace160;

    // Maximum gap between keys used during the fuzzing tests: the `_prepareKeys` function with make sure that
    // key#n+1 is in the [key#n, key#n + _KEY_MAX_GAP] range.
    uint8 internal constant _KEY_MAX_GAP = 64;

    Checkpoints.Trace160 internal _ckpts;

    // helpers
    function _boundUint96(uint96 x, uint96 min, uint96 max) internal view returns (uint96) {
        return SafeCast.toUint96(bound(uint256(x), uint256(min), uint256(max)));
    }

    function _prepareKeys(uint96[] memory keys, uint96 maxSpread) internal view {
        uint96 lastKey = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint96 key = _boundUint96(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint96 key, uint160 value) internal {
        (bool _exist, uint96 _key, uint160 _value) = _ckpts.latestCheckpoint();
        assertEq(_exist, exist);
        assertEq(_key, key);
        assertEq(_value, value);
    }

    // tests
    function testPush(uint96[] memory keys, uint160[] memory values, uint96 pastKey) public {
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        // initial state
        assertEq(_ckpts.length(), 0);
        assertEq(_ckpts.latest(), 0);
        _assertLatestCheckpoint(false, 0, 0);

        uint256 duplicates = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint96 key = keys[i];
            uint160 value = values[i % values.length];
            if (i > 0 && key == keys[i - 1]) ++duplicates;

            // push
            _ckpts.push(key, value);

            // check length & latest
            assertEq(_ckpts.length(), i + 1 - duplicates);
            assertEq(_ckpts.latest(), value);
            _assertLatestCheckpoint(true, key, value);
        }

        if (keys.length > 0) {
            uint96 lastKey = keys[keys.length - 1];
            pastKey = _boundUint96(pastKey, 0, lastKey - 1);

            vm.expectRevert();
            this.push(pastKey, values[keys.length % values.length]);
        }
    }

    // used to test reverts
    function push(uint96 key, uint160 value) external {
        _ckpts.push(key, value);
    }

    function testLookup(uint96[] memory keys, uint160[] memory values, uint96 lookup) public {
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        uint96 lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
        lookup = _boundUint96(lookup, 0, lastKey + _KEY_MAX_GAP);

        uint160 upper = 0;
        uint160 lower = 0;
        uint96 lowerKey = type(uint96).max;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint96 key = keys[i];
            uint160 value = values[i % values.length];

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
}
