const format = require('../format-lines');
const { capitalize } = require('../../helpers');
const { TYPES } = require('./Slot.opts');

const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {SlotDerivation} from "@openzeppelin/contracts/utils/SlotDerivation.sol";
`;

const array = `\
bytes[] private _array;

function testDeriveArray(uint256 length, uint256 offset) public {
  length = bound(length, 1, type(uint256).max);
  offset = bound(offset, 0, length - 1);

  bytes32 baseSlot;
  assembly {
    baseSlot := _array.slot
    sstore(baseSlot, length) // store length so solidity access does not revert
  }

  bytes storage derived = _array[offset];
  bytes32 derivedSlot;
  assembly {
    derivedSlot := derived.slot
  }

  assertEq(baseSlot.deriveArray().offset(offset), derivedSlot);
}
`;

const mapping = ({ type, name, isValueType }) => `\
mapping(${type} => bytes) private _${type}Mapping;

function testDeriveMapping${name}(${type} ${isValueType ? '' : 'memory'} key) public {
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
  'contract SlotDerivationTest is Test {',
  'using SlotDerivation for bytes32;',
  '',
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
