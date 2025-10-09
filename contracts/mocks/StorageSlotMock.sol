// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/StorageSlotMock.js.

pragma solidity ^0.8.20;

import {Multicall} from "../utils/Multicall.sol";
import {StorageSlot} from "../utils/StorageSlot.sol";

contract StorageSlotMock is Multicall {
    using StorageSlot for *;

    function setAddressSlot(bytes32 slot, address value) public {
        slot.getAddressSlot().value = value;
    }

    function setBooleanSlot(bytes32 slot, bool value) public {
        slot.getBooleanSlot().value = value;
    }

    function setBytes32Slot(bytes32 slot, bytes32 value) public {
        slot.getBytes32Slot().value = value;
    }

    function setUint256Slot(bytes32 slot, uint256 value) public {
        slot.getUint256Slot().value = value;
    }

    function setInt256Slot(bytes32 slot, int256 value) public {
        slot.getInt256Slot().value = value;
    }

    function getAddressSlot(bytes32 slot) public view returns (address) {
        return slot.getAddressSlot().value;
    }

    function getBooleanSlot(bytes32 slot) public view returns (bool) {
        return slot.getBooleanSlot().value;
    }

    function getBytes32Slot(bytes32 slot) public view returns (bytes32) {
        return slot.getBytes32Slot().value;
    }

    function getUint256Slot(bytes32 slot) public view returns (uint256) {
        return slot.getUint256Slot().value;
    }

    function getInt256Slot(bytes32 slot) public view returns (int256) {
        return slot.getInt256Slot().value;
    }

    mapping(uint256 key => string) public stringMap;

    function setStringSlot(bytes32 slot, string calldata value) public {
        slot.getStringSlot().value = value;
    }

    function setStringStorage(uint256 key, string calldata value) public {
        stringMap[key].getStringSlot().value = value;
    }

    function getStringSlot(bytes32 slot) public view returns (string memory) {
        return slot.getStringSlot().value;
    }

    function getStringStorage(uint256 key) public view returns (string memory) {
        return stringMap[key].getStringSlot().value;
    }

    mapping(uint256 key => bytes) public bytesMap;

    function setBytesSlot(bytes32 slot, bytes calldata value) public {
        slot.getBytesSlot().value = value;
    }

    function setBytesStorage(uint256 key, bytes calldata value) public {
        bytesMap[key].getBytesSlot().value = value;
    }

    function getBytesSlot(bytes32 slot) public view returns (bytes memory) {
        return slot.getBytesSlot().value;
    }

    function getBytesStorage(uint256 key) public view returns (bytes memory) {
        return bytesMap[key].getBytesSlot().value;
    }
}
