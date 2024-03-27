const format = require('../format-lines');
const { TYPES } = require('./Slots.opts');

const header = `\
pragma solidity ^0.8.24;

import {Multicall} from "../utils/Multicall.sol";
import {Slots} from "../utils/Slots.sol";
`;

const common = () => `\
using Slots for *;

function erc1967slot(string memory path) public pure returns (bytes32 slot) {
  return path.erc1967slot();
}

function erc7201slot(string memory path) public pure returns (bytes32 slot) {
  return path.erc7201slot();
}
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
  common(),
  TYPES.flatMap(t => generate(t)),
  '}',
);
