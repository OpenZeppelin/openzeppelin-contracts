// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/TransientSlot.js.

pragma solidity ^0.8.24;

/**
 * @dev Library for reading and writing primitive types to specific storage slots. This is a variant of {StorageSlot}
 * that supports transient storage.
 *
 * The functions in this library return types that give access to reading or writting primitives.
 *
 * Example usage:
 * ```solidity
 * contract ReentrancyGuard {
 *     using TransientSlot for *;
 *
 *     bytes32 internal constant _REENTRANCY_SLOT = 0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;
 *
 *     modifier nonReentrant() {
 *         require(!_REENTRANCY_SLOT.asBooleanSlot().tload());
 *
 *         _REENTRANCY_SLOT.asBooleanSlot().tstore(true);
 *         _;
 *         _REENTRANCY_SLOT.asBooleanSlot().tstore(false);
 *     }
 * }
 * ```
 */
library TransientSlot {
    /**
     * @dev UDVT that represent a slot holding a address.
     */
    type AddressSlotType is bytes32;

    /**
     * @dev Cast an arbitrary slot to a AddressSlotType.
     */
    function asAddressSlot(bytes32 slot) internal pure returns (AddressSlotType) {
        return AddressSlotType.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(AddressSlotType slot) internal view returns (address value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(AddressSlotType slot, address value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bool.
     */
    type BooleanSlotType is bytes32;

    /**
     * @dev Cast an arbitrary slot to a BooleanSlotType.
     */
    function asBooleanSlot(bytes32 slot) internal pure returns (BooleanSlotType) {
        return BooleanSlotType.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(BooleanSlotType slot) internal view returns (bool value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(BooleanSlotType slot, bool value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a bytes32.
     */
    type Bytes32SlotType is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes32SlotType.
     */
    function asBytes32Slot(bytes32 slot) internal pure returns (Bytes32SlotType) {
        return Bytes32SlotType.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes32SlotType slot) internal view returns (bytes32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes32SlotType slot, bytes32 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a uint256.
     */
    type Uint256SlotType is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint256SlotType.
     */
    function asUint256Slot(bytes32 slot) internal pure returns (Uint256SlotType) {
        return Uint256SlotType.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint256SlotType slot) internal view returns (uint256 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint256SlotType slot, uint256 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev UDVT that represent a slot holding a int256.
     */
    type Int256SlotType is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int256SlotType.
     */
    function asInt256Slot(bytes32 slot) internal pure returns (Int256SlotType) {
        return Int256SlotType.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int256SlotType slot) internal view returns (int256 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int256SlotType slot, int256 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }
}
