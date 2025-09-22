// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/SlotDerivation.t.js.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SymTest} from "halmos-cheatcodes/SymTest.sol";
import {SlotDerivation} from "@openzeppelin/contracts/utils/SlotDerivation.sol";

contract SlotDerivationTest is Test, SymTest {
    using SlotDerivation for bytes32;

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

    mapping(address => bytes) private _addressMapping;

    function testSymbolicDeriveMappingAddress(address key) public view {
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

    function testSymbolicDeriveMappingBoolean(bool key) public view {
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

    function testSymbolicDeriveMappingBytes32(bytes32 key) public view {
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

    function testSymbolicDeriveMappingBytes4(bytes4 key) public view {
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

    function testSymbolicDeriveMappingUint256(uint256 key) public view {
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

    function testSymbolicDeriveMappingUint32(uint32 key) public view {
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

    function testSymbolicDeriveMappingInt256(int256 key) public view {
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

    function testSymbolicDeriveMappingInt32(int32 key) public view {
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

    function testDeriveMappingString(string memory key) public view {
        _assertDeriveMappingString(key);
    }

    function symbolicDeriveMappingString() public view {
        _assertDeriveMappingString(svm.createString(256, "DeriveMappingStringInput"));
    }

    function _assertDeriveMappingString(string memory key) internal view {
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

    function testDeriveMappingBytes(bytes memory key) public view {
        _assertDeriveMappingBytes(key);
    }

    function symbolicDeriveMappingBytes() public view {
        _assertDeriveMappingBytes(svm.createBytes(256, "DeriveMappingBytesInput"));
    }

    function _assertDeriveMappingBytes(bytes memory key) internal view {
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

    function testSymbolicDeriveMappingBooleanDirty(bytes32 dirtyKey) public view {
        bool key;
        assembly {
            key := dirtyKey
        }

        // run the "normal" test using a potentially dirty value
        testSymbolicDeriveMappingBoolean(key);
    }

    function testSymbolicDeriveMappingAddressDirty(bytes32 dirtyKey) public view {
        address key;
        assembly {
            key := dirtyKey
        }

        // run the "normal" test using a potentially dirty value
        testSymbolicDeriveMappingAddress(key);
    }
}
