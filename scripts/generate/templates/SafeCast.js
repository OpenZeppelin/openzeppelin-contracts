const assert = require('assert');
const format = require('../format-lines');
const { range } = require('../../helpers');

const LENGTHS = range(8, 256, 8).reverse(); // 248 → 8 (in steps of 8)

// Returns the version of OpenZeppelin Contracts in which a particular function was introduced.
// This is used in the docs for each function.
const version = (selector, length) => {
  switch (selector) {
    case 'toUint(uint)': {
      switch (length) {
        case 8:
        case 16:
        case 32:
        case 64:
        case 128:
          return '2.5';
        case 96:
        case 224:
          return '4.2';
        default:
          assert(LENGTHS.includes(length));
          return '4.7';
      }
    }
    case 'toInt(int)': {
      switch (length) {
        case 8:
        case 16:
        case 32:
        case 64:
        case 128:
          return '3.1';
        default:
          assert(LENGTHS.includes(length));
          return '4.7';
      }
    }
    case 'toUint(int)': {
      switch (length) {
        case 256:
          return '3.0';
        default:
          assert(false);
          return;
      }
    }
    case 'toInt(uint)': {
      switch (length) {
        case 256:
          return '3.0';
        default:
          assert(false);
          return;
      }
    }
    default:
      assert(false);
  }
};

const header = `\
pragma solidity ^0.8.19;

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
 */
`;

const errors = `\
  /**
   * @dev Value doesn't fit in an uint of \`bits\` size.
   */
  error SafeCastOverflowedUintDowncast(uint8 bits, uint256 value);
  
  /**
   * @dev An int value doesn't fit in an uint of \`bits\` size.
   */
  error SafeCastOverflowedIntToUint(int256 value);
  
  /**
   * @dev Value doesn't fit in an int of \`bits\` size.
   */
  error SafeCastOverflowedIntDowncast(uint8 bits, int256 value);
  
  /**
   * @dev An uint value doesn't fit in an int of \`bits\` size.
   */
  error SafeCastOverflowedUintToInt(uint256 value);
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
 *
 * _Available since v${version('toUint(uint)', length)}._
 */
function toUint${length}(uint256 value) internal pure returns (uint${length}) {
    if (value > type(uint${length}).max) {
      revert SafeCastOverflowedUintDowncast(${length}, value);
    }
    return uint${length}(value);
}
`;

/* eslint-disable max-len */
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
 * _Available since v${version('toInt(int)', length)}._
 */
function toInt${length}(int256 value) internal pure returns (int${length} downcasted) {
    downcasted = int${length}(value);
    if (downcasted != value) {
      revert SafeCastOverflowedIntDowncast(${length}, value);
    }
}
`;
/* eslint-enable max-len */

const toInt = length => `\
/**
 * @dev Converts an unsigned uint${length} into a signed int${length}.
 *
 * Requirements:
 *
 * - input must be less than or equal to maxInt${length}.
 *
 * _Available since v${version('toInt(uint)', length)}._
 */
function toInt${length}(uint${length} value) internal pure returns (int${length}) {
    // Note: Unsafe cast below is okay because \`type(int${length}).max\` is guaranteed to be positive
    if (value > uint${length}(type(int${length}).max)) {
      revert SafeCastOverflowedUintToInt(value);
    }
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
 *
 * _Available since v${version('toUint(int)', length)}._
 */
function toUint${length}(int${length} value) internal pure returns (uint${length}) {
    if (value < 0) {
      revert SafeCastOverflowedIntToUint(value);
    }
    return uint${length}(value);
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library SafeCast {',
  errors,
  [...LENGTHS.map(toUintDownCast), toUint(256), ...LENGTHS.map(toIntDownCast), toInt(256)],
  '}',
);
