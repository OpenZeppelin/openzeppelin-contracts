const format = require('../format-lines');
const { capitalize, product } = require('../../helpers');
const { TYPES, findType } = require('./Packing.opts');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Packing} from "@openzeppelin/contracts/utils/Packing.sol";
`;

const testPack = ({ left, right }) => `\
  function testPack(${left.uint} left, ${right.uint} right) external {
    assertEq(
      left,
      Packing.pack(left.as${left.type}(), right.as${right.type}()).extract${left.size}(0).as${capitalize(left.uint)}()
    );
    assertEq(
      right,
      Packing.pack(left.as${left.type}(), right.as${right.type}()).extract${right.size}(${left.size}).as${capitalize(
        right.uint,
      )}()
    );
  }
`;

const testReplace = ({ outer, inner }) => `\
  function testReplace(${outer.uint} outer, ${inner.uint} inner, uint8 offset) external {
    offset = uint8(bound(offset, 0, ${outer.size - inner.size}));

    Packing.${outer.type} container = outer.as${outer.type}();
    Packing.${inner.type} newValue = inner.as${inner.type}();
    Packing.${inner.type} oldValue = container.extract${inner.size}(offset);

    assertEq(container.replace(newValue, offset).extract${inner.size}(offset).as${capitalize(
      inner.uint,
    )}(), newValue.as${capitalize(inner.uint)}());
    assertEq(container.replace(newValue, offset).replace(oldValue, offset).as${capitalize(
      outer.uint,
    )}(), container.as${capitalize(outer.uint)}());
  }
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'contract PackingTest is Test {',
  'using Packing for *;',
  '',
  product(TYPES, TYPES)
    .filter(([left, right]) => findType(left.size + right.size))
    .map(([left, right]) => testPack({ left, right })),
  product(TYPES, TYPES)
    .filter(([outer, inner]) => outer.size > inner.size)
    .map(([outer, inner]) => testReplace({ outer, inner })),
  '}',
);
