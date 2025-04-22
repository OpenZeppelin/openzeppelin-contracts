const format = require('../format-lines');
const { capitalize } = require('../../helpers');
const { TYPES } = require('./Slot.opts');

const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SymTest} from "halmos-cheatcodes/SymTest.sol";
import {SlotDerivation} from "@openzeppelin/contracts/utils/SlotDerivation.sol";
`;

const array = `\
bytes[] private _array;

function symbolicDeriveArray(uint256 length, uint256 offset) public {
    vm.assume(length > 0);
    vm.assume(offset < length);
    _assertDeriveArray(length, offset);
}

function testDeriveArray(uint256 length, uint256 offset) public {
    length = bound(length, 1, type(uint256).max);
    offset = bound(offset, 0, length - 1);
    _assertDeriveArray(length, offset);
}

function _assertDeriveArray(uint256 length, uint256 offset) public {
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

const mapping = ({ type, name }) => `\
mapping(${type} => bytes) private _${type}Mapping;

function testSymbolicDeriveMapping${name}(${type} key) public view {
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

const mappingDirty = ({ type, name }) => `\
function testSymbolicDeriveMapping${name}Dirty(bytes32 dirtyKey) public {
    ${type} key;
    assembly {
        key := dirtyKey
    }

    // run the "normal" test using a potentially dirty value
    testSymbolicDeriveMapping${name}(key);
}
`;

const boundedMapping = ({ type, name }) => `\
mapping(${type} => bytes) private _${type}Mapping;

function testDeriveMapping${name}(${type} memory key) public view {
    _assertDeriveMapping${name}(key);
}

function symbolicDeriveMapping${name}() public view {
    _assertDeriveMapping${name}(svm.create${name}(256, "DeriveMapping${name}Input"));
}

function _assertDeriveMapping${name}(${type} memory key) internal view {
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
  header,
  'contract SlotDerivationTest is Test, SymTest {',
  format(
    [].concat(
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
      ).map(type => (type.isValueType ? mapping(type) : boundedMapping(type))),
      mappingDirty(TYPES.bool),
      mappingDirty(TYPES.address),
    ),
  ).trimEnd(),
  '}',
);
