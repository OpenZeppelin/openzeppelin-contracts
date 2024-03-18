const format = require('../format-lines');
const { capitalize } = require('../../helpers');
const { TYPES } = require('./StorageSlot.opts');

const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";
`;

const variable = ({ type, name }) => `\
${type} private _${type}Variable;

function testValue${name}_1(${type} value) public {
  bytes32 slot;
  assembly {
    slot := _${type}Variable.slot
  }

  // set in solidity
  _${type}Variable = value;

  // read using Slots
  assertEq(slot.as${name}Slot().sload(), value);
}

function testValue${name}_2(${type} value) public {
  bytes32 slot;
  assembly {
    slot := _${type}Variable.slot
  }

  // set using Slots
  slot.as${name}Slot().sstore(value);

  // read in solidity
  assertEq(_${type}Variable, value);
}
`;

const array = ({ type, name }) => `\
${type}[] private _${type}Array;

function testArray${name}_1(${type}[] calldata values) public {
  bytes32 slot;
  assembly {
    slot := _${type}Array.slot
  }

  // set in solidity
  _${type}Array = values;

  // read using Slots
  assertEq(slot.asUint256Slot().sload(), values.length);
  for (uint256 i = 0; i < values.length; ++i) {
    assertEq(slot.deriveArray().offset(i).as${name}Slot().sload(), values[i]);
  }
}

function testArray${name}_2(${type}[] calldata values) public {
  bytes32 slot;
  assembly {
    slot := _${type}Array.slot
  }

  // set using Slots
  slot.asUint256Slot().sstore(values.length);
  for (uint256 i = 0; i < values.length; ++i) {
    slot.deriveArray().offset(i).as${name}Slot().sstore(values[i]);
  }

  // read in solidity
  assertEq(_${type}Array.length, values.length);
  for (uint256 i = 0; i < values.length; ++i) {
    assertEq(_${type}Array[i], values[i]);
  }
}
`;

const mapping = ({ type, name }) => `\
mapping(${type} => uint256) private _${type}Mapping;

function testMapping${name}_1(${type} key, uint256 value) public {
  bytes32 slot;
  assembly {
    slot := _${type}Mapping.slot
  }

  // set in solidity
  _${type}Mapping[key] = value;
  // read using Slots
  assertEq(slot.deriveMapping(key).asUint256Slot().sload(), value);
}

function testMapping${name}_2(${type} key, uint256 value) public {
  bytes32 slot;
  assembly {
    slot := _${type}Mapping.slot
  }

  // set using Slots
  slot.deriveMapping(key).asUint256Slot().sstore(value);

  // read in solidity
  assertEq(_${type}Mapping[key], value);
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  '// solhint-disable func-name-mixedcase',
  'contract StorageSlotTest is Test {',
  'using StorageSlot for *;',
  '',
  // bool is not using a full word, solidity allocation in storage is not right aligned
  TYPES.filter(type => type.isValueType && type.type !== 'bool').map(type => variable(type)),
  // bool is not using a full word, solidity allocation in storage is not right aligned
  TYPES.filter(type => type.isValueType && type.type !== 'bool').map(type => array(type)),
  TYPES.filter(type => type.isValueType).flatMap(type =>
    [].concat(
      mapping(type),
      (type.variants ?? []).map(variant => mapping({ type: variant, name: capitalize(variant) })),
    ),
  ),
  '}',
);
