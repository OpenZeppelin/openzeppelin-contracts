const { BYTES_PACK_SIZES } = require('./Packing.opts');
const format = require('../format-lines');
const { capitalize } = require('../../helpers');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {PackingBytes32, PackingBytes16, PackingBytes8, PackingBytes4} from "@openzeppelin/contracts/utils/Packing.sol";
`;

const tuple = (toUintType, packSize, prefix = 'arg') =>
  new Array(packSize).fill().map((_, i) => `${toUintType} ${prefix}${i}`);
const assertAt = packSize =>
  new Array(packSize)
    .fill()
    .map((_, i) => `assertEq(packed.at(${i}), arg${i})`)
    .join(';') + ';';
const assertRecovered = packSize =>
  new Array(packSize)
    .fill()
    .map((_, i) => `assertEq(recovered${i}, arg${i})`)
    .join(';') + ';';
const packArgs = packSize => new Array(packSize).fill().map((_, i) => `arg${i}`);

const template = (fromBytesSize, toUintType, packSize) => `\
/// @dev Pack a pair of arbitrary ${toUintType}, and check that split recovers the correct values
function test${capitalize(toUintType)}x${packSize}(${tuple(toUintType, packSize)}) external {
    PackingBytes${fromBytesSize}.${capitalize(
      toUintType,
    )}x${packSize} packed = PackingBytes${fromBytesSize}.pack(${packArgs(packSize)});
    ${assertAt(packSize)}

    (${tuple(toUintType, packSize, 'recovered')}) = packed.split();
    ${assertRecovered(packSize)}
}

/// @dev Split an arbitrary bytes${fromBytesSize} into a pair of ${toUintType}, and check that repack matches the input
function test${capitalize(toUintType)}x${packSize}(bytes${fromBytesSize} input) external {
    (${tuple(toUintType, packSize)}) = input.as${capitalize(toUintType)}x${packSize}().split();
    assertEq(PackingBytes${fromBytesSize}.pack(${packArgs(packSize)}).asBytes${fromBytesSize}(), input);
}
`;

// GENERATE
module.exports = format(
  header,
  Object.entries(BYTES_PACK_SIZES).map(([fromBytesSize, opts]) => {
    const entries = Object.entries(opts);
    return [
      `contract PackingBytes${fromBytesSize}Test is Test {`,
      `using PackingBytes${fromBytesSize} for *;`,
      ...entries.map(([toUintType, packSize]) => template(fromBytesSize, toUintType, packSize)),
      '}',
    ];
  }),
);
