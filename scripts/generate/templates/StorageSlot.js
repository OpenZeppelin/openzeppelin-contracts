const format = require('../format-lines');
const { capitalize } = require('../../helpers');

const TYPES = [
  { type: 'address', isValueType: true },
  { type: 'bool', isValueType: true, name: 'Boolean' },
  { type: 'bytes32', isValueType: true },
  { type: 'uint256', isValueType: true },
  { type: 'int256', isValueType: true },
  { type: 'string', isValueType: false },
  { type: 'bytes', isValueType: false },
].map(type => Object.assign(type, { name: (type.name ?? capitalize(type.type)) + 'Slot' }));

const header = `\
pragma solidity ^0.8.24;

/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a \`value\` member that can be used to read or write.
 *
 * Example usage to set ERC-1967 implementation slot:
 * \`\`\`solidity
 * contract ERC1967 {
 *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 *
 *     function _getImplementation() internal view returns (address) {
 *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
 *     }
 *
 *     function _setImplementation(address newImplementation) internal {
 *         require(newImplementation.code.length > 0);
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * \`\`\`
 */
`;

const tooling = `\
/**
 * @dev Derive an ERC-1967 slot from a string (path).
 */
function erc1967slot(string memory path) internal pure returns (bytes32 slot) {
  /// @solidity memory-safe-assembly
  assembly {
      slot := sub(keccak256(add(path, 0x20), mload(path)), 1)
  }
}

/**
 * @dev Derive an ERC-7201 slot from a string (path).
 */
function erc7201slot(string memory path) internal pure returns (bytes32 slot) {
  /// @solidity memory-safe-assembly
  assembly {
      mstore(0x00, sub(keccak256(add(path, 0x20), mload(path)), 1))
      slot := and(keccak256(0x00, 0x20), not(0xff))
  }
}

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
 *
 * See: https://docs.soliditylang.org/en/v0.8.20/internals/layout_in_storage.html#mappings-and-dynamic-arrays.
 */
function deriveArray(bytes32 slot) internal pure returns (bytes32 result) {
  /// @solidity memory-safe-assembly
  assembly {
      mstore(0x00, slot)
      result := keccak256(0x00, 0x20)
  }
}
`;

const derive = ({ type }) => `\
/**
 * @dev Derive the location of a mapping element from the key.
 *
 * See: https://docs.soliditylang.org/en/v0.8.20/internals/layout_in_storage.html#mappings-and-dynamic-arrays.
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

const struct = ({ type, name }) => `\
struct ${name} {
  ${type} value;
}

/**
 * @dev Returns an \`${name}\` with member \`value\` located at \`slot\`.
 */
function get${name}(bytes32 slot) internal pure returns (${name} storage r) {
  /// @solidity memory-safe-assembly
  assembly {
      r.slot := slot
  }
}
`;

const getStorage = ({ type, name }) => `\
/**
 * @dev Returns an \`${name}\` representation of the ${type} storage pointer \`store\`.
 */
function get${name}(${type} storage store) internal pure returns (${name} storage r) {
  /// @solidity memory-safe-assembly
  assembly {
      r.slot := store.slot
  }
}
`;

const udvt = ({ type, name }) => `\
/**
 * @dev UDVT that represent a slot holding a ${type}.
 */
type ${name}Type is bytes32;

/**
 * @dev Cast an arbitrary slot to a ${name}Type.
 */
function as${name}(bytes32 slot) internal pure returns (${name}Type) {
  return ${name}Type.wrap(slot);
}

/**
 * @dev Load the value held at location \`slot\` in (normal) storage.
 */
function sload(${name}Type slot) internal view returns (${type} value) {
  /// @solidity memory-safe-assembly
  assembly {
    value := sload(slot)
  }
}

/**
 * @dev Store \`value\` at location \`slot\` in (normal) storage.
 */
function sstore(${name}Type slot, ${type} value) internal {
  /// @solidity memory-safe-assembly
  assembly {
    sstore(slot, value)
  }
}

/**
 * @dev Load the value held at location \`slot\` in transient storage.
 */
function tload(${name}Type slot) internal view returns (${type} value) {
  /// @solidity memory-safe-assembly
  assembly {
    value := tload(slot)
  }
}

/**
 * @dev Store \`value\` at location \`slot\` in transient storage.
 */
function tstore(${name}Type slot, ${type} value) internal {
  /// @solidity memory-safe-assembly
  assembly {
    tstore(slot, value)
  }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library StorageSlot {',
  '/// Derivation tooling',
  tooling,
  TYPES.filter(type => type.isValueType).flatMap(type => derive(type)), // TODO support non-value type
  '/// Storage slots as structs',
  TYPES.flatMap(type => [
    struct(type),
    type.isValueType ? '' : getStorage(type)
  ]),
  '/// Storage slots as udvt',
  TYPES.filter(type => type.isValueType).map(type => udvt(type)),
  '}',
);
