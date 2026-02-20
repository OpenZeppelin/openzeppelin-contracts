const format = require('../format-lines');
const { TYPES } = require('./BitMaps.opts');

const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BitMaps} from "@openzeppelin/contracts/utils/structs/BitMaps.sol";
`;

const bitmapTests = `\
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
`;

const testSymbolicSetAndGet = opts => `\
function testSymbolic${opts.name}SetAndGet(uint256 index, ${opts.type} value) public {
    value = ${opts.type}(bound(value, 0, ${opts.max})); // ${opts.name} only supports ${opts.bits}-bit values (0-${opts.max})

    assertEq(${opts.store}[0].get(index), 0); // initial state
    ${opts.store}[0].set(index, value);
    assertEq(${opts.store}[0].get(index), value); // after set
}
`;

const testSymbolicTruncation = opts => `\
function testSymbolic${opts.name}Truncation(uint256 index, ${opts.type} value) public {
    value = ${opts.type}(bound(value, ${1n << opts.bits}, type(${opts.type}).max)); // Test values that need truncation

    ${opts.store}[0].set(index, value);
    assertEq(${opts.store}[0].get(index), value & ${opts.max}); // Should be truncated to ${opts.bits} bits
}
`;

const testSymbolicAssemblyCorruption = opts => `\
function testSymbolic${opts.name}AssemblyCorruption(uint256 index, ${opts.type} value) public {
    uint256 corrupted = _corruptValue(value);
    ${opts.type} corruptedValue;
    assembly {
        corruptedValue := corrupted
    }

    ${opts.store}[0].set(index, corruptedValue);
    assertEq(${opts.store}[0].get(index), ${opts.type}(corrupted)); // Should match truncated value
}
`;

const testSymbolicIsolation = opts => `\
function testSymbolic${opts.name}Isolation(uint256 index1, uint256 index2, ${opts.type} value1, ${opts.type} value2) public {
    vm.assume(index1 != index2);
    value1 = ${opts.type}(bound(value1, 0, ${opts.max}));
    value2 = ${opts.type}(bound(value2, 0, ${opts.max}));

    ${opts.store}[0].set(index1, value1);
    ${opts.store}[1].set(index2, value2);

    assertEq(${opts.store}[0].get(index1), value1);
    assertEq(${opts.store}[1].get(index2), value2);
    assertEq(${opts.store}[0].get(index2), 0);
    assertEq(${opts.store}[1].get(index1), 0);
}
`;

const footer = `\
function _corruptValue(uint256 value) private pure returns (uint256 corrupted) {
    // Simulate assembly corruption by adding high bits
    assembly {
        corrupted := or(value, shl(200, 0xffffffff))
    }
}
`;

// GENERATE
module.exports = format(
  header,
  `contract BitMapsTest is Test {`,
  format(
    [].concat(
      `using BitMaps for *;`,
      ``,
      bitmapTests,
      TYPES.map(opts => Object.assign(opts, { store: `_${opts.name.toLowerCase()}s` }))
        .flatMap(opts => [
          `// ========== ${opts.name} Tests ==========`,
          ``,
          `BitMaps.${opts.name}[2] private ${opts.store};`,
          ``,
          testSymbolicSetAndGet(opts),
          opts.bits < 8 && testSymbolicTruncation(opts),
          opts.bits >= 8 && testSymbolicAssemblyCorruption(opts),
          testSymbolicIsolation(opts),
        ])
        .filter(e => typeof e == 'string'),
      footer,
    ),
  ).trimEnd(),
  '}',
);
