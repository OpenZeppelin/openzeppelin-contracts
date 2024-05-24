const format = require('../format-lines');
const { capitalize, product } = require('../../helpers');
const { TYPES } = require('./Packing.opts');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytesXX.
 */
`;

const errors = `\
  error OutOfRangeAccess();
`;

const type = ({ type, bytes, uint }) => `\
  type ${type} is ${bytes};

  function as${type}(${bytes} self) internal pure returns (${type}) {
    return ${type}.wrap(self);
  }

  function as${type}(${uint} self) internal pure returns (${type}) {
    return ${type}.wrap(${bytes}(self));
  }

  function as${capitalize(bytes)}(${type} self) internal pure returns (${bytes}) {
    return ${type}.unwrap(self);
  }

  function as${capitalize(uint)}(${type} self) internal pure returns (${uint}) {
    return ${uint}(${type}.unwrap(self));
  }
`;

const pack = ({ left, right, packed }) => `\
  function pack(${left.type} left, ${right.type} right) internal pure returns (${packed.type} result) {
    assembly ("memory-safe") {
      result := or(left, shr(${8 * left.size}, right))
    }
  }
`;

const extract = ({ outer, inner }) => `\
  function extract${inner.size}(${outer.type} self, uint8 offset) internal pure returns (${inner.type} result) {
    if (offset > ${outer.size - inner.size}) revert OutOfRangeAccess();
    assembly ("memory-safe") {
      result := and(shl(mul(8, offset), self), shl(${256 - 8 * inner.size}, not(0)))
    }
  }
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Packing {',
  errors,
  TYPES.map(type),
  product(TYPES, TYPES)
    .filter(([left, right]) => left.size + right.size <= 32)
    .map(([left, right]) => pack({ left, right, packed: TYPES.find(t => t.size == left.size + right.size) })),
  product(TYPES, TYPES)
    .filter(([outer, inner]) => outer.size > inner.size)
    .map(([outer, inner]) => extract({ outer, inner })),
  '}',
);
