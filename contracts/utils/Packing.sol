// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.js.

pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytesXX.
 */
library Packing {
    error OutOfRangeAccess();

    type PackedBytes1 is bytes1;

    function asPackedBytes1(bytes1 self) internal pure returns (PackedBytes1) {
        return PackedBytes1.wrap(self);
    }

    function asPackedBytes1(uint8 self) internal pure returns (PackedBytes1) {
        return PackedBytes1.wrap(bytes1(self));
    }

    function asBytes1(PackedBytes1 self) internal pure returns (bytes1) {
        return PackedBytes1.unwrap(self);
    }

    function asUint8(PackedBytes1 self) internal pure returns (uint8) {
        return uint8(PackedBytes1.unwrap(self));
    }

    type PackedBytes2 is bytes2;

    function asPackedBytes2(bytes2 self) internal pure returns (PackedBytes2) {
        return PackedBytes2.wrap(self);
    }

    function asPackedBytes2(uint16 self) internal pure returns (PackedBytes2) {
        return PackedBytes2.wrap(bytes2(self));
    }

    function asBytes2(PackedBytes2 self) internal pure returns (bytes2) {
        return PackedBytes2.unwrap(self);
    }

    function asUint16(PackedBytes2 self) internal pure returns (uint16) {
        return uint16(PackedBytes2.unwrap(self));
    }

    type PackedBytes4 is bytes4;

    function asPackedBytes4(bytes4 self) internal pure returns (PackedBytes4) {
        return PackedBytes4.wrap(self);
    }

    function asPackedBytes4(uint32 self) internal pure returns (PackedBytes4) {
        return PackedBytes4.wrap(bytes4(self));
    }

    function asBytes4(PackedBytes4 self) internal pure returns (bytes4) {
        return PackedBytes4.unwrap(self);
    }

    function asUint32(PackedBytes4 self) internal pure returns (uint32) {
        return uint32(PackedBytes4.unwrap(self));
    }

    type PackedBytes8 is bytes8;

    function asPackedBytes8(bytes8 self) internal pure returns (PackedBytes8) {
        return PackedBytes8.wrap(self);
    }

    function asPackedBytes8(uint64 self) internal pure returns (PackedBytes8) {
        return PackedBytes8.wrap(bytes8(self));
    }

    function asBytes8(PackedBytes8 self) internal pure returns (bytes8) {
        return PackedBytes8.unwrap(self);
    }

    function asUint64(PackedBytes8 self) internal pure returns (uint64) {
        return uint64(PackedBytes8.unwrap(self));
    }

    type PackedBytes12 is bytes12;

    function asPackedBytes12(bytes12 self) internal pure returns (PackedBytes12) {
        return PackedBytes12.wrap(self);
    }

    function asPackedBytes12(uint96 self) internal pure returns (PackedBytes12) {
        return PackedBytes12.wrap(bytes12(self));
    }

    function asBytes12(PackedBytes12 self) internal pure returns (bytes12) {
        return PackedBytes12.unwrap(self);
    }

    function asUint96(PackedBytes12 self) internal pure returns (uint96) {
        return uint96(PackedBytes12.unwrap(self));
    }

    type PackedBytes16 is bytes16;

    function asPackedBytes16(bytes16 self) internal pure returns (PackedBytes16) {
        return PackedBytes16.wrap(self);
    }

    function asPackedBytes16(uint128 self) internal pure returns (PackedBytes16) {
        return PackedBytes16.wrap(bytes16(self));
    }

    function asBytes16(PackedBytes16 self) internal pure returns (bytes16) {
        return PackedBytes16.unwrap(self);
    }

    function asUint128(PackedBytes16 self) internal pure returns (uint128) {
        return uint128(PackedBytes16.unwrap(self));
    }

    type PackedBytes20 is bytes20;

    function asPackedBytes20(bytes20 self) internal pure returns (PackedBytes20) {
        return PackedBytes20.wrap(self);
    }

    function asPackedBytes20(uint160 self) internal pure returns (PackedBytes20) {
        return PackedBytes20.wrap(bytes20(self));
    }

    function asBytes20(PackedBytes20 self) internal pure returns (bytes20) {
        return PackedBytes20.unwrap(self);
    }

    function asUint160(PackedBytes20 self) internal pure returns (uint160) {
        return uint160(PackedBytes20.unwrap(self));
    }

    type PackedBytes24 is bytes24;

    function asPackedBytes24(bytes24 self) internal pure returns (PackedBytes24) {
        return PackedBytes24.wrap(self);
    }

    function asPackedBytes24(uint192 self) internal pure returns (PackedBytes24) {
        return PackedBytes24.wrap(bytes24(self));
    }

    function asBytes24(PackedBytes24 self) internal pure returns (bytes24) {
        return PackedBytes24.unwrap(self);
    }

    function asUint192(PackedBytes24 self) internal pure returns (uint192) {
        return uint192(PackedBytes24.unwrap(self));
    }

    type PackedBytes28 is bytes28;

    function asPackedBytes28(bytes28 self) internal pure returns (PackedBytes28) {
        return PackedBytes28.wrap(self);
    }

    function asPackedBytes28(uint224 self) internal pure returns (PackedBytes28) {
        return PackedBytes28.wrap(bytes28(self));
    }

    function asBytes28(PackedBytes28 self) internal pure returns (bytes28) {
        return PackedBytes28.unwrap(self);
    }

    function asUint224(PackedBytes28 self) internal pure returns (uint224) {
        return uint224(PackedBytes28.unwrap(self));
    }

    type PackedBytes32 is bytes32;

    function asPackedBytes32(bytes32 self) internal pure returns (PackedBytes32) {
        return PackedBytes32.wrap(self);
    }

    function asPackedBytes32(uint256 self) internal pure returns (PackedBytes32) {
        return PackedBytes32.wrap(bytes32(self));
    }

    function asBytes32(PackedBytes32 self) internal pure returns (bytes32) {
        return PackedBytes32.unwrap(self);
    }

    function asUint256(PackedBytes32 self) internal pure returns (uint256) {
        return uint256(PackedBytes32.unwrap(self));
    }

    function asPackedBytes20(address self) internal pure returns (PackedBytes20) {
        return PackedBytes20.wrap(bytes20(self));
    }

    function asAddress(PackedBytes20 self) internal pure returns (address) {
        return address(bytes20(PackedBytes20.unwrap(self)));
    }

    function pack(PackedBytes1 left, PackedBytes1 right) internal pure returns (PackedBytes2 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes2 right) internal pure returns (PackedBytes4 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes4 right) internal pure returns (PackedBytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes8 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes12 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes16 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes20 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes24 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes28 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes4 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes8 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes12 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes16 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes20 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes24 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes4 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes8 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes12 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes16 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes20 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes4 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes8 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes12 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes16 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes4 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes8 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes12 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes4 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes8 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes28 left, PackedBytes4 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(224, right))
        }
    }

    function extract1(PackedBytes2 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace(PackedBytes2 self, PackedBytes1 value, uint8 offset) internal pure returns (PackedBytes2 result) {
        PackedBytes1 oldValue = extract1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract1(PackedBytes4 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace(PackedBytes4 self, PackedBytes1 value, uint8 offset) internal pure returns (PackedBytes4 result) {
        PackedBytes1 oldValue = extract1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract2(PackedBytes4 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace(PackedBytes4 self, PackedBytes2 value, uint8 offset) internal pure returns (PackedBytes4 result) {
        PackedBytes2 oldValue = extract2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract1(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace(PackedBytes8 self, PackedBytes1 value, uint8 offset) internal pure returns (PackedBytes8 result) {
        PackedBytes1 oldValue = extract1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract2(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace(PackedBytes8 self, PackedBytes2 value, uint8 offset) internal pure returns (PackedBytes8 result) {
        PackedBytes2 oldValue = extract2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract4(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace(PackedBytes8 self, PackedBytes4 value, uint8 offset) internal pure returns (PackedBytes8 result) {
        PackedBytes4 oldValue = extract4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract1(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace(
        PackedBytes12 self,
        PackedBytes1 value,
        uint8 offset
    ) internal pure returns (PackedBytes12 result) {
        PackedBytes1 oldValue = extract1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract2(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace(
        PackedBytes12 self,
        PackedBytes2 value,
        uint8 offset
    ) internal pure returns (PackedBytes12 result) {
        PackedBytes2 oldValue = extract2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract4(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace(
        PackedBytes12 self,
        PackedBytes4 value,
        uint8 offset
    ) internal pure returns (PackedBytes12 result) {
        PackedBytes4 oldValue = extract4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract8(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace(
        PackedBytes12 self,
        PackedBytes8 value,
        uint8 offset
    ) internal pure returns (PackedBytes12 result) {
        PackedBytes8 oldValue = extract8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract1(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace(
        PackedBytes16 self,
        PackedBytes1 value,
        uint8 offset
    ) internal pure returns (PackedBytes16 result) {
        PackedBytes1 oldValue = extract1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract2(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace(
        PackedBytes16 self,
        PackedBytes2 value,
        uint8 offset
    ) internal pure returns (PackedBytes16 result) {
        PackedBytes2 oldValue = extract2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract4(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace(
        PackedBytes16 self,
        PackedBytes4 value,
        uint8 offset
    ) internal pure returns (PackedBytes16 result) {
        PackedBytes4 oldValue = extract4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract8(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace(
        PackedBytes16 self,
        PackedBytes8 value,
        uint8 offset
    ) internal pure returns (PackedBytes16 result) {
        PackedBytes8 oldValue = extract8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract12(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace(
        PackedBytes16 self,
        PackedBytes12 value,
        uint8 offset
    ) internal pure returns (PackedBytes16 result) {
        PackedBytes12 oldValue = extract12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract1(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace(
        PackedBytes20 self,
        PackedBytes1 value,
        uint8 offset
    ) internal pure returns (PackedBytes20 result) {
        PackedBytes1 oldValue = extract1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract2(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace(
        PackedBytes20 self,
        PackedBytes2 value,
        uint8 offset
    ) internal pure returns (PackedBytes20 result) {
        PackedBytes2 oldValue = extract2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract4(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace(
        PackedBytes20 self,
        PackedBytes4 value,
        uint8 offset
    ) internal pure returns (PackedBytes20 result) {
        PackedBytes4 oldValue = extract4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract8(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace(
        PackedBytes20 self,
        PackedBytes8 value,
        uint8 offset
    ) internal pure returns (PackedBytes20 result) {
        PackedBytes8 oldValue = extract8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract12(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace(
        PackedBytes20 self,
        PackedBytes12 value,
        uint8 offset
    ) internal pure returns (PackedBytes20 result) {
        PackedBytes12 oldValue = extract12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract16(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function replace(
        PackedBytes20 self,
        PackedBytes16 value,
        uint8 offset
    ) internal pure returns (PackedBytes20 result) {
        PackedBytes16 oldValue = extract16(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract1(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace(
        PackedBytes24 self,
        PackedBytes1 value,
        uint8 offset
    ) internal pure returns (PackedBytes24 result) {
        PackedBytes1 oldValue = extract1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract2(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace(
        PackedBytes24 self,
        PackedBytes2 value,
        uint8 offset
    ) internal pure returns (PackedBytes24 result) {
        PackedBytes2 oldValue = extract2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract4(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace(
        PackedBytes24 self,
        PackedBytes4 value,
        uint8 offset
    ) internal pure returns (PackedBytes24 result) {
        PackedBytes4 oldValue = extract4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract8(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace(
        PackedBytes24 self,
        PackedBytes8 value,
        uint8 offset
    ) internal pure returns (PackedBytes24 result) {
        PackedBytes8 oldValue = extract8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract12(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace(
        PackedBytes24 self,
        PackedBytes12 value,
        uint8 offset
    ) internal pure returns (PackedBytes24 result) {
        PackedBytes12 oldValue = extract12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract16(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function replace(
        PackedBytes24 self,
        PackedBytes16 value,
        uint8 offset
    ) internal pure returns (PackedBytes24 result) {
        PackedBytes16 oldValue = extract16(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract20(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function replace(
        PackedBytes24 self,
        PackedBytes20 value,
        uint8 offset
    ) internal pure returns (PackedBytes24 result) {
        PackedBytes20 oldValue = extract20(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract1(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 27) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace(
        PackedBytes28 self,
        PackedBytes1 value,
        uint8 offset
    ) internal pure returns (PackedBytes28 result) {
        PackedBytes1 oldValue = extract1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract2(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 26) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace(
        PackedBytes28 self,
        PackedBytes2 value,
        uint8 offset
    ) internal pure returns (PackedBytes28 result) {
        PackedBytes2 oldValue = extract2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract4(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace(
        PackedBytes28 self,
        PackedBytes4 value,
        uint8 offset
    ) internal pure returns (PackedBytes28 result) {
        PackedBytes4 oldValue = extract4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract8(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace(
        PackedBytes28 self,
        PackedBytes8 value,
        uint8 offset
    ) internal pure returns (PackedBytes28 result) {
        PackedBytes8 oldValue = extract8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract12(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace(
        PackedBytes28 self,
        PackedBytes12 value,
        uint8 offset
    ) internal pure returns (PackedBytes28 result) {
        PackedBytes12 oldValue = extract12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract16(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function replace(
        PackedBytes28 self,
        PackedBytes16 value,
        uint8 offset
    ) internal pure returns (PackedBytes28 result) {
        PackedBytes16 oldValue = extract16(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract20(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function replace(
        PackedBytes28 self,
        PackedBytes20 value,
        uint8 offset
    ) internal pure returns (PackedBytes28 result) {
        PackedBytes20 oldValue = extract20(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract24(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function replace(
        PackedBytes28 self,
        PackedBytes24 value,
        uint8 offset
    ) internal pure returns (PackedBytes28 result) {
        PackedBytes24 oldValue = extract24(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract1(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 31) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace(
        PackedBytes32 self,
        PackedBytes1 value,
        uint8 offset
    ) internal pure returns (PackedBytes32 result) {
        PackedBytes1 oldValue = extract1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract2(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 30) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace(
        PackedBytes32 self,
        PackedBytes2 value,
        uint8 offset
    ) internal pure returns (PackedBytes32 result) {
        PackedBytes2 oldValue = extract2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract4(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 28) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace(
        PackedBytes32 self,
        PackedBytes4 value,
        uint8 offset
    ) internal pure returns (PackedBytes32 result) {
        PackedBytes4 oldValue = extract4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract8(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace(
        PackedBytes32 self,
        PackedBytes8 value,
        uint8 offset
    ) internal pure returns (PackedBytes32 result) {
        PackedBytes8 oldValue = extract8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract12(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace(
        PackedBytes32 self,
        PackedBytes12 value,
        uint8 offset
    ) internal pure returns (PackedBytes32 result) {
        PackedBytes12 oldValue = extract12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract16(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function replace(
        PackedBytes32 self,
        PackedBytes16 value,
        uint8 offset
    ) internal pure returns (PackedBytes32 result) {
        PackedBytes16 oldValue = extract16(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract20(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function replace(
        PackedBytes32 self,
        PackedBytes20 value,
        uint8 offset
    ) internal pure returns (PackedBytes32 result) {
        PackedBytes20 oldValue = extract20(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract24(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function replace(
        PackedBytes32 self,
        PackedBytes24 value,
        uint8 offset
    ) internal pure returns (PackedBytes32 result) {
        PackedBytes24 oldValue = extract24(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract28(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes28 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(32, not(0)))
        }
    }

    function replace(
        PackedBytes32 self,
        PackedBytes28 value,
        uint8 offset
    ) internal pure returns (PackedBytes32 result) {
        PackedBytes28 oldValue = extract28(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }
}
