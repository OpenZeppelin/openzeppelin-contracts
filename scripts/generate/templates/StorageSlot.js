const format = require('../format-lines');
const { capitalize } = require('../../helpers');

const TYPES = [
  { type: 'address', isValueType: true },
  { type: 'bool', isValueType: true, name: 'Boolean' },
  { type: 'bytes32', isValueType: true },
  { type: 'uint256', isValueType: true },
  { type: 'string', isValueType: false },
  { type: 'bytes', isValueType: false },
].map(type => Object.assign(type, { struct: (type.name ?? capitalize(type.type)) + 'Slot' }));

const header = `\
pragma solidity ^0.8.20;

/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a \`value\` member that can be used to read or write.
 *
 * Example usage to set ERC1967 implementation slot:
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

const struct = type => `\
struct ${type.struct} {
  ${type.type} value;
}
`;

const get = type => `\
/**
 * @dev Returns an \`${type.struct}\` with member \`value\` located at \`slot\`.
 */
function get${type.struct}(bytes32 slot) internal pure returns (${type.struct} storage r) {
  /// @solidity memory-safe-assembly
  assembly {
      r.slot := slot
  }
}
`;

const getStorage = type => `\
/**
 * @dev Returns an \`${type.struct}\` representation of the ${type.type} storage pointer \`store\`.
 */
function get${type.struct}(${type.type} storage store) internal pure returns (${type.struct} storage r) {
  /// @solidity memory-safe-assembly
  assembly {
      r.slot := store.slot
  }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library StorageSlot {',
  [...TYPES.map(struct), ...TYPES.flatMap(type => [get(type), type.isValueType ? '' : getStorage(type)])],
  '}',
);
