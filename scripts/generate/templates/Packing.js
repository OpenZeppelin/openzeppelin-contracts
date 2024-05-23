const format = require('../format-lines');
const { capitalize } = require('../../helpers');

const { TYPES } = require('./Packing.opts');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytesXX.
 */
`;

const types = ({ type, block, field, count, shift }) => `\
  type ${type} is ${block.b};

  error OutOfBoundAccess${type}(uint8);

  /// @dev Cast a ${block.b} into a ${type}
  function as${type}(${block.b} self) internal pure returns (${type}) {
    return ${type}.wrap(self);
  }

  /// @dev Cast a ${block.u} into a ${type}
  function as${type}(${block.u} self) internal pure returns (${type}) {
    return ${type}.wrap(${block.b}(self));
  }

  /// @dev Cast a ${type} into a ${block.b}
  function as${capitalize(block.b)}(${type} self) internal pure returns (${block.b}) {
    return ${type}.unwrap(self);
  }

  /// @dev Cast a ${type} into a ${block.u}
  function as${capitalize(block.u)}(${type} self) internal pure returns (${block.u}) {
    return ${block.u}(${type}.unwrap(self));
  }

  function at(${type} self, uint8 pos) internal pure returns (${field.u}) {
    if (pos > ${count - 1}) revert OutOfBoundAccess${type}(pos);
    return unsafeAt(self, pos);
  }

  function unsafeAt(${type} self, uint8 pos) internal pure returns (${field.u}) {
    unchecked {
      return ${field.u}(${field.b}(_extractLeftmostBits(bytes32(${type}.unwrap(self)), ${shift} * pos, ${shift})));
    }
  }
`;

const utils = ({ type, field, count, shift }) => `\
  /// @dev Pack ${count} ${field.u} into a ${type}
  function pack(
    ${Array(count)
      .fill()
      .map((_, i) => `${field.u} arg${i}`)
      .join(',')}
  ) internal pure returns (${type} result) {
    assembly {
      ${Array(count)
        .fill()
        .map((_, i) =>
          i == 0
            ? `result := shr(${256 - shift * (i + 1)}, arg${i})`
            : `result := or(result, shr(${256 - shift * (i + 1)}, arg${i}))`,
        )
        .join('\n')}
    }
  }

  /// @dev Split a ${type} into ${count} ${field.u}
  function split(${type} self) internal pure returns (
    ${Array(count).fill(field.u).join(',')}
  ) {
    return (
      ${Array(count)
        .fill()
        .map((_, i) => `unsafeAt(self, ${i})`)
        .join(',')}
    );
  }
`;

const helpers = `\
  function _extractLeftmostBits(bytes32 input, uint8 offset, uint8 count) private pure returns (bytes32 output) {
    assembly {
      output := and(shl(offset, input), shl(sub(0x100, count), not(0)))
    }
  }
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Packing {',
  TYPES.flatMap(opts => [types(opts), opts.count <= 8 && utils(opts)]).filter(Boolean),
  helpers,
  '}',
);
