// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/StorageSlot.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";

contract StorageSlotTest is Test {
    using StorageSlot for *;

    address private _addressVariable;

    function testValue_address1(address value) public {
        bytes32 slot;
        assembly {
            slot := _addressVariable.slot
        }

        // set in solidity
        _addressVariable = value;

        // read using Slots
        assertEq(slot.asAddressSlot().sload(), value);
    }

    function testValue_address2(address value) public {
        bytes32 slot;
        assembly {
            slot := _addressVariable.slot
        }

        // set using Slots
        slot.asAddressSlot().sstore(value);

        // read in solidity
        assertEq(_addressVariable, value);
    }

    bytes32 private _bytes32Variable;

    function testValue_bytes321(bytes32 value) public {
        bytes32 slot;
        assembly {
            slot := _bytes32Variable.slot
        }

        // set in solidity
        _bytes32Variable = value;

        // read using Slots
        assertEq(slot.asBytes32Slot().sload(), value);
    }

    function testValue_bytes322(bytes32 value) public {
        bytes32 slot;
        assembly {
            slot := _bytes32Variable.slot
        }

        // set using Slots
        slot.asBytes32Slot().sstore(value);

        // read in solidity
        assertEq(_bytes32Variable, value);
    }

    uint256 private _uint256Variable;

    function testValue_uint2561(uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _uint256Variable.slot
        }

        // set in solidity
        _uint256Variable = value;

        // read using Slots
        assertEq(slot.asUint256Slot().sload(), value);
    }

    function testValue_uint2562(uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _uint256Variable.slot
        }

        // set using Slots
        slot.asUint256Slot().sstore(value);

        // read in solidity
        assertEq(_uint256Variable, value);
    }

    int256 private _int256Variable;

    function testValue_int2561(int256 value) public {
        bytes32 slot;
        assembly {
            slot := _int256Variable.slot
        }

        // set in solidity
        _int256Variable = value;

        // read using Slots
        assertEq(slot.asInt256Slot().sload(), value);
    }

    function testValue_int2562(int256 value) public {
        bytes32 slot;
        assembly {
            slot := _int256Variable.slot
        }

        // set using Slots
        slot.asInt256Slot().sstore(value);

        // read in solidity
        assertEq(_int256Variable, value);
    }

    address[] private _addressArray;

    function testArray_address1(address[] calldata values) public {
        bytes32 slot;
        assembly {
            slot := _addressArray.slot
        }

        // set in solidity
        _addressArray = values;

        // read using Slots
        assertEq(slot.asUint256Slot().sload(), values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            assertEq(slot.deriveArray().offset(i).asAddressSlot().sload(), values[i]);
        }
    }

    function testArray_address2(address[] calldata values) public {
        bytes32 slot;
        assembly {
            slot := _addressArray.slot
        }

        // set using Slots
        slot.asUint256Slot().sstore(values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            slot.deriveArray().offset(i).asAddressSlot().sstore(values[i]);
        }

        // read in solidity
        assertEq(_addressArray.length, values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            assertEq(_addressArray[i], values[i]);
        }
    }

    bytes32[] private _bytes32Array;

    function testArray_bytes321(bytes32[] calldata values) public {
        bytes32 slot;
        assembly {
            slot := _bytes32Array.slot
        }

        // set in solidity
        _bytes32Array = values;

        // read using Slots
        assertEq(slot.asUint256Slot().sload(), values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            assertEq(slot.deriveArray().offset(i).asBytes32Slot().sload(), values[i]);
        }
    }

    function testArray_bytes322(bytes32[] calldata values) public {
        bytes32 slot;
        assembly {
            slot := _bytes32Array.slot
        }

        // set using Slots
        slot.asUint256Slot().sstore(values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            slot.deriveArray().offset(i).asBytes32Slot().sstore(values[i]);
        }

        // read in solidity
        assertEq(_bytes32Array.length, values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            assertEq(_bytes32Array[i], values[i]);
        }
    }

    uint256[] private _uint256Array;

    function testArray_uint2561(uint256[] calldata values) public {
        bytes32 slot;
        assembly {
            slot := _uint256Array.slot
        }

        // set in solidity
        _uint256Array = values;

        // read using Slots
        assertEq(slot.asUint256Slot().sload(), values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            assertEq(slot.deriveArray().offset(i).asUint256Slot().sload(), values[i]);
        }
    }

    function testArray_uint2562(uint256[] calldata values) public {
        bytes32 slot;
        assembly {
            slot := _uint256Array.slot
        }

        // set using Slots
        slot.asUint256Slot().sstore(values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            slot.deriveArray().offset(i).asUint256Slot().sstore(values[i]);
        }

        // read in solidity
        assertEq(_uint256Array.length, values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            assertEq(_uint256Array[i], values[i]);
        }
    }

    int256[] private _int256Array;

    function testArray_int2561(int256[] calldata values) public {
        bytes32 slot;
        assembly {
            slot := _int256Array.slot
        }

        // set in solidity
        _int256Array = values;

        // read using Slots
        assertEq(slot.asUint256Slot().sload(), values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            assertEq(slot.deriveArray().offset(i).asInt256Slot().sload(), values[i]);
        }
    }

    function testArray_int2562(int256[] calldata values) public {
        bytes32 slot;
        assembly {
            slot := _int256Array.slot
        }

        // set using Slots
        slot.asUint256Slot().sstore(values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            slot.deriveArray().offset(i).asInt256Slot().sstore(values[i]);
        }

        // read in solidity
        assertEq(_int256Array.length, values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            assertEq(_int256Array[i], values[i]);
        }
    }

    mapping(address => uint256) private _addressMapping;

    function testMapping_address1(address key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _addressMapping.slot
        }

        // set in solidity
        _addressMapping[key] = value;
        // read using Slots
        assertEq(slot.deriveMapping(key).asUint256Slot().sload(), value);
    }

    function testMapping_address2(address key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _addressMapping.slot
        }

        // set using Slots
        slot.deriveMapping(key).asUint256Slot().sstore(value);

        // read in solidity
        assertEq(_addressMapping[key], value);
    }

    mapping(bool => uint256) private _boolMapping;

    function testMapping_bool1(bool key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _boolMapping.slot
        }

        // set in solidity
        _boolMapping[key] = value;
        // read using Slots
        assertEq(slot.deriveMapping(key).asUint256Slot().sload(), value);
    }

    function testMapping_bool2(bool key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _boolMapping.slot
        }

        // set using Slots
        slot.deriveMapping(key).asUint256Slot().sstore(value);

        // read in solidity
        assertEq(_boolMapping[key], value);
    }

    mapping(bytes32 => uint256) private _bytes32Mapping;

    function testMapping_bytes321(bytes32 key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _bytes32Mapping.slot
        }

        // set in solidity
        _bytes32Mapping[key] = value;
        // read using Slots
        assertEq(slot.deriveMapping(key).asUint256Slot().sload(), value);
    }

    function testMapping_bytes322(bytes32 key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _bytes32Mapping.slot
        }

        // set using Slots
        slot.deriveMapping(key).asUint256Slot().sstore(value);

        // read in solidity
        assertEq(_bytes32Mapping[key], value);
    }

    mapping(uint256 => uint256) private _uint256Mapping;

    function testMapping_uint2561(uint256 key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _uint256Mapping.slot
        }

        // set in solidity
        _uint256Mapping[key] = value;
        // read using Slots
        assertEq(slot.deriveMapping(key).asUint256Slot().sload(), value);
    }

    function testMapping_uint2562(uint256 key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _uint256Mapping.slot
        }

        // set using Slots
        slot.deriveMapping(key).asUint256Slot().sstore(value);

        // read in solidity
        assertEq(_uint256Mapping[key], value);
    }

    mapping(int256 => uint256) private _int256Mapping;

    function testMapping_int2561(int256 key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _int256Mapping.slot
        }

        // set in solidity
        _int256Mapping[key] = value;
        // read using Slots
        assertEq(slot.deriveMapping(key).asUint256Slot().sload(), value);
    }

    function testMapping_int2562(int256 key, uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _int256Mapping.slot
        }

        // set using Slots
        slot.deriveMapping(key).asUint256Slot().sstore(value);

        // read in solidity
        assertEq(_int256Mapping[key], value);
    }
}
