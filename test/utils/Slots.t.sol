// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Slots} from "@openzeppelin/contracts/utils/Slots.sol";

contract SlotsTest is Test {
    using Slots for *;

    // Variable declarations
    uint256 private _variable;
    uint256[] private _array;
    mapping(address => uint256) private _mapping;

    // Tests
    function testValue1(uint256 value) public {
        // set in solidity
        _variable = value;
        // read using Slots
        assertEq(_getVariableSlot().asUint256Slot().sload(), value);
    }

    function testValue2(uint256 value) public {
        // set using Slots
        _getVariableSlot().asUint256Slot().sstore(value);
        // read in solidity
        assertEq(_variable, value);
    }

    function testArray1(uint256[] calldata values) public {
        // set in solidity
        _array = values;
        // read using Slots
        assertEq(_getArraySlot().asUint256Slot().sload(), values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            assertEq(_getArraySlot().deriveArray().offset(i).asUint256Slot().sload(), values[i]);
        }
    }

    function testArray2(uint256[] calldata values) public {
        // set using Slots
        _getArraySlot().asUint256Slot().sstore(values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            _getArraySlot().deriveArray().offset(i).asUint256Slot().sstore(values[i]);
        }
        // read in solidity
        assertEq(_array, values);
    }

    function testMapping1(address key, uint256 value) public {
        // set in solidity
        _mapping[key] = value;
        // read using Slots
        assertEq(_getMappingSlot().deriveMapping(key).asUint256Slot().sload(), value);
    }

    function testMapping2(address key, uint256 value) public {
        // set using Slots
        _getMappingSlot().deriveMapping(key).asUint256Slot().sstore(value);
        // read in solidity
        assertEq(_mapping[key], value);
    }

    // Slot extraction
    function _getVariableSlot() public pure returns (bytes32 slot) {
        assembly { slot := _variable.slot }
    }

    function _getArraySlot() public pure returns (bytes32 slot) {
        assembly { slot := _array.slot }
    }

    function _getMappingSlot() public pure returns (bytes32 slot) {
        assembly { slot := _mapping.slot }
    }
}