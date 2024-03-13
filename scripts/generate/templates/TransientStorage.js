const format = require('../format-lines');
const { capitalize } = require('../../helpers');

const TYPES = ['address', 'bool', 'bytes32', 'uint256'];

const header = `\
pragma solidity ^0.8.24;

/**
 * @dev Library for reading and writing transient storage.
 *
 * Note: This library only works on networks where EIP-1153 is available.
 */
`;

const load = type => `\
/**
 * @dev Returns the transient slot \`slot\` as a \`${type}\`.
 */
function load${capitalize(type)}(bytes32 slot) internal view returns (${type} r) {
  /// @solidity memory-safe-assembly
  assembly {
      r := tload(slot)
  }
}
`;

const store = type => `\
/**
 * @dev Store \`value\` in the transient slot \`store\`.
 */
function store(bytes32 slot, ${type} value) internal {
  /// @solidity memory-safe-assembly
  assembly {
      tstore(slot, value)
  }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library TransientStorage {',
  TYPES.flatMap(type => load(type)),
  TYPES.flatMap(type => store(type)),
  '}',
);
