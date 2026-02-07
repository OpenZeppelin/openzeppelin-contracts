// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Checkpoints.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Checkpoints} from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

contract CheckpointsTrace256Test is Test {
    using Checkpoints for Checkpoints.Trace256;

    // Maximum gap between keys used during the fuzzing tests: the `_prepareKeys` function will make sure that
    // key#n+1 is in the [key#n, key#n + _KEY_MAX_GAP] range.
    uint8 internal constant _KEY_MAX_GAP = 64;

    Checkpoints.Trace256 internal _ckpts;

    // helpers
    function _boundUint256(uint256 x, uint256 min, uint256 max) internal pure returns (uint256) {
        return bound(x, min, max);
    }

    function _prepareKeys(uint256[] memory keys, uint256 maxSpread) internal pure {
        uint256 lastKey = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint256 key = _boundUint256(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint256 key, uint256 value) internal view {
        (bool _exist, uint256 _key, uint256 _value) = _ckpts.latestCheckpoint();
        assertEq(_exist, exist);
        assertEq(_key, key);
        assertEq(_value, value);
    }

    // tests
    function testPush(uint256[] memory keys, uint256[] memory values, uint256 pastKey) public {
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        // initial state
        assertEq(_ckpts.length(), 0);
        assertEq(_ckpts.latest(), 0);
        _assertLatestCheckpoint(false, 0, 0);

        uint256 duplicates = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint256 key = keys[i];
            uint256 value = values[i % values.length];
            if (i > 0 && key == keys[i - 1]) ++duplicates;

            // push
            _ckpts.push(key, value);

            // check length & latest
            assertEq(_ckpts.length(), i + 1 - duplicates);
            assertEq(_ckpts.latest(), value);
            _assertLatestCheckpoint(true, key, value);
        }

        if (keys.length > 0) {
            uint256 lastKey = keys[keys.length - 1];
            if (lastKey > 0) {
                pastKey = _boundUint256(pastKey, 0, lastKey - 1);

                vm.expectRevert();
                this.push(pastKey, values[keys.length % values.length]);
            }
        }
    }

    // used to test reverts
    function push(uint256 key, uint256 value) external {
        _ckpts.push(key, value);
    }

    function testLookup(uint256[] memory keys, uint256[] memory values, uint256 lookup) public {
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        uint256 lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
        lookup = _boundUint256(lookup, 0, lastKey + _KEY_MAX_GAP);

        uint256 upper = 0;
        uint256 lower = 0;
        uint256 lowerKey = type(uint256).max;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint256 key = keys[i];
            uint256 value = values[i % values.length];

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

contract CheckpointsTrace224Test is Test {
    using Checkpoints for Checkpoints.Trace224;

    // Maximum gap between keys used during the fuzzing tests: the `_prepareKeys` function will make sure that
    // key#n+1 is in the [key#n, key#n + _KEY_MAX_GAP] range.
    uint8 internal constant _KEY_MAX_GAP = 64;

    Checkpoints.Trace224 internal _ckpts;

    // helpers
    function _boundUint32(uint32 x, uint32 min, uint32 max) internal pure returns (uint32) {
        return SafeCast.toUint32(bound(uint256(x), uint256(min), uint256(max)));
    }

    function _prepareKeys(uint32[] memory keys, uint32 maxSpread) internal pure {
        uint32 lastKey = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint32 key = _boundUint32(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint32 key, uint224 value) internal view {
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
            if (lastKey > 0) {
                pastKey = _boundUint32(pastKey, 0, lastKey - 1);

                vm.expectRevert();
                this.push(pastKey, values[keys.length % values.length]);
            }
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

contract CheckpointsTrace208Test is Test {
    using Checkpoints for Checkpoints.Trace208;

    // Maximum gap between keys used during the fuzzing tests: the `_prepareKeys` function will make sure that
    // key#n+1 is in the [key#n, key#n + _KEY_MAX_GAP] range.
    uint8 internal constant _KEY_MAX_GAP = 64;

    Checkpoints.Trace208 internal _ckpts;

    // helpers
    function _boundUint48(uint48 x, uint48 min, uint48 max) internal pure returns (uint48) {
        return SafeCast.toUint48(bound(uint256(x), uint256(min), uint256(max)));
    }

    function _prepareKeys(uint48[] memory keys, uint48 maxSpread) internal pure {
        uint48 lastKey = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint48 key = _boundUint48(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint48 key, uint208 value) internal view {
        (bool _exist, uint48 _key, uint208 _value) = _ckpts.latestCheckpoint();
        assertEq(_exist, exist);
        assertEq(_key, key);
        assertEq(_value, value);
    }

    // tests
    function testPush(uint48[] memory keys, uint208[] memory values, uint48 pastKey) public {
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        // initial state
        assertEq(_ckpts.length(), 0);
        assertEq(_ckpts.latest(), 0);
        _assertLatestCheckpoint(false, 0, 0);

        uint256 duplicates = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint48 key = keys[i];
            uint208 value = values[i % values.length];
            if (i > 0 && key == keys[i - 1]) ++duplicates;

            // push
            _ckpts.push(key, value);

            // check length & latest
            assertEq(_ckpts.length(), i + 1 - duplicates);
            assertEq(_ckpts.latest(), value);
            _assertLatestCheckpoint(true, key, value);
        }

        if (keys.length > 0) {
            uint48 lastKey = keys[keys.length - 1];
            if (lastKey > 0) {
                pastKey = _boundUint48(pastKey, 0, lastKey - 1);

                vm.expectRevert();
                this.push(pastKey, values[keys.length % values.length]);
            }
        }
    }

    // used to test reverts
    function push(uint48 key, uint208 value) external {
        _ckpts.push(key, value);
    }

    function testLookup(uint48[] memory keys, uint208[] memory values, uint48 lookup) public {
        vm.assume(values.length > 0 && values.length <= keys.length);
        _prepareKeys(keys, _KEY_MAX_GAP);

        uint48 lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
        lookup = _boundUint48(lookup, 0, lastKey + _KEY_MAX_GAP);

        uint208 upper = 0;
        uint208 lower = 0;
        uint48 lowerKey = type(uint48).max;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint48 key = keys[i];
            uint208 value = values[i % values.length];

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

    // Maximum gap between keys used during the fuzzing tests: the `_prepareKeys` function will make sure that
    // key#n+1 is in the [key#n, key#n + _KEY_MAX_GAP] range.
    uint8 internal constant _KEY_MAX_GAP = 64;

    Checkpoints.Trace160 internal _ckpts;

    // helpers
    function _boundUint96(uint96 x, uint96 min, uint96 max) internal pure returns (uint96) {
        return SafeCast.toUint96(bound(uint256(x), uint256(min), uint256(max)));
    }

    function _prepareKeys(uint96[] memory keys, uint96 maxSpread) internal pure {
        uint96 lastKey = 0;
        for (uint256 i = 0; i < keys.length; ++i) {
            uint96 key = _boundUint96(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function _assertLatestCheckpoint(bool exist, uint96 key, uint160 value) internal view {
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
            if (lastKey > 0) {
                pastKey = _boundUint96(pastKey, 0, lastKey - 1);

                vm.expectRevert();
                this.push(pastKey, values[keys.length % values.length]);
            }
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
