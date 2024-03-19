const format = require('../format-lines');
const { capitalize } = require('../../helpers');
const { TYPES } = require('./StorageSlot.opts');

const header = `\
pragma solidity ^0.8.24;

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

const array = `\
bytes[] private _array;

function testArray(uint256 length, uint256 offset) public {
  length = bound(length, 1, type(uint256).max);
  offset = bound(offset, 0, length - 1);

  bytes32 baseSlot;
  assembly {
    baseSlot := _array.slot
  }
  baseSlot.asUint256Slot().sstore(length);

  bytes storage derived = _array[offset];
  bytes32 derivedSlot;
  assembly {
    derivedSlot := derived.slot
  }

  assertEq(baseSlot.asUint256Slot().sload(), _array.length);
  assertEq(baseSlot.deriveArray().offset(offset), derivedSlot);
}
`;

const mapping = ({ type, name, isValueType }) => `\
mapping(${type} => bytes) private _${type}Mapping;

function testMapping${name}(${type} ${isValueType ? '' : 'memory'} key) public {
  bytes32 baseSlot;
  assembly {
    baseSlot := _${type}Mapping.slot
  }

  bytes storage derived = _${type}Mapping[key];
  bytes32 derivedSlot;
  assembly {
    derivedSlot := derived.slot
  }

  assertEq(baseSlot.deriveMapping(key), derivedSlot);
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  '// solhint-disable func-name-mixedcase',
  'contract StorageSlotTest is Test {',
  'using StorageSlot for *;',
  '',
  // bool is not using a full word, solidity allocation packs such values
  TYPES.filter(type => type.isValueType && type.type !== 'bool').map(type => variable(type)),
  array,
  TYPES.flatMap(type =>
    [].concat(
      type,
      (type.variants ?? []).map(variant => ({
        type: variant,
        name: capitalize(variant),
        isValueType: type.isValueType,
      })),
    ),
  ).map(type => mapping(type)),
  '}',
);
