const format = require('../format-lines');
const { TYPES } = require('./Slot.opts');

const header = `\
pragma solidity ^0.8.24;

import {TypedSlot} from "./types/TypedSlot.sol";

/**
 * @dev Library for reading and writing primitive types to specific storage slots. This is a variant of {StorageSlot}
 * that supports transient storage.
 *
 * The functions in this library return types that give access to reading or writing primitives.
 *
 * Example usage:
 * \`\`\`solidity
 * contract Lock {
 *     using TypedSlot for bytes32;
 *     using TransientSlot for *;
 *
 *     bytes32 internal constant _LOCK_SLOT = 0xf4678858b2b588224636b8522b729e7722d32fc491da849ed75b3fdf3c84f542;
 *
 *     modifier locked() {
 *         require(!_LOCK_SLOT.asBooleanSlot().tload());
 *
 *         _LOCK_SLOT.asBooleanSlot().tstore(true);
 *         _;
 *         _LOCK_SLOT.asBooleanSlot().tstore(false);
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
