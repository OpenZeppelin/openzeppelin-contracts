const format = require('../format-lines');
const { TYPES } = require('./Slot.opts');

const header = `\
pragma solidity ^0.8.20;

import {Multicall} from "../utils/Multicall.sol";
import {StorageSlot} from "../utils/StorageSlot.sol";
`;

const storageSetValueType = ({ type, name }) => `\
function set${name}Slot(bytes32 slot, ${type} value) public {
    slot.get${name}Slot().value = value;
}
`;

const storageGetValueType = ({ type, name }) => `\
function get${name}Slot(bytes32 slot) public view returns (${type}) {
    return slot.get${name}Slot().value;
}
`;

const storageSetNonValueType = ({ type, name }) => `\
mapping(uint256 key => ${type}) public ${type}Map;

function set${name}Slot(bytes32 slot, ${type} calldata value) public {
    slot.get${name}Slot().value = value;
}

function set${name}Storage(uint256 key, ${type} calldata value) public {
    ${type}Map[key].get${name}Slot().value = value;
}

function get${name}Slot(bytes32 slot) public view returns (${type} memory) {
    return slot.get${name}Slot().value;
}

function get${name}Storage(uint256 key) public view returns (${type} memory) {
    return ${type}Map[key].get${name}Slot().value;
}
`;

// GENERATE
module.exports = format(
  header,
  'contract StorageSlotMock is Multicall {',
  format(
    [].concat(
      'using StorageSlot for *;',
      '',
      TYPES.filter(type => type.isValueType).map(type => storageSetValueType(type)),
      TYPES.filter(type => type.isValueType).map(type => storageGetValueType(type)),
      TYPES.filter(type => !type.isValueType).map(type => storageSetNonValueType(type)),
    ),
  ).trimEnd(),
  '}',
);
