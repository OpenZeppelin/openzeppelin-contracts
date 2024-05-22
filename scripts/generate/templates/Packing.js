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

const types = ({ type, field, bytes, integ, count, shift }) => `\
  type ${type} is ${bytes};

  error OutOfBoundAccess${type}(uint8);

  /// @dev Cast a ${bytes} into a ${type}
  function as${type}(${bytes} self) internal pure returns (${type}) {
    return ${type}.wrap(self);
  }

  /// @dev Cast a ${integ} into a ${type}
  function as${type}(${integ} self) internal pure returns (${type}) {
    return ${type}.wrap(${bytes}(self));
  }

  /// @dev Cast a ${type} into a ${bytes}
  function as${capitalize(bytes)}(${type} self) internal pure returns (${bytes}) {
    return ${type}.unwrap(self);
  }

  /// @dev Cast a ${type} into a ${integ}
  function as${capitalize(integ)}(${type} self) internal pure returns (${integ}) {
    return ${integ}(${type}.unwrap(self));
  }

  function at(${type} self, uint8 pos) internal pure returns (${field}) {
    if (pos > ${count - 1}) revert OutOfBoundAccess${type}(pos);
    return unsafeAt(self, pos);
  }

  function unsafeAt(${type} self, uint8 pos) internal pure returns (${field} result) {
    ${field} mask = type(${field}).max;
    assembly {
      result := and(shr(sub(${256 - shift}, mul(pos, ${shift})), self), mask)
    }
  }
`;

const utils = ({ type, field, count, shift }) => `\
  /// @dev Pack ${count} ${field} into a ${type}
  function pack(
    ${Array(count)
      .fill()
      .map((_, i) => `${field} arg${i}`)
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

  /// @dev Split a ${type} into ${count} ${field}
  function split(${type} self) internal pure returns (
    ${Array(count).fill(field).join(',')}
  ) {
    return (
      ${Array(count)
        .fill()
        .map((_, i) => `unsafeAt(self, ${i})`)
        .join(',')}
    );
  }
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Packing {',
  TYPES.flatMap(opts => [types(opts), opts.count <= 8 && utils(opts)]).filter(Boolean),
  '}',
);
