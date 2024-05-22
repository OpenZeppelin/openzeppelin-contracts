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

const types = ({ inner, outer, pack, count, shift }) => `\
  type ${outer} is ${pack};

  error OutOfBoundAccess${outer}(uint8);

  /// @dev Cast a ${pack} into a ${outer}
  function as${outer}(${pack} self) internal pure returns (${outer}) {
    return ${outer}.wrap(self);
  }

  /// @dev Cast a ${outer} into a ${pack}
  function as${capitalize(pack)}(${outer} self) internal pure returns (${pack}) {
    return ${outer}.unwrap(self);
  }

  function at(${outer} self, uint8 pos) internal pure returns (${inner}) {
    if (pos > ${count - 1}) revert OutOfBoundAccess${outer}(pos);
    return unsafeAt(self, pos);
  }

  function unsafeAt(${outer} self, uint8 pos) internal pure returns (${inner} result) {
    ${inner} mask = type(${inner}).max;
    assembly {
      result := and(shr(sub(${256 - shift}, mul(pos, ${shift})), self), mask)
    }
  }
`;

const utils = ({ inner, outer, count, shift }) => `\
  /// @dev Pack ${count} ${inner} into a ${outer}
  function pack(
    ${Array(count)
      .fill()
      .map((_, i) => `${inner} arg${i}`)
      .join(',')}
  ) internal pure returns (${outer} result) {
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

  /// @dev Split a ${outer} into ${count} ${inner}
  function split(${outer} self) internal pure returns (
    ${Array(count).fill(inner).join(',')}
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
