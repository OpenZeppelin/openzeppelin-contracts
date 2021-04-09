// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library StorageSlot {
    struct AddressSlot { address value; }
    struct BooleanSlot { bool value; }
    struct Bytes32Slot { bytes32 value; }
    struct Uint256Slot { uint256 value; }

    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) { assembly { r.slot := slot } }
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) { assembly { r.slot := slot } }
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) { assembly { r.slot := slot } }
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) { assembly { r.slot := slot } }
}
