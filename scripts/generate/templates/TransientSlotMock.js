const format = require('../format-lines');
const { TYPES } = require('./Slot.opts');

const header = `\
pragma solidity ^0.8.24;

import {Multicall} from "../utils/Multicall.sol";
import {TransientSlot} from "../utils/TransientSlot.sol";
`;

const transient = ({ type, name }) => `\
event ${name}Value(bytes32 slot, ${type} value);

function tload${name}(bytes32 slot) public {
    emit ${name}Value(slot, slot.as${name}().tload());
}

function tstore(bytes32 slot, ${type} value) public {
    slot.as${name}().tstore(value);
}
`;

// GENERATE
module.exports = format(
  header,
  'contract TransientSlotMock is Multicall {',
  format(
    [].concat(
      'using TransientSlot for *;',
      '',
      TYPES.filter(type => type.isValueType).map(type => transient(type)),
    ),
  ).trimEnd(),
  '}',
);
