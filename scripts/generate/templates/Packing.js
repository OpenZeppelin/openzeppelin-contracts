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

const types = ({ j, inner, outer, pack, shift }) => `\
  type ${outer} is ${pack};

  /// @dev Cast a ${pack} into a ${outer}
  function as${outer}(${pack} self) internal pure returns (${outer}) {
      return ${outer}.wrap(self);
  }

  /// @dev Cast a ${outer} into a ${pack}
  function as${capitalize(pack)}(${outer} self) internal pure returns (${pack}) {
      return ${outer}.unwrap(self);
  }

  function at(${outer} self, uint8 pos) internal pure returns (${inner}) {
    return ${inner}(bytes${j}(${outer}.unwrap(self) << (pos * ${shift})));
  }
`;

const utils = ({ j, inner, outer, pack, count, shift }) => `\
  /// @dev Pack ${count} ${inner} into a ${outer}
  function pack(
    ${Array(count)
      .fill()
      .map((_, i) => `${inner} arg${i}`)
      .join(',')}
  ) internal pure returns (${outer}) {
    return ${outer}.wrap(
      ${Array(count)
        .fill()
        .map((_, i) =>
          count == i + 1 ? `${pack}(bytes${j}(arg${i}))` : `${pack}(bytes${j}(arg${i})) << ${shift * (count - i - 1)}`,
        )
        .join('|')}
    );
  }

  /// @dev Split a ${outer} into ${count} ${inner}
  function split(${outer} self) internal pure returns (
    ${Array(count).fill(inner).join(',')}
  ) {
    return (
      ${Array(count)
        .fill()
        .map((_, i) => `at(self, ${i})`)
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
