// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/StorageSlot.sol";

contract StorageSlotMock {
    using StorageSlot for bytes32;

    function setBoolean(bytes32 slot, bool value) public {
        slot.getBooleanSlot().value = value;
    }

    function setAddress(bytes32 slot, address value) public {
        slot.getAddressSlot().value = value;
    }

    function setBytes32(bytes32 slot, bytes32 value) public {
        slot.getBytes32Slot().value = value;
    }

    function setUint256(bytes32 slot, uint256 value) public {
        slot.getUint256Slot().value = value;
    }

    function getBoolean(bytes32 slot) public view returns (bool) {
        return slot.getBooleanSlot().value;
    }

    function getAddress(bytes32 slot) public view returns (address) {
        return slot.getAddressSlot().value;
    }

    function getBytes32(bytes32 slot) public view returns (bytes32) {
        return slot.getBytes32Slot().value;
    }

    function getUint256(bytes32 slot) public view returns (uint256) {
        return slot.getUint256Slot().value;
    }
}
