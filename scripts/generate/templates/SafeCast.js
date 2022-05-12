const format = require('../format-lines');

const header = `\
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Wrappers over Solidity's uintXX/intXX casting operators with added overflow
 * checks.
 *
 * Downcasting from uint256/int256 in Solidity does not revert on overflow. This can
 * easily result in undesired exploitation or bugs, since developers usually
 * assume that overflows raise errors. \`SafeCast\` restores this intuition by
 * reverting the transaction when such an operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 *
 * Can be combined with {SafeMath} and {SignedSafeMath} to extend it to smaller types, by performing
 * all math on \`uint256\` and \`int256\` and then downcasting.
 */`;

const toInt = length => `\
/**
 * @dev Converts an unsigned uint${length} into a signed int${length}.
 *
 * Requirements:
 *
 * - input must be less than or equal to maxInt${length}.
 */
function toInt${length}(uint${length} value) internal pure returns (int${length}) {
    // Note: Unsafe cast below is okay because \`type(int${length}).max\` is guaranteed to be positive
    require(value <= uint${length}(type(int${length}).max), "SafeCast: value doesn't fit in an int${length}");
    return int${length}(value);
}
`;

const toUint = length => `\
/**
 * @dev Converts a signed int${length} into an unsigned uint${length}.
 *
 * Requirements:
 *
 * - input must be greater than or equal to 0.
 */
function toUint${length}(int${length} value) internal pure returns (uint${length}) {
    require(value >= 0, "SafeCast: value must be positive");
    return uint${length}(value);
}
`;

const toIntDownCast = length => `\
/**
 * @dev Returns the downcasted int${length} from int256, reverting on
 * overflow (when the input is less than smallest int${length} or
 * greater than largest int${length}).
 *
 * Counterpart to Solidity's \`int${length}\` operator.
 *
 * Requirements:
 *
 * - input must fit into ${length} bits
 *
 * _Available since v3.1._
 */
function toInt${length}(int256 value) internal pure returns (int${length}) {
    require(value >= type(int${length}).min && value <= type(int${length}).max, "SafeCast: value doesn't fit in ${length} bits");
    return int${length}(value);
}
`;

const toUintDownCast = length => `\
/**
 * @dev Returns the downcasted uint${length} from uint256, reverting on
 * overflow (when the input is greater than largest uint${length}).
 *
 * Counterpart to Solidity's \`uint${length}\` operator.
 *
 * Requirements:
 *
 * - input must fit into ${length} bits
 */
function toUint${length}(uint256 value) internal pure returns (uint${length}) {
    require(value <= type(uint${length}).max, "SafeCast: value doesn't fit in ${length} bits");
    return uint${length}(value);
}
`;

// GENERATE
const LENGTHS = Array(30).fill().map((_, i) => (i + 1) * 8).reverse(); // 224 → 8 (in steps of 8)

module.exports = format(
  header,
  'library SafeCast {',
  [
    ...LENGTHS.map(size => toUintDownCast(size)),
    toUint(256),
    ...LENGTHS.map(size => toIntDownCast(size)),
    toInt(256).trimEnd(),
  ].map(fn => fn.split('\n')),
  '}',
);
