// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/SlotDerivation.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {SlotDerivation} from "@openzeppelin/contracts/utils/SlotDerivation.sol";

contract SlotDerivationTest is Test {
    using SlotDerivation for bytes32;

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

    mapping(address => bytes) private _addressMapping;

    function testDeriveMappingAddress(address key) public {
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

    function testDeriveMappingBoolean(bool key) public {
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

    function testDeriveMappingBytes32(bytes32 key) public {
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

    function testDeriveMappingBytes4(bytes4 key) public {
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

    function testDeriveMappingUint256(uint256 key) public {
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

    function testDeriveMappingUint32(uint32 key) public {
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

    function testDeriveMappingInt256(int256 key) public {
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

    function testDeriveMappingInt32(int32 key) public {
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

    function testDeriveMappingString(string memory key) public {
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

    function testDeriveMappingBytes(bytes memory key) public {
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
