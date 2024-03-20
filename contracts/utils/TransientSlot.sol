// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/TransientSlot.js.

pragma solidity ^0.8.24;

import {TypedSlot} from "./types/TypedSlot.sol";

/**
 * @dev Library for reading and writing primitive types to specific storage slots. This is a variant of {StorageSlot}
 * that supports transient storage.
 *
 * The functions in this library return types that give access to reading or writting primitives.
 *
 * Example usage:
 * ```solidity
 * contract ReentrancyGuard {
 *     using TypedSlot for bytes32;
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
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(TypedSlot.AddressSlotType slot) internal view returns (address value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(TypedSlot.AddressSlotType slot, address value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(TypedSlot.BooleanSlotType slot) internal view returns (bool value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(TypedSlot.BooleanSlotType slot, bool value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(TypedSlot.Bytes32SlotType slot) internal view returns (bytes32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(TypedSlot.Bytes32SlotType slot, bytes32 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(TypedSlot.Uint256SlotType slot) internal view returns (uint256 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(TypedSlot.Uint256SlotType slot, uint256 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(TypedSlot.Int256SlotType slot) internal view returns (int256 value) {
        /// @solidity memory-safe-assembly
        assembly {
            value := tload(slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(TypedSlot.Int256SlotType slot, int256 value) internal {
        /// @solidity memory-safe-assembly
        assembly {
            tstore(slot, value)
        }
    }
}
