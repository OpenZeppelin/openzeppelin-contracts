const format = require('../format-lines');
const { TYPES } = require('./Slot.opts');

const header = `\
pragma solidity ^0.8.20;

/**
 * @dev Library for representing bytes32 slot as typed objects.
 */
`;

const udvt = ({ type, name }) => `\
/**
 * @dev UDVT that represent a slot holding a ${type}.
 */
type ${name}SlotType is bytes32;

/**
 * @dev Cast an arbitrary slot to a ${name}SlotType.
 */
function as${name}Slot(bytes32 slot) internal pure returns (${name}SlotType) {
  return ${name}SlotType.wrap(slot);
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library TypedSlot {',
  TYPES.filter(type => type.isValueType).map(type => udvt(type)),
  '}',
);
