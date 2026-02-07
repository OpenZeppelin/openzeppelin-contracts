const format = require('../format-lines');
const { TYPES } = require('./Slot.opts');

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
 * Example usage to set ERC-1967 implementation slot:
 * \`\`\`solidity
 * contract ERC1967 {
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
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
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
`;

const struct = ({ type, name }) => `\
struct ${name}Slot {
    ${type} value;
}
`;

const get = ({ name }) => `\
/**
 * @dev Returns ${
   name.toLowerCase().startsWith('a') ? 'an' : 'a'
 } \`${name}Slot\` with member \`value\` located at \`slot\`.
 */
function get${name}Slot(bytes32 slot) internal pure returns (${name}Slot storage r) {
    assembly ("memory-safe") {
        r.slot := slot
    }
}
`;

const getStorage = ({ type, name }) => `\
/**
 * @dev Returns an \`${name}Slot\` representation of the ${type} storage pointer \`store\`.
 */
function get${name}Slot(${type} storage store) internal pure returns (${name}Slot storage r) {
    assembly ("memory-safe") {
        r.slot := store.slot
    }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library StorageSlot {',
  format(
    [].concat(
      TYPES.map(type => struct(type)),
      TYPES.flatMap(type => [get(type), !type.isValueType && getStorage(type)].filter(Boolean)),
    ),
  ).trimEnd(),
  '}',
);
