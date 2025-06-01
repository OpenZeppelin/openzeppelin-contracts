const { capitalize } = require('../../helpers');
const format = require('../format-lines');
const { SUBBYTE_TYPES, BYTEMAP_TYPES } = require('./BitMaps.opts');

const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BitMaps} from "../../../contracts/utils/structs/BitMaps.sol";

contract BitMapsTest is Test {
    using BitMaps for *;
`;

const bitmapTests = `\

    // ========== BitMap Tests ==========

    BitMaps.BitMap[2] private _bitmaps;

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
    }`;

const subByteTestTemplate = opts => {
  const maxValue = (1n << opts.bits) - 1n;
  const capitalizedName = capitalize(opts.name);
  const mapName = `_${opts.name}s`;

  return `\

    // ========== ${capitalizedName} Tests ==========

    BitMaps.${capitalizedName}[2] private ${mapName};

    function test${capitalizedName}SetAndGet(uint256 index, uint8 value) public {
        vm.assume(value <= ${maxValue}); // ${capitalizedName} only supports ${opts.bits}-bit values (0-${maxValue})
        assertEq(${mapName}[0].get(index), 0); // initial state
        ${mapName}[0].set(index, value);
        assertEq(${mapName}[0].get(index), value); // after set
    }

    function test${capitalizedName}Truncation(uint256 index, uint8 value) public {
        vm.assume(value > ${maxValue}); // Test values that need truncation
        ${mapName}[0].set(index, value);
        assertEq(${mapName}[0].get(index), value & ${maxValue}); // Should be truncated to ${opts.bits} bits
    }

    function test${capitalizedName}Isolation(uint256 index1, uint256 index2, uint8 value1, uint8 value2) public {
        vm.assume(index1 != index2);
        vm.assume(value1 <= ${maxValue});
        vm.assume(value2 <= ${maxValue});

        ${mapName}[0].set(index1, value1);
        ${mapName}[1].set(index2, value2);

        assertEq(${mapName}[0].get(index1), value1);
        assertEq(${mapName}[1].get(index2), value2);
        assertEq(${mapName}[0].get(index2), 0);
        assertEq(${mapName}[1].get(index1), 0);
    }`;
};

const byteTestTemplate = opts => {
  const capitalizedName = `Uint${opts.bits}Map`;
  const mapName = `_uint${opts.bits}Maps`;
  const valueType = `uint${opts.bits}`;

  return `\

    // ========== ${capitalizedName} Tests ==========

    BitMaps.${capitalizedName}[2] private ${mapName};

    function test${capitalizedName}SetAndGet(uint256 index, ${valueType} value) public {
        assertEq(${mapName}[0].get(index), 0); // initial state
        ${mapName}[0].set(index, value);
        assertEq(${mapName}[0].get(index), value); // after set
    }

    function test${capitalizedName}AssemblyCorruption(uint256 index, ${valueType} value) public {
        uint256 corrupted = _corruptValue(value);
        ${valueType} corruptedValue;
        assembly {
            corruptedValue := corrupted
        }
        ${mapName}[0].set(index, corruptedValue);
        assertEq(${mapName}[0].get(index), ${valueType}(corrupted)); // Should match truncated value
    }

    function test${capitalizedName}Isolation(uint256 index1, uint256 index2, ${valueType} value1, ${valueType} value2) public {
        vm.assume(index1 != index2);

        ${mapName}[0].set(index1, value1);
        ${mapName}[1].set(index2, value2);

        assertEq(${mapName}[0].get(index1), value1);
        assertEq(${mapName}[1].get(index2), value2);
        assertEq(${mapName}[0].get(index2), 0);
        assertEq(${mapName}[1].get(index1), 0);
    }`;
};

const footer = `\

    function _corruptValue(uint256 value) private pure returns (uint256 corrupted) {
        // Simulate assembly corruption by adding high bits
        assembly {
            corrupted := or(value, shl(200, 0xffffffff))
        }
    }
}`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  bitmapTests,
  ...SUBBYTE_TYPES.map(subByteTestTemplate),
  ...BYTEMAP_TYPES.map(byteTestTemplate),
  footer.trimEnd(),
);
