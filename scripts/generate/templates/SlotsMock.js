const format = require('../format-lines');
const { TYPES } = require('./Slots.opts');

const header = `\
pragma solidity ^0.8.24;

import {Multicall} from "../utils/Multicall.sol";
import {Slots} from "../utils/Slots.sol";
`;

const generate = ({ udvt, type }) => `\
event ${udvt}Value(bytes32 slot, ${type} value);

function tload${udvt}(bytes32 slot) public {
  emit ${udvt}Value(slot, slot.as${udvt}().tload());
}

function tstore(bytes32 slot, ${type} value) public {
  slot.as${udvt}().tstore(value);
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'contract SlotsMock is Multicall {',
  'using Slots for *;',
  '',
  TYPES.flatMap(t => generate(t)),
  '}',
);
