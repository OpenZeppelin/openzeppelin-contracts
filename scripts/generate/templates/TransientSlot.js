const format = require('../format-lines');
const { TYPES } = require('./Slot.opts');

const header = `\
pragma solidity ^0.8.24;

/**
 * @dev Library for reading and writing value-types to specific transient storage slots.
 *
 * Transient slots are often used to store temporary values that are removed after the current transaction.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 *  * Example reading and writing values using transient storage:
 * \`\`\`solidity
 * contract Lock {
 *     using TransientSlot for *;
 *
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _LOCK_SLOT = 0xf4678858b2b588224636b8522b729e7722d32fc491da849ed75b3fdf3c84f542;
 *
 *     modifier locked() {
 *         require(!_LOCK_SLOT.asBoolean().tload());
 *
 *         _LOCK_SLOT.asBoolean().tstore(true);
 *         _;
 *         _LOCK_SLOT.asBoolean().tstore(false);
 *     }
 * }
 * \`\`\`
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
`;

const udvt = ({ type, name }) => `\
/**
 * @dev UDVT that represent a slot holding a ${type}.
 */
type ${name}Slot is bytes32;

/**
 * @dev Cast an arbitrary slot to a ${name}Slot.
 */
function as${name}(bytes32 slot) internal pure returns (${name}Slot) {
    return ${name}Slot.wrap(slot);
}
`;

const transient = ({ type, name }) => `\
/**
 * @dev Load the value held at location \`slot\` in transient storage.
 */
function tload(${name}Slot slot) internal view returns (${type} value) {
    assembly ("memory-safe") {
        value := tload(slot)
    }
}

/**
 * @dev Store \`value\` at location \`slot\` in transient storage.
 */
function tstore(${name}Slot slot, ${type} value) internal {
    assembly ("memory-safe") {
        tstore(slot, value)
    }
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library TransientSlot {',
  format(
    [].concat(
      TYPES.filter(type => type.isValueType).map(type => udvt(type)),
      TYPES.filter(type => type.isValueType).map(type => transient(type)),
    ),
  ).trimEnd(),
  '}',
);
