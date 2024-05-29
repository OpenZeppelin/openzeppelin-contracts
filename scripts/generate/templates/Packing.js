const format = require('../format-lines');
const { product } = require('../../helpers');
const { SIZES } = require('./Packing.opts');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytesXX.
 */
// solhint-disable func-name-mixedcase
`;

const errors = `\
  error OutOfRangeAccess();
`;

const pack = (left, right) => `\
  function pack_${left}_${right}(bytes${left} left, bytes${right} right) internal pure returns (bytes${
    left + right
  } result) {
    assembly ("memory-safe") {
      result := or(left, shr(${8 * left}, right))
    }
  }
`;

const extract = (outer, inner) => `\
  function extract_${outer}_${inner}(bytes${outer} self, uint8 offset) internal pure returns (bytes${inner} result) {
    if (offset > ${outer - inner}) revert OutOfRangeAccess();
    assembly ("memory-safe") {
      result := and(shl(mul(8, offset), self), shl(${256 - 8 * inner}, not(0)))
    }
  }
`;

const replace = (outer, inner) => `\
  function replace_${outer}_${inner}(
    bytes${outer} self,
    bytes${inner} value,
    uint8 offset
  ) internal pure returns (bytes${outer} result) {
    bytes${inner} oldValue = extract_${outer}_${inner}(self, offset);
    assembly ("memory-safe") {
      result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
    }
  }
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Packing {',
  errors,
  product(SIZES, SIZES)
    .filter(([left, right]) => SIZES.includes(left + right))
    .map(([left, right]) => pack(left, right)),
  product(SIZES, SIZES)
    .filter(([outer, inner]) => outer > inner)
    .flatMap(([outer, inner]) => [extract(outer, inner), replace(outer, inner)]),
  '}',
);
