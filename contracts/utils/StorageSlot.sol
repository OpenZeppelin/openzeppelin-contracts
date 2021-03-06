// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library StorageSlot {
    struct AddressSlot {
        address value;
    }

    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage result) {
        assembly {
            result.slot := slot
        }
    }

    // TODO: add other types (bytes32, uint256, ...)
}
