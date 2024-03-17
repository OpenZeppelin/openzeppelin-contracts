const format = require('../format-lines');
const { TYPES } = require('./Slots.opts');

const header = `\
pragma solidity ^0.8.24;

/**
 * @dev Library for reading and writing transient storage.
 *
 * Note: This library only works on networks where EIP-1153[https://eips.ethereum.org/EIPS/eip-1153] is available.
 */
`;

const tooling = () => `\
/**
 * @dev Add an offset to a slot to get the n-th element of a structure or an array.
 */
function offset(bytes32 slot, uint256 pos) internal pure returns (bytes32 result) {
  unchecked {
      return bytes32(uint256(slot) + pos);
  }
}

/**
 * @dev Derivate the location of the first element in an array from the slot where the length is stored.
 */
function derivateArray(bytes32 slot) internal pure returns (bytes32 result) {
  /// @solidity memory-safe-assembly
  assembly {
      mstore(0x00, slot)
      result := keccak256(0x00, 0x20)
  }
}
`;

const derivate = ({ type }) => `\
/**
 * @dev Derivate the location of a mapping element from the key.
 */
function derivateMapping(bytes32 slot, ${type} key) internal pure returns (bytes32 result) {
  /// @solidity memory-safe-assembly
  assembly {
      mstore(0x00, key)
      mstore(0x20, slot)
      result := keccak256(0x00, 0x40)
  }
}
`;

const generate = ({ udvt, type }) => `\
/**
 * @dev UDVT that represent a slot holding a ${type}.
 */
type ${udvt} is bytes32;

/**
 * @dev Cast an arbitrary slot to a ${udvt}.
 */
function as${udvt}(bytes32 slot) internal pure returns (${udvt}) {
  return ${udvt}.wrap(slot);
}

/**
 * @dev Load the value held at location \`slot\` in (normal) storage.
 */
function sload(${udvt} slot) internal view returns (${type} value) {
  /// @solidity memory-safe-assembly
  assembly {
    value := sload(slot)
  }
}

/**
 * @dev Store \`value\` at location \`slot\` in (normal) storage.
 */
function sstore(${udvt} slot, ${type} value) internal {
  /// @solidity memory-safe-assembly
  assembly {
    sstore(slot, value)
  }
}

/**
 * @dev Load the value held at location \`slot\` in transient storage.
 */
function tload(${udvt} slot) internal view returns (${type} value) {
  /// @solidity memory-safe-assembly
  assembly {
    value := tload(slot)
  }
}

/**
 * @dev Store \`value\` at location \`slot\` in transient storage.
 */
function tstore(${udvt} slot, ${type} value) internal {
  /// @solidity memory-safe-assembly
  assembly {
    tstore(slot, value)
  }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library Slots {',
  tooling(),
  TYPES.flatMap(t => derivate(t)),
  TYPES.flatMap(t => generate(t)),
  '}',
);
