const format = require('../format-lines');
const { TYPES } = require('./Slot.opts');

const header = `\
pragma solidity ^0.8.20;

/**
 * @dev Library for computing storage (and transient storage) locations from namespaces and deriving slots
 * corresponding to standard patterns. The derivation method for array and mapping matches the storage layout used by
 * the solidity language / compiler.
 *
 * See https://docs.soliditylang.org/en/v0.8.20/internals/layout_in_storage.html#mappings-and-dynamic-arrays[Solidity docs for mappings and dynamic arrays.].
 */
`;

const namespace = `\
/**
 * @dev Derive an ERC-1967 slot from a string (namespace).
 */
function erc1967slot(string memory namespace) internal pure returns (bytes32 slot) {
  /// @solidity memory-safe-assembly
  assembly {
      slot := sub(keccak256(add(namespace, 0x20), mload(namespace)), 1)
  }
}

/**
 * @dev Derive an ERC-7201 slot from a string (namespace).
 */
function erc7201slot(string memory namespace) internal pure returns (bytes32 slot) {
  /// @solidity memory-safe-assembly
  assembly {
      mstore(0x00, sub(keccak256(add(namespace, 0x20), mload(namespace)), 1))
      slot := and(keccak256(0x00, 0x20), not(0xff))
  }
}
`;

const array = `\
/**
 * @dev Add an offset to a slot to get the n-th element of a structure or an array.
 */
function offset(bytes32 slot, uint256 pos) internal pure returns (bytes32 result) {
  unchecked {
      return bytes32(uint256(slot) + pos);
  }
}

/**
 * @dev Derive the location of the first element in an array from the slot where the length is stored.
 */
function deriveArray(bytes32 slot) internal pure returns (bytes32 result) {
  /// @solidity memory-safe-assembly
  assembly {
      mstore(0x00, slot)
      result := keccak256(0x00, 0x20)
  }
}
`;

const mapping = ({ type }) => `\
/**
 * @dev Derive the location of a mapping element from the key.
 */
function deriveMapping(bytes32 slot, ${type} key) internal pure returns (bytes32 result) {
  /// @solidity memory-safe-assembly
  assembly {
      mstore(0x00, key)
      mstore(0x20, slot)
      result := keccak256(0x00, 0x40)
  }
}
`;

const mapping2 = ({ type }) => `\
/**
 * @dev Derive the location of a mapping element from the key.
 */
function deriveMapping(bytes32 slot, ${type} memory key) internal pure returns (bytes32 result) {
  /// @solidity memory-safe-assembly
  assembly {
    let length := mload(key)
    let begin :=  add(key, 0x20)
    let end := add(begin, length)
    let cache := mload(end)
    mstore(end, slot)
    result := keccak256(begin, add(length, 0x20))
    mstore(end, cache)
  }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library SlotDerivation {',
  namespace,
  array,
  TYPES.flatMap(type => (type.isValueType ? mapping(type) : mapping2(type))),
  '}',
);
