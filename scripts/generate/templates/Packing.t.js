const format = require('../format-lines');
const { capitalize, product } = require('../../helpers');
const { TYPES, findType } = require('./Packing.opts');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Packing} from "@openzeppelin/contracts/utils/Packing.sol";
`;

const test = ({ left, right }) => `\
  function testPackExtract(${left.uint} left, ${right.uint} right) external {
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

// GENERATE
module.exports = format(
  header.trimEnd(),
  'contract PackingTest is Test {',
  'using Packing for *;',
  '',
  '/// forge-config: default.fuzz.runs = 100',
  product(TYPES, TYPES)
    .filter(([left, right]) => findType(left.size + right.size))
    .map(([left, right]) => test({ left, right })),
  '}',
);
