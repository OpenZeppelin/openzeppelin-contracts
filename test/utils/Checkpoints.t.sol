// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/tests/Checkpoints.js.

pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../contracts/utils/Checkpoints.sol";

contract CheckpointsHistoryTest is Test {
    using Checkpoints for Checkpoints.History;

    Checkpoints.History internal instance;

    // helpers
    function bound_uint32(uint32 x, uint32 min, uint32 max) internal view returns (uint32) {
        return uint32(bound(uint256(x), uint256(min), uint256(max)));
    }

    function prepareKeys(uint32[] memory keys, uint32 maxSpread) private view {
        uint32 lastKey = 0;
        for (uint32 i = 0; i < keys.length; ++i) {
            uint32 key = bound_uint32(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function assertLatestCheckpoint(bool exist, uint32 key, uint224 value) internal {
        (bool _exist, uint32 _key, uint224 _value) = instance.latestCheckpoint();
        assertTrue(_exist == exist);
        assertTrue(_key == key);
        assertTrue(_value == value);
    }

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

        vm.expectRevert();
        instance.getAtBlock(lastKey);
        vm.expectRevert();
        instance.getAtBlock(lastKey + 1);
        vm.expectRevert();
        instance.getAtProbablyRecentBlock(lastKey);
        vm.expectRevert();
        instance.getAtProbablyRecentBlock(lastKey + 1);
    }
}

contract CheckpointsTrace224Test is Test {
    using Checkpoints for Checkpoints.Trace224;

    Checkpoints.Trace224 internal instance;

    // helpers
    function bound_uint32(uint32 x, uint32 min, uint32 max) internal view returns (uint32) {
        return uint32(bound(uint256(x), uint256(min), uint256(max)));
    }

    function prepareKeys(uint32[] memory keys, uint32 maxSpread) private view {
        uint32 lastKey = 0;
        for (uint32 i = 0; i < keys.length; ++i) {
            uint32 key = bound_uint32(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function assertLatestCheckpoint(bool exist, uint32 key, uint224 value) internal {
        (bool _exist, uint32 _key, uint224 _value) = instance.latestCheckpoint();
        assertTrue(_exist == exist);
        assertTrue(_key == key);
        assertTrue(_value == value);
    }

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
            instance.push(key, value);

            // check length & latest
            assertTrue(instance.length() == i + 1 - duplicates);
            assertTrue(instance.latest() == value);
            assertLatestCheckpoint(true, key, value);
        }
    }

    function testLookup(uint32[] memory keys, uint224[] memory values, uint32 lookup) public {
        vm.assume(values.length > 0);
        prepareKeys(keys, 64);

        uint32 lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
        lookup = bound_uint32(lookup, 0, lastKey + 64);

        uint224 upper = 0;
        uint224 lower = 0;
        uint32 lowerKey = type(uint32).max;
        for (uint32 i = 0; i < keys.length; ++i) {
            uint32 key = keys[i];
            uint224 value = values[i % values.length];

            // push
            instance.push(key, value);

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
        assertTrue(instance.lowerLookup(lookup) == lower);
        assertTrue(instance.upperLookup(lookup) == upper);
        assertTrue(instance.upperLookupRecent(lookup) == upper);
    }
}

contract CheckpointsTrace160Test is Test {
    using Checkpoints for Checkpoints.Trace160;

    Checkpoints.Trace160 internal instance;

    // helpers
    function bound_uint96(uint96 x, uint96 min, uint96 max) internal view returns (uint96) {
        return uint96(bound(uint256(x), uint256(min), uint256(max)));
    }

    function prepareKeys(uint96[] memory keys, uint96 maxSpread) private view {
        uint96 lastKey = 0;
        for (uint96 i = 0; i < keys.length; ++i) {
            uint96 key = bound_uint96(keys[i], lastKey, lastKey + maxSpread);
            keys[i] = key;
            lastKey = key;
        }
    }

    function assertLatestCheckpoint(bool exist, uint96 key, uint160 value) internal {
        (bool _exist, uint96 _key, uint160 _value) = instance.latestCheckpoint();
        assertTrue(_exist == exist);
        assertTrue(_key == key);
        assertTrue(_value == value);
    }

    // tests
    function testPush(uint96[] memory keys, uint160[] memory values) public {
        vm.assume(values.length > 0);
        prepareKeys(keys, 64);

        // initial state
        assertTrue(instance.length() == 0);
        assertTrue(instance.latest() == 0);
        assertLatestCheckpoint(false, 0, 0);

        uint96 duplicates = 0;
        for (uint96 i = 0; i < keys.length; ++i) {
            uint96 key = keys[i];
            uint160 value = values[i % values.length];
            if (i > 0 && key == keys[i - 1]) ++duplicates;

            // push
            instance.push(key, value);

            // check length & latest
            assertTrue(instance.length() == i + 1 - duplicates);
            assertTrue(instance.latest() == value);
            assertLatestCheckpoint(true, key, value);
        }
    }

    function testLookup(uint96[] memory keys, uint160[] memory values, uint96 lookup) public {
        vm.assume(values.length > 0);
        prepareKeys(keys, 64);

        uint96 lastKey = keys.length == 0 ? 0 : keys[keys.length - 1];
        lookup = bound_uint96(lookup, 0, lastKey + 64);

        uint160 upper = 0;
        uint160 lower = 0;
        uint96 lowerKey = type(uint96).max;
        for (uint96 i = 0; i < keys.length; ++i) {
            uint96 key = keys[i];
            uint160 value = values[i % values.length];

            // push
            instance.push(key, value);

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
        assertTrue(instance.lowerLookup(lookup) == lower);
        assertTrue(instance.upperLookup(lookup) == upper);
        assertTrue(instance.upperLookupRecent(lookup) == upper);
    }
}
