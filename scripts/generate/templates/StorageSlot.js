const format = require('../format-lines');
const { capitalize, unique } = require('../../helpers');

const TYPES = [
  { type: 'address', isValueType: true, version: '4.1' },
  { type: 'bool', isValueType: true, name: 'Boolean', version: '4.1' },
  { type: 'bytes32', isValueType: true, version: '4.1' },
  { type: 'uint256', isValueType: true, version: '4.1' },
  { type: 'string', isValueType: false, version: '4.9' },
  { type: 'bytes', isValueType: false, version: '4.9' },
].map(type => Object.assign(type, { struct: (type.name ?? capitalize(type.type)) + 'Slot' }));

const VERSIONS = unique(TYPES.map(t => t.version)).map(
  version =>
    `_Available since v${version} for ${TYPES.filter(t => t.version == version)
      .map(t => `\`${t.type}\``)
      .join(', ')}._`,
);

const header = `\
pragma solidity ^0.8.0;

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
 *         require(Address.isContract(newImplementation), "ERC1967: new implementation is not a contract");
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * \`\`\`
 *
${VERSIONS.map(s => ` * ${s}`).join('\n')}
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
