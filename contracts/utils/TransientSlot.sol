// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/TransientSlot.sol)
// This file was procedurally generated from scripts/generate/templates/TransientSlot.sol.eta.

pragma solidity ^0.8.24;

/**
 * @dev Library for reading and writing value-types to specific transient storage slots.
 *
 * Transient slots are often used to store temporary values that are removed after the current transaction.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * Example reading and writing values using transient storage:
 * ```solidity
 * contract Lock {
 *     using TransientSlot for *;
 *
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _LOCK_SLOT = 0xf4678858b2b588224636b8522b729e7722d32fc491da849ed75b3fdf3c84f542;
 *
 *     modifier locked() {
 *         require(!_LOCK_SLOT.asBoolean().tload());
 *
 *         _LOCK_SLOT.asBoolean().tstore(true);
 *         _;
 *         _LOCK_SLOT.asBoolean().tstore(false);
 *     }
 * }
 * ```
 *
 * Alternatively, the slot can be reserved by declaring a state variable, letting the compiler allocate it:
 * ```solidity
 * contract Lock {
 *     using TransientSlot for *;
 *
 *     // Reserve a slot. The compiler allocates it, just like it would for any other state variable.
 *     TransientSlot.TBoolean private _lock;
 *
 *     modifier locked() {
 *         require(!_lock.tload());
 *
 *         _lock.tstore(true);
 *         _;
 *         _lock.tstore(false);
 *     }
 * }
 * ```
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
library TransientSlot {
    /**
     * @dev Struct that reserves a slot in the (persistent) storage layout, to hold an address in transient storage.
     *
     * The reserved slot is never written to: only its number is reused, in the transient storage space. This
     * delegates the allocation of transient slots to the compiler, which is particularly useful for namespacing
     * them: reserving the slot inside an ERC-7201 namespaced storage struct namespaces the transient slot the
     * same way it namespaces the persistent ones.
     */
    struct TAddress {
        bytes32 _placeholder;
    }

    /**
     * @dev UDVT that represents a slot holding an address.
     */
    type AddressSlot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a AddressSlot.
     */
    function asAddress(bytes32 slot) internal pure returns (AddressSlot) {
        return AddressSlot.wrap(slot);
    }

    /**
     * @dev Struct that reserves a slot in the (persistent) storage layout, to hold a bool in transient storage.
     *
     * The reserved slot is never written to: only its number is reused, in the transient storage space. This
     * delegates the allocation of transient slots to the compiler, which is particularly useful for namespacing
     * them: reserving the slot inside an ERC-7201 namespaced storage struct namespaces the transient slot the
     * same way it namespaces the persistent ones.
     */
    struct TBoolean {
        bytes32 _placeholder;
    }

    /**
     * @dev UDVT that represents a slot holding a bool.
     */
    type BooleanSlot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a BooleanSlot.
     */
    function asBoolean(bytes32 slot) internal pure returns (BooleanSlot) {
        return BooleanSlot.wrap(slot);
    }

    /**
     * @dev Struct that reserves a slot in the (persistent) storage layout, to hold a bytes32 in transient storage.
     *
     * The reserved slot is never written to: only its number is reused, in the transient storage space. This
     * delegates the allocation of transient slots to the compiler, which is particularly useful for namespacing
     * them: reserving the slot inside an ERC-7201 namespaced storage struct namespaces the transient slot the
     * same way it namespaces the persistent ones.
     */
    struct TBytes32 {
        bytes32 _placeholder;
    }

    /**
     * @dev UDVT that represents a slot holding a bytes32.
     */
    type Bytes32Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Bytes32Slot.
     */
    function asBytes32(bytes32 slot) internal pure returns (Bytes32Slot) {
        return Bytes32Slot.wrap(slot);
    }

    /**
     * @dev Struct that reserves a slot in the (persistent) storage layout, to hold a uint256 in transient storage.
     *
     * The reserved slot is never written to: only its number is reused, in the transient storage space. This
     * delegates the allocation of transient slots to the compiler, which is particularly useful for namespacing
     * them: reserving the slot inside an ERC-7201 namespaced storage struct namespaces the transient slot the
     * same way it namespaces the persistent ones.
     */
    struct TUint256 {
        bytes32 _placeholder;
    }

    /**
     * @dev UDVT that represents a slot holding a uint256.
     */
    type Uint256Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Uint256Slot.
     */
    function asUint256(bytes32 slot) internal pure returns (Uint256Slot) {
        return Uint256Slot.wrap(slot);
    }

    /**
     * @dev Struct that reserves a slot in the (persistent) storage layout, to hold a int256 in transient storage.
     *
     * The reserved slot is never written to: only its number is reused, in the transient storage space. This
     * delegates the allocation of transient slots to the compiler, which is particularly useful for namespacing
     * them: reserving the slot inside an ERC-7201 namespaced storage struct namespaces the transient slot the
     * same way it namespaces the persistent ones.
     */
    struct TInt256 {
        bytes32 _placeholder;
    }

    /**
     * @dev UDVT that represents a slot holding a int256.
     */
    type Int256Slot is bytes32;

    /**
     * @dev Cast an arbitrary slot to a Int256Slot.
     */
    function asInt256(bytes32 slot) internal pure returns (Int256Slot) {
        return Int256Slot.wrap(slot);
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(AddressSlot slot) internal view returns (address value) {
        assembly ("memory-safe") {
            value := tload(slot)
        }
    }

    /**
     * @dev Load the value held in the transient slot reserved by `self`.
     */
    function tload(TAddress storage self) internal view returns (address value) {
        assembly ("memory-safe") {
            value := tload(self.slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(AddressSlot slot, address value) internal {
        assembly ("memory-safe") {
            tstore(slot, value)
        }
    }

    /**
     * @dev Store `value` in the transient slot reserved by `self`.
     */
    function tstore(TAddress storage self, address value) internal {
        assembly ("memory-safe") {
            tstore(self.slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(BooleanSlot slot) internal view returns (bool value) {
        assembly ("memory-safe") {
            value := tload(slot)
        }
    }

    /**
     * @dev Load the value held in the transient slot reserved by `self`.
     */
    function tload(TBoolean storage self) internal view returns (bool value) {
        assembly ("memory-safe") {
            value := tload(self.slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(BooleanSlot slot, bool value) internal {
        assembly ("memory-safe") {
            tstore(slot, value)
        }
    }

    /**
     * @dev Store `value` in the transient slot reserved by `self`.
     */
    function tstore(TBoolean storage self, bool value) internal {
        assembly ("memory-safe") {
            tstore(self.slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Bytes32Slot slot) internal view returns (bytes32 value) {
        assembly ("memory-safe") {
            value := tload(slot)
        }
    }

    /**
     * @dev Load the value held in the transient slot reserved by `self`.
     */
    function tload(TBytes32 storage self) internal view returns (bytes32 value) {
        assembly ("memory-safe") {
            value := tload(self.slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Bytes32Slot slot, bytes32 value) internal {
        assembly ("memory-safe") {
            tstore(slot, value)
        }
    }

    /**
     * @dev Store `value` in the transient slot reserved by `self`.
     */
    function tstore(TBytes32 storage self, bytes32 value) internal {
        assembly ("memory-safe") {
            tstore(self.slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Uint256Slot slot) internal view returns (uint256 value) {
        assembly ("memory-safe") {
            value := tload(slot)
        }
    }

    /**
     * @dev Load the value held in the transient slot reserved by `self`.
     */
    function tload(TUint256 storage self) internal view returns (uint256 value) {
        assembly ("memory-safe") {
            value := tload(self.slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Uint256Slot slot, uint256 value) internal {
        assembly ("memory-safe") {
            tstore(slot, value)
        }
    }

    /**
     * @dev Store `value` in the transient slot reserved by `self`.
     */
    function tstore(TUint256 storage self, uint256 value) internal {
        assembly ("memory-safe") {
            tstore(self.slot, value)
        }
    }

    /**
     * @dev Load the value held at location `slot` in transient storage.
     */
    function tload(Int256Slot slot) internal view returns (int256 value) {
        assembly ("memory-safe") {
            value := tload(slot)
        }
    }

    /**
     * @dev Load the value held in the transient slot reserved by `self`.
     */
    function tload(TInt256 storage self) internal view returns (int256 value) {
        assembly ("memory-safe") {
            value := tload(self.slot)
        }
    }

    /**
     * @dev Store `value` at location `slot` in transient storage.
     */
    function tstore(Int256Slot slot, int256 value) internal {
        assembly ("memory-safe") {
            tstore(slot, value)
        }
    }

    /**
     * @dev Store `value` in the transient slot reserved by `self`.
     */
    function tstore(TInt256 storage self, int256 value) internal {
        assembly ("memory-safe") {
            tstore(self.slot, value)
        }
    }
}
