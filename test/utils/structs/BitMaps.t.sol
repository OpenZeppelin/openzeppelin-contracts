// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BitMaps} from "../../../contracts/utils/structs/BitMaps.sol";

contract BitMapsTest is Test {
    using BitMaps for *;

    // Test state for different map types
    BitMaps.BitMap[2] private _bitmaps;
    BitMaps.PairMap[2] private _pairMaps;
    BitMaps.NibbleMap[2] private _nibbleMaps;
    BitMaps.Uint8Map[2] private _uint8Maps;
    BitMaps.Uint16Map[2] private _uint16Maps;
    BitMaps.Uint32Map[2] private _uint32Maps;
    BitMaps.Uint64Map[2] private _uint64Maps;
    BitMaps.Uint128Map[2] private _uint128Maps;

    // ========== BitMap Tests ==========

    function testBitMapSetAndGet(uint256 value) public {
        assertFalse(_bitmaps[0].get(value)); // initial state
        _bitmaps[0].set(value);
        assertTrue(_bitmaps[0].get(value)); // after set
    }

    function testBitMapSetToAndGet(uint256 value) public {
        _bitmaps[0].setTo(value, true);
        assertTrue(_bitmaps[0].get(value)); // after setTo true
        _bitmaps[0].setTo(value, false);
        assertFalse(_bitmaps[0].get(value)); // after setTo false
    }

    function testBitMapIsolation(uint256 value1, uint256 value2) public {
        vm.assume(value1 != value2);

        _bitmaps[0].set(value1);
        _bitmaps[1].set(value2);

        assertTrue(_bitmaps[0].get(value1));
        assertTrue(_bitmaps[1].get(value2));
        assertFalse(_bitmaps[0].get(value2));
        assertFalse(_bitmaps[1].get(value1));
    }

    // ========== PairMap Tests ==========

    function testPairMapSetAndGet(uint256 index, uint8 value) public {
        vm.assume(value <= 3); // PairMap only supports 2-bit values (0-3)
        assertEq(_pairMaps[0].get(index), 0); // initial state
        _pairMaps[0].set(index, value);
        assertEq(_pairMaps[0].get(index), value); // after set
    }

    function testPairMapTruncation(uint256 index, uint8 value) public {
        vm.assume(value > 3); // Test values that need truncation
        _pairMaps[0].set(index, value);
        assertEq(_pairMaps[0].get(index), value & 3); // Should be truncated to 2 bits
    }

    function testPairMapIsolation(uint256 index1, uint256 index2, uint8 value1, uint8 value2) public {
        vm.assume(index1 != index2);
        vm.assume(value1 <= 3);
        vm.assume(value2 <= 3);

        _pairMaps[0].set(index1, value1);
        _pairMaps[1].set(index2, value2);

        assertEq(_pairMaps[0].get(index1), value1);
        assertEq(_pairMaps[1].get(index2), value2);
        assertEq(_pairMaps[0].get(index2), 0);
        assertEq(_pairMaps[1].get(index1), 0);
    }

    // ========== NibbleMap Tests ==========

    function testNibbleMapSetAndGet(uint256 index, uint8 value) public {
        vm.assume(value <= 15); // NibbleMap only supports 4-bit values (0-15)
        assertEq(_nibbleMaps[0].get(index), 0); // initial state
        _nibbleMaps[0].set(index, value);
        assertEq(_nibbleMaps[0].get(index), value); // after set
    }

    function testNibbleMapTruncation(uint256 index, uint8 value) public {
        vm.assume(value > 15); // Test values that need truncation
        _nibbleMaps[0].set(index, value);
        assertEq(_nibbleMaps[0].get(index), value & 15); // Should be truncated to 4 bits
    }

    function testNibbleMapIsolation(uint256 index1, uint256 index2, uint8 value1, uint8 value2) public {
        vm.assume(index1 != index2);
        vm.assume(value1 <= 15);
        vm.assume(value2 <= 15);

        _nibbleMaps[0].set(index1, value1);
        _nibbleMaps[1].set(index2, value2);

        assertEq(_nibbleMaps[0].get(index1), value1);
        assertEq(_nibbleMaps[1].get(index2), value2);
        assertEq(_nibbleMaps[0].get(index2), 0);
        assertEq(_nibbleMaps[1].get(index1), 0);
    }

    // ========== Uint8Map Tests ==========

    function testUint8MapSetAndGet(uint256 index, uint8 value) public {
        assertEq(_uint8Maps[0].get(index), 0); // initial state
        _uint8Maps[0].set(index, value);
        assertEq(_uint8Maps[0].get(index), value); // after set
    }

    function testUint8MapAssemblyCorruption(uint256 index, uint8 value) public {
        uint256 corrupted = _corruptValue(value);
        uint8 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }
        _uint8Maps[0].set(index, corruptedValue);
        assertEq(_uint8Maps[0].get(index), uint8(corrupted)); // Should match truncated value
    }

    function testUint8MapIsolation(uint256 index1, uint256 index2, uint8 value1, uint8 value2) public {
        vm.assume(index1 != index2);

        _uint8Maps[0].set(index1, value1);
        _uint8Maps[1].set(index2, value2);

        assertEq(_uint8Maps[0].get(index1), value1);
        assertEq(_uint8Maps[1].get(index2), value2);
        assertEq(_uint8Maps[0].get(index2), 0);
        assertEq(_uint8Maps[1].get(index1), 0);
    }

    // ========== Uint16Map Tests ==========

    function testUint16MapSetAndGet(uint256 index, uint16 value) public {
        assertEq(_uint16Maps[0].get(index), 0); // initial state
        _uint16Maps[0].set(index, value);
        assertEq(_uint16Maps[0].get(index), value); // after set
    }

    function testUint16MapAssemblyCorruption(uint256 index, uint16 value) public {
        uint256 corrupted = _corruptValue(value);
        uint16 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }
        _uint16Maps[0].set(index, corruptedValue);
        assertEq(_uint16Maps[0].get(index), uint16(corrupted)); // Should match truncated value
    }

    function testUint16MapIsolation(uint256 index1, uint256 index2, uint16 value1, uint16 value2) public {
        vm.assume(index1 != index2);

        _uint16Maps[0].set(index1, value1);
        _uint16Maps[1].set(index2, value2);

        assertEq(_uint16Maps[0].get(index1), value1);
        assertEq(_uint16Maps[1].get(index2), value2);
        assertEq(_uint16Maps[0].get(index2), 0);
        assertEq(_uint16Maps[1].get(index1), 0);
    }

    // ========== Uint32Map Tests ==========

    function testUint32MapSetAndGet(uint256 index, uint32 value) public {
        assertEq(_uint32Maps[0].get(index), 0); // initial state
        _uint32Maps[0].set(index, value);
        assertEq(_uint32Maps[0].get(index), value); // after set
    }

    function testUint32MapAssemblyCorruption(uint256 index, uint32 value) public {
        uint256 corrupted = _corruptValue(value);
        uint32 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }
        _uint32Maps[0].set(index, corruptedValue);
        assertEq(_uint32Maps[0].get(index), uint32(corrupted)); // Should match truncated value
    }

    function testUint32MapIsolation(uint256 index1, uint256 index2, uint32 value1, uint32 value2) public {
        vm.assume(index1 != index2);

        _uint32Maps[0].set(index1, value1);
        _uint32Maps[1].set(index2, value2);

        assertEq(_uint32Maps[0].get(index1), value1);
        assertEq(_uint32Maps[1].get(index2), value2);
        assertEq(_uint32Maps[0].get(index2), 0);
        assertEq(_uint32Maps[1].get(index1), 0);
    }

    // ========== Uint64Map Tests ==========

    function testUint64MapSetAndGet(uint256 index, uint64 value) public {
        assertEq(_uint64Maps[0].get(index), 0); // initial state
        _uint64Maps[0].set(index, value);
        assertEq(_uint64Maps[0].get(index), value); // after set
    }

    function testUint64MapAssemblyCorruption(uint256 index, uint64 value) public {
        uint256 corrupted = _corruptValue(value);
        uint64 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }
        _uint64Maps[0].set(index, corruptedValue);
        assertEq(_uint64Maps[0].get(index), uint64(corrupted)); // Should match truncated value
    }

    function testUint64MapIsolation(uint256 index1, uint256 index2, uint64 value1, uint64 value2) public {
        vm.assume(index1 != index2);

        _uint64Maps[0].set(index1, value1);
        _uint64Maps[1].set(index2, value2);

        assertEq(_uint64Maps[0].get(index1), value1);
        assertEq(_uint64Maps[1].get(index2), value2);
        assertEq(_uint64Maps[0].get(index2), 0);
        assertEq(_uint64Maps[1].get(index1), 0);
    }

    // ========== Uint128Map Tests ==========

    function testUint128MapSetAndGet(uint256 index, uint128 value) public {
        assertEq(_uint128Maps[0].get(index), 0); // initial state
        _uint128Maps[0].set(index, value);
        assertEq(_uint128Maps[0].get(index), value); // after set
    }

    function testUint128MapAssemblyCorruption(uint256 index, uint128 value) public {
        uint256 corrupted = _corruptValue(value);
        uint128 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }
        _uint128Maps[0].set(index, corruptedValue);
        assertEq(_uint128Maps[0].get(index), uint128(corrupted)); // Should match truncated value
    }

    function testUint128MapIsolation(uint256 index1, uint256 index2, uint128 value1, uint128 value2) public {
        vm.assume(index1 != index2);

        _uint128Maps[0].set(index1, value1);
        _uint128Maps[1].set(index2, value2);

        assertEq(_uint128Maps[0].get(index1), value1);
        assertEq(_uint128Maps[1].get(index2), value2);
        assertEq(_uint128Maps[0].get(index2), 0);
        assertEq(_uint128Maps[1].get(index1), 0);
    }

    function _corruptValue(uint256 value) private pure returns (uint256 corrupted) {
        // Simulate assembly corruption by adding high bits
        assembly {
            corrupted := or(value, shl(200, 0xffffffff))
        }
    }
}
