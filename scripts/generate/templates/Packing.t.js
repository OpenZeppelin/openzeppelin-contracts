const format = require('../format-lines');
const { product } = require('../../helpers');
const { SIZES } = require('./Packing.opts');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Packing} from "@openzeppelin/contracts/utils/Packing.sol";
`;

const testPack = (left, right) => `\
function testSymbolicPack(bytes${left} left, bytes${right} right) external pure {
    assertEq(left, Packing.pack_${left}_${right}(left, right).extract_${left + right}_${left}(0));
    assertEq(right, Packing.pack_${left}_${right}(left, right).extract_${left + right}_${right}(${left}));
}
`;

const testReplace = (outer, inner) => `\
function testSymbolicReplace(bytes${outer} container, bytes${inner} newValue, uint8 offset) external pure {
    offset = uint8(bound(offset, 0, ${outer - inner}));

    bytes${inner} oldValue = container.extract_${outer}_${inner}(offset);

    assertEq(newValue, container.replace_${outer}_${inner}(newValue, offset).extract_${outer}_${inner}(offset));
    assertEq(container, container.replace_${outer}_${inner}(newValue, offset).replace_${outer}_${inner}(oldValue, offset));
}
`;

// GENERATE
module.exports = format(
  header,
  'contract PackingTest is Test {',
  format(
    [].concat(
      'using Packing for *;',
      '',
      product(SIZES, SIZES)
        .filter(([left, right]) => SIZES.includes(left + right))
        .map(([left, right]) => testPack(left, right)),
      product(SIZES, SIZES)
        .filter(([outer, inner]) => outer > inner)
        .map(([outer, inner]) => testReplace(outer, inner)),
    ),
  ).trimEnd(),
  '}',
);
