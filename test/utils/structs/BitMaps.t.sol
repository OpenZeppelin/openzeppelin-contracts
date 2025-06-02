// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/BitMaps.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BitMaps} from "@openzeppelin/contracts/utils/structs/BitMaps.sol";

contract BitMapsTest is Test {
    using BitMaps for *;

    // ========== BitMap Tests ==========

    BitMaps.BitMap[2] private _bitmaps;

    function testSymbolicBitMapSetAndGet(uint256 value) public {
        assertFalse(_bitmaps[0].get(value)); // initial state
        _bitmaps[0].set(value);
        assertTrue(_bitmaps[0].get(value)); // after set
    }

    function testSymbolicBitMapSetToAndGet(uint256 value) public {
        _bitmaps[0].setTo(value, true);
        assertTrue(_bitmaps[0].get(value)); // after setTo true
        _bitmaps[0].setTo(value, false);
        assertFalse(_bitmaps[0].get(value)); // after setTo false
    }

    function testSymbolicBitMapIsolation(uint256 value1, uint256 value2) public {
        vm.assume(value1 != value2);

        _bitmaps[0].set(value1);
        _bitmaps[1].set(value2);

        assertTrue(_bitmaps[0].get(value1));
        assertTrue(_bitmaps[1].get(value2));
        assertFalse(_bitmaps[0].get(value2));
        assertFalse(_bitmaps[1].get(value1));
    }

    // ========== PairMap Tests ==========

    BitMaps.PairMap[2] private _pairmaps;

    function testSymbolicPairMapSetAndGet(uint256 index, uint8 value) public {
        value = uint8(bound(value, 0, 0x03)); // PairMap only supports 2-bit values (0-0x03)

        assertEq(_pairmaps[0].get(index), 0); // initial state
        _pairmaps[0].set(index, value);
        assertEq(_pairmaps[0].get(index), value); // after set
    }

    function testSymbolicPairMapTruncation(uint256 index, uint8 value) public {
        value = uint8(bound(value, 4, type(uint8).max)); // Test values that need truncation

        _pairmaps[0].set(index, value);
        assertEq(_pairmaps[0].get(index), value & 0x03); // Should be truncated to 2 bits
    }

    function testSymbolicPairMapIsolation(uint256 index1, uint256 index2, uint8 value1, uint8 value2) public {
        vm.assume(index1 != index2);
        value1 = uint8(bound(value1, 0, 0x03));
        value2 = uint8(bound(value2, 0, 0x03));

        _pairmaps[0].set(index1, value1);
        _pairmaps[1].set(index2, value2);

        assertEq(_pairmaps[0].get(index1), value1);
        assertEq(_pairmaps[1].get(index2), value2);
        assertEq(_pairmaps[0].get(index2), 0);
        assertEq(_pairmaps[1].get(index1), 0);
    }

    // ========== NibbleMap Tests ==========

    BitMaps.NibbleMap[2] private _nibblemaps;

    function testSymbolicNibbleMapSetAndGet(uint256 index, uint8 value) public {
        value = uint8(bound(value, 0, 0x0f)); // NibbleMap only supports 4-bit values (0-0x0f)

        assertEq(_nibblemaps[0].get(index), 0); // initial state
        _nibblemaps[0].set(index, value);
        assertEq(_nibblemaps[0].get(index), value); // after set
    }

    function testSymbolicNibbleMapTruncation(uint256 index, uint8 value) public {
        value = uint8(bound(value, 16, type(uint8).max)); // Test values that need truncation

        _nibblemaps[0].set(index, value);
        assertEq(_nibblemaps[0].get(index), value & 0x0f); // Should be truncated to 4 bits
    }

    function testSymbolicNibbleMapIsolation(uint256 index1, uint256 index2, uint8 value1, uint8 value2) public {
        vm.assume(index1 != index2);
        value1 = uint8(bound(value1, 0, 0x0f));
        value2 = uint8(bound(value2, 0, 0x0f));

        _nibblemaps[0].set(index1, value1);
        _nibblemaps[1].set(index2, value2);

        assertEq(_nibblemaps[0].get(index1), value1);
        assertEq(_nibblemaps[1].get(index2), value2);
        assertEq(_nibblemaps[0].get(index2), 0);
        assertEq(_nibblemaps[1].get(index1), 0);
    }

    // ========== Uint8Map Tests ==========

    BitMaps.Uint8Map[2] private _uint8maps;

    function testSymbolicUint8MapSetAndGet(uint256 index, uint8 value) public {
        value = uint8(bound(value, 0, 0xff)); // Uint8Map only supports 8-bit values (0-0xff)

        assertEq(_uint8maps[0].get(index), 0); // initial state
        _uint8maps[0].set(index, value);
        assertEq(_uint8maps[0].get(index), value); // after set
    }

    function testSymbolicUint8MapAssemblyCorruption(uint256 index, uint8 value) public {
        uint256 corrupted = _corruptValue(value);
        uint8 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }

        _uint8maps[0].set(index, corruptedValue);
        assertEq(_uint8maps[0].get(index), uint8(corrupted)); // Should match truncated value
    }

    function testSymbolicUint8MapIsolation(uint256 index1, uint256 index2, uint8 value1, uint8 value2) public {
        vm.assume(index1 != index2);
        value1 = uint8(bound(value1, 0, 0xff));
        value2 = uint8(bound(value2, 0, 0xff));

        _uint8maps[0].set(index1, value1);
        _uint8maps[1].set(index2, value2);

        assertEq(_uint8maps[0].get(index1), value1);
        assertEq(_uint8maps[1].get(index2), value2);
        assertEq(_uint8maps[0].get(index2), 0);
        assertEq(_uint8maps[1].get(index1), 0);
    }

    // ========== Uint16Map Tests ==========

    BitMaps.Uint16Map[2] private _uint16maps;

    function testSymbolicUint16MapSetAndGet(uint256 index, uint16 value) public {
        value = uint16(bound(value, 0, 0xffff)); // Uint16Map only supports 16-bit values (0-0xffff)

        assertEq(_uint16maps[0].get(index), 0); // initial state
        _uint16maps[0].set(index, value);
        assertEq(_uint16maps[0].get(index), value); // after set
    }

    function testSymbolicUint16MapAssemblyCorruption(uint256 index, uint16 value) public {
        uint256 corrupted = _corruptValue(value);
        uint16 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }

        _uint16maps[0].set(index, corruptedValue);
        assertEq(_uint16maps[0].get(index), uint16(corrupted)); // Should match truncated value
    }

    function testSymbolicUint16MapIsolation(uint256 index1, uint256 index2, uint16 value1, uint16 value2) public {
        vm.assume(index1 != index2);
        value1 = uint16(bound(value1, 0, 0xffff));
        value2 = uint16(bound(value2, 0, 0xffff));

        _uint16maps[0].set(index1, value1);
        _uint16maps[1].set(index2, value2);

        assertEq(_uint16maps[0].get(index1), value1);
        assertEq(_uint16maps[1].get(index2), value2);
        assertEq(_uint16maps[0].get(index2), 0);
        assertEq(_uint16maps[1].get(index1), 0);
    }

    // ========== Uint32Map Tests ==========

    BitMaps.Uint32Map[2] private _uint32maps;

    function testSymbolicUint32MapSetAndGet(uint256 index, uint32 value) public {
        value = uint32(bound(value, 0, 0xffffffff)); // Uint32Map only supports 32-bit values (0-0xffffffff)

        assertEq(_uint32maps[0].get(index), 0); // initial state
        _uint32maps[0].set(index, value);
        assertEq(_uint32maps[0].get(index), value); // after set
    }

    function testSymbolicUint32MapAssemblyCorruption(uint256 index, uint32 value) public {
        uint256 corrupted = _corruptValue(value);
        uint32 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }

        _uint32maps[0].set(index, corruptedValue);
        assertEq(_uint32maps[0].get(index), uint32(corrupted)); // Should match truncated value
    }

    function testSymbolicUint32MapIsolation(uint256 index1, uint256 index2, uint32 value1, uint32 value2) public {
        vm.assume(index1 != index2);
        value1 = uint32(bound(value1, 0, 0xffffffff));
        value2 = uint32(bound(value2, 0, 0xffffffff));

        _uint32maps[0].set(index1, value1);
        _uint32maps[1].set(index2, value2);

        assertEq(_uint32maps[0].get(index1), value1);
        assertEq(_uint32maps[1].get(index2), value2);
        assertEq(_uint32maps[0].get(index2), 0);
        assertEq(_uint32maps[1].get(index1), 0);
    }

    // ========== Uint64Map Tests ==========

    BitMaps.Uint64Map[2] private _uint64maps;

    function testSymbolicUint64MapSetAndGet(uint256 index, uint64 value) public {
        value = uint64(bound(value, 0, 0xffffffffffffffff)); // Uint64Map only supports 64-bit values (0-0xffffffffffffffff)

        assertEq(_uint64maps[0].get(index), 0); // initial state
        _uint64maps[0].set(index, value);
        assertEq(_uint64maps[0].get(index), value); // after set
    }

    function testSymbolicUint64MapAssemblyCorruption(uint256 index, uint64 value) public {
        uint256 corrupted = _corruptValue(value);
        uint64 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }

        _uint64maps[0].set(index, corruptedValue);
        assertEq(_uint64maps[0].get(index), uint64(corrupted)); // Should match truncated value
    }

    function testSymbolicUint64MapIsolation(uint256 index1, uint256 index2, uint64 value1, uint64 value2) public {
        vm.assume(index1 != index2);
        value1 = uint64(bound(value1, 0, 0xffffffffffffffff));
        value2 = uint64(bound(value2, 0, 0xffffffffffffffff));

        _uint64maps[0].set(index1, value1);
        _uint64maps[1].set(index2, value2);

        assertEq(_uint64maps[0].get(index1), value1);
        assertEq(_uint64maps[1].get(index2), value2);
        assertEq(_uint64maps[0].get(index2), 0);
        assertEq(_uint64maps[1].get(index1), 0);
    }

    // ========== Uint128Map Tests ==========

    BitMaps.Uint128Map[2] private _uint128maps;

    function testSymbolicUint128MapSetAndGet(uint256 index, uint128 value) public {
        value = uint128(bound(value, 0, 0xffffffffffffffffffffffffffffffff)); // Uint128Map only supports 128-bit values (0-0xffffffffffffffffffffffffffffffff)

        assertEq(_uint128maps[0].get(index), 0); // initial state
        _uint128maps[0].set(index, value);
        assertEq(_uint128maps[0].get(index), value); // after set
    }

    function testSymbolicUint128MapAssemblyCorruption(uint256 index, uint128 value) public {
        uint256 corrupted = _corruptValue(value);
        uint128 corruptedValue;
        assembly {
            corruptedValue := corrupted
        }

        _uint128maps[0].set(index, corruptedValue);
        assertEq(_uint128maps[0].get(index), uint128(corrupted)); // Should match truncated value
    }

    function testSymbolicUint128MapIsolation(uint256 index1, uint256 index2, uint128 value1, uint128 value2) public {
        vm.assume(index1 != index2);
        value1 = uint128(bound(value1, 0, 0xffffffffffffffffffffffffffffffff));
        value2 = uint128(bound(value2, 0, 0xffffffffffffffffffffffffffffffff));

        _uint128maps[0].set(index1, value1);
        _uint128maps[1].set(index2, value2);

        assertEq(_uint128maps[0].get(index1), value1);
        assertEq(_uint128maps[1].get(index2), value2);
        assertEq(_uint128maps[0].get(index2), 0);
        assertEq(_uint128maps[1].get(index1), 0);
    }

    function _corruptValue(uint256 value) private pure returns (uint256 corrupted) {
        // Simulate assembly corruption by adding high bits
        assembly {
            corrupted := or(value, shl(200, 0xffffffff))
        }
    }
}
