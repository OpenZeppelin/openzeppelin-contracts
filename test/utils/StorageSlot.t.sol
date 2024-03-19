// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/StorageSlot.t.js.

pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";

// solhint-disable func-name-mixedcase
contract StorageSlotTest is Test {
    using StorageSlot for *;

    address private _addressVariable;

    function testValueAddress_1(address value) public {
        bytes32 slot;
        assembly {
            slot := _addressVariable.slot
        }

        // set in solidity
        _addressVariable = value;

        // read using Slots
        assertEq(slot.asAddressSlot().sload(), value);
    }

    function testValueAddress_2(address value) public {
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

    function testValueBytes32_1(bytes32 value) public {
        bytes32 slot;
        assembly {
            slot := _bytes32Variable.slot
        }

        // set in solidity
        _bytes32Variable = value;

        // read using Slots
        assertEq(slot.asBytes32Slot().sload(), value);
    }

    function testValueBytes32_2(bytes32 value) public {
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

    function testValueUint256_1(uint256 value) public {
        bytes32 slot;
        assembly {
            slot := _uint256Variable.slot
        }

        // set in solidity
        _uint256Variable = value;

        // read using Slots
        assertEq(slot.asUint256Slot().sload(), value);
    }

    function testValueUint256_2(uint256 value) public {
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

    function testValueInt256_1(int256 value) public {
        bytes32 slot;
        assembly {
            slot := _int256Variable.slot
        }

        // set in solidity
        _int256Variable = value;

        // read using Slots
        assertEq(slot.asInt256Slot().sload(), value);
    }

    function testValueInt256_2(int256 value) public {
        bytes32 slot;
        assembly {
            slot := _int256Variable.slot
        }

        // set using Slots
        slot.asInt256Slot().sstore(value);

        // read in solidity
        assertEq(_int256Variable, value);
    }

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

    mapping(address => bytes) private _addressMapping;

    function testMappingAddress(address key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _addressMapping.slot
        }

        bytes storage derived = _addressMapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }

    mapping(bool => bytes) private _boolMapping;

    function testMappingBoolean(bool key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _boolMapping.slot
        }

        bytes storage derived = _boolMapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }

    mapping(bytes32 => bytes) private _bytes32Mapping;

    function testMappingBytes32(bytes32 key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _bytes32Mapping.slot
        }

        bytes storage derived = _bytes32Mapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }

    mapping(bytes4 => bytes) private _bytes4Mapping;

    function testMappingBytes4(bytes4 key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _bytes4Mapping.slot
        }

        bytes storage derived = _bytes4Mapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }

    mapping(uint256 => bytes) private _uint256Mapping;

    function testMappingUint256(uint256 key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _uint256Mapping.slot
        }

        bytes storage derived = _uint256Mapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }

    mapping(uint32 => bytes) private _uint32Mapping;

    function testMappingUint32(uint32 key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _uint32Mapping.slot
        }

        bytes storage derived = _uint32Mapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }

    mapping(int256 => bytes) private _int256Mapping;

    function testMappingInt256(int256 key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _int256Mapping.slot
        }

        bytes storage derived = _int256Mapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }

    mapping(int32 => bytes) private _int32Mapping;

    function testMappingInt32(int32 key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _int32Mapping.slot
        }

        bytes storage derived = _int32Mapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }

    mapping(string => bytes) private _stringMapping;

    function testMappingString(string memory key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _stringMapping.slot
        }

        bytes storage derived = _stringMapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }

    mapping(bytes => bytes) private _bytesMapping;

    function testMappingBytes(bytes memory key) public {
        bytes32 baseSlot;
        assembly {
            baseSlot := _bytesMapping.slot
        }

        bytes storage derived = _bytesMapping[key];
        bytes32 derivedSlot;
        assembly {
            derivedSlot := derived.slot
        }

        assertEq(baseSlot.deriveMapping(key), derivedSlot);
    }
}
