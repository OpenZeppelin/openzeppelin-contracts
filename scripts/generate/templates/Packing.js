const format = require('../format-lines');
const sanitize = require('../helpers/sanitize');
const { product } = require('../../helpers');
const { SIZES } = require('./Packing.opts');

// TEMPLATE
const header = `\
pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytesXX.
 *
 * Example usage:
 *
 * \`\`\`solidity
 * library MyPacker {
 *     type MyType is bytes32;
 *
 *     function _pack(address account, bytes4 selector, uint64 period) external pure returns (MyType) {
 *         bytes12 subpack = Packing.pack_4_8(selector, bytes8(period));
 *         bytes32 pack = Packing.pack_20_12(bytes20(account), subpack);
 *         return MyType.wrap(pack);
 *     }
 *
 *     function _unpack(MyType self) external pure returns (address, bytes4, uint64) {
 *         bytes32 pack = MyType.unwrap(self);
 *         return (
 *             address(Packing.extract_32_20(pack, 0)),
 *             Packing.extract_32_4(pack, 20),
 *             uint64(Packing.extract_32_8(pack, 24))
 *         );
 *     }
 * }
 * \`\`\`
 *
 * _Available since v5.1._
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
        left := ${sanitize.bytes('left', left)}
        right := ${sanitize.bytes('right', right)}
        result := or(left, shr(${8 * left}, right))
    }
}
`;

const extract = (outer, inner) => `\
function extract_${outer}_${inner}(bytes${outer} self, uint8 offset) internal pure returns (bytes${inner} result) {
    if (offset > ${outer - inner}) revert OutOfRangeAccess();
    assembly ("memory-safe") {
        result := ${sanitize.bytes('shl(mul(8, offset), self)', inner)}
    }
}
`;

const replace = (outer, inner) => `\
function replace_${outer}_${inner}(bytes${outer} self, bytes${inner} value, uint8 offset) internal pure returns (bytes${outer} result) {
    bytes${inner} oldValue = extract_${outer}_${inner}(self, offset);
    assembly ("memory-safe") {
        value := ${sanitize.bytes('value', inner)}
        result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
    }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Packing {',
  format(
    [].concat(
      errors,
      product(SIZES, SIZES)
        .filter(([left, right]) => SIZES.includes(left + right))
        .map(([left, right]) => pack(left, right)),
      product(SIZES, SIZES)
        .filter(([outer, inner]) => outer > inner)
        .flatMap(([outer, inner]) => [extract(outer, inner), replace(outer, inner)]),
    ),
  ).trimEnd(),
  '}',
);
