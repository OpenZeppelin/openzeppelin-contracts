const format = require('../format-lines');
const { TYPES } = require('./Slot.opts');

const header = `\
pragma solidity ^0.8.24;

import {TypedSlot} from "./types/TypedSlot.sol";

/**
 * @dev Library for reading and writing primitive types to specific storage slots. This is a variant of {StorageSlot}
 * that supports transient storage.
 *
 * The functions in this library return types that give access to reading or writting primitives.
 *
 * Example usage:
 * \`\`\`solidity
 * contract ReentrancyGuard {
 *     using TypedSlot for bytes32;
 *     using TransientSlot for *;
 *
 *     bytes32 internal constant _REENTRANCY_SLOT = 0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;
 *
 *     modifier nonReentrant() {
 *         require(!_REENTRANCY_SLOT.asBooleanSlot().tload());
 *
 *         _REENTRANCY_SLOT.asBooleanSlot().tstore(true);
 *         _;
 *         _REENTRANCY_SLOT.asBooleanSlot().tstore(false);
 *     }
 * }
 * \`\`\`
 */
`;

const transient = ({ type, name }) => `\
/**
 * @dev Load the value held at location \`slot\` in transient storage.
 */
function tload(TypedSlot.${name}SlotType slot) internal view returns (${type} value) {
  /// @solidity memory-safe-assembly
  assembly {
    value := tload(slot)
  }
}

/**
 * @dev Store \`value\` at location \`slot\` in transient storage.
 */
function tstore(TypedSlot.${name}SlotType slot, ${type} value) internal {
  /// @solidity memory-safe-assembly
  assembly {
    tstore(slot, value)
  }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library TransientSlot {',
  TYPES.filter(type => type.isValueType).map(type => transient(type)),
  '}',
);
