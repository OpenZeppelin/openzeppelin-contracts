// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.js.

pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytesXX.
 *
 * Example usage:
 *
 * ```solidity
 * library MyPacker {
 *     type MyType is bytes32;
 *
 *     function _pack(address account, bytes4 selector, uint64 period) external pure returns (MyType) {
 *         bytes12 subpack = Packing.pack_4_8(selector, bytes8(period));
 *         bytes32 pack = Packing.pack_20_12(bytes20(account), subpack);
 *         return MyType.wrap(pack);
 *     }
 *
 *     function _unpack(MyType self) external pure returns (address, bytes4, uint64) {
 *         bytes32 pack = MyType.unwrap(self);
 *         return (
 *             address(Packing.extract_32_20(pack, 0)),
 *             Packing.extract_32_4(pack, 20),
 *             uint64(Packing.extract_32_8(pack, 24))
 *         );
 *     }
 * }
 * ```
 */
// solhint-disable func-name-mixedcase
library Packing {
    error OutOfRangeAccess();

    function pack_1_1(bytes1 left, bytes1 right) internal pure returns (bytes2 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack_2_2(bytes2 left, bytes2 right) internal pure returns (bytes4 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack_2_4(bytes2 left, bytes4 right) internal pure returns (bytes6 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack_2_6(bytes2 left, bytes6 right) internal pure returns (bytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack_4_2(bytes4 left, bytes2 right) internal pure returns (bytes6 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack_4_4(bytes4 left, bytes4 right) internal pure returns (bytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack_4_8(bytes4 left, bytes8 right) internal pure returns (bytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack_4_12(bytes4 left, bytes12 right) internal pure returns (bytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack_4_16(bytes4 left, bytes16 right) internal pure returns (bytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack_4_20(bytes4 left, bytes20 right) internal pure returns (bytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack_4_24(bytes4 left, bytes24 right) internal pure returns (bytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack_4_28(bytes4 left, bytes28 right) internal pure returns (bytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack_6_2(bytes6 left, bytes2 right) internal pure returns (bytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack_6_6(bytes6 left, bytes6 right) internal pure returns (bytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack_8_4(bytes8 left, bytes4 right) internal pure returns (bytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack_8_8(bytes8 left, bytes8 right) internal pure returns (bytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack_8_12(bytes8 left, bytes12 right) internal pure returns (bytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack_8_16(bytes8 left, bytes16 right) internal pure returns (bytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack_8_20(bytes8 left, bytes20 right) internal pure returns (bytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack_8_24(bytes8 left, bytes24 right) internal pure returns (bytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack_12_4(bytes12 left, bytes4 right) internal pure returns (bytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack_12_8(bytes12 left, bytes8 right) internal pure returns (bytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack_12_12(bytes12 left, bytes12 right) internal pure returns (bytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack_12_16(bytes12 left, bytes16 right) internal pure returns (bytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack_12_20(bytes12 left, bytes20 right) internal pure returns (bytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack_16_4(bytes16 left, bytes4 right) internal pure returns (bytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack_16_8(bytes16 left, bytes8 right) internal pure returns (bytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack_16_12(bytes16 left, bytes12 right) internal pure returns (bytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack_16_16(bytes16 left, bytes16 right) internal pure returns (bytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack_20_4(bytes20 left, bytes4 right) internal pure returns (bytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack_20_8(bytes20 left, bytes8 right) internal pure returns (bytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack_20_12(bytes20 left, bytes12 right) internal pure returns (bytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack_24_4(bytes24 left, bytes4 right) internal pure returns (bytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack_24_8(bytes24 left, bytes8 right) internal pure returns (bytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack_28_4(bytes28 left, bytes4 right) internal pure returns (bytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(224, right))
        }
    }

    function extract_2_1(bytes2 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_2_1(bytes2 self, bytes1 value, uint8 offset) internal pure returns (bytes2 result) {
        bytes1 oldValue = extract_2_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_4_1(bytes4 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_4_1(bytes4 self, bytes1 value, uint8 offset) internal pure returns (bytes4 result) {
        bytes1 oldValue = extract_4_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_4_2(bytes4 self, uint8 offset) internal pure returns (bytes2 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace_4_2(bytes4 self, bytes2 value, uint8 offset) internal pure returns (bytes4 result) {
        bytes2 oldValue = extract_4_2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_6_1(bytes6 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_6_1(bytes6 self, bytes1 value, uint8 offset) internal pure returns (bytes6 result) {
        bytes1 oldValue = extract_6_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_6_2(bytes6 self, uint8 offset) internal pure returns (bytes2 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace_6_2(bytes6 self, bytes2 value, uint8 offset) internal pure returns (bytes6 result) {
        bytes2 oldValue = extract_6_2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_6_4(bytes6 self, uint8 offset) internal pure returns (bytes4 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace_6_4(bytes6 self, bytes4 value, uint8 offset) internal pure returns (bytes6 result) {
        bytes4 oldValue = extract_6_4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_8_1(bytes8 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_8_1(bytes8 self, bytes1 value, uint8 offset) internal pure returns (bytes8 result) {
        bytes1 oldValue = extract_8_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_8_2(bytes8 self, uint8 offset) internal pure returns (bytes2 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace_8_2(bytes8 self, bytes2 value, uint8 offset) internal pure returns (bytes8 result) {
        bytes2 oldValue = extract_8_2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_8_4(bytes8 self, uint8 offset) internal pure returns (bytes4 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace_8_4(bytes8 self, bytes4 value, uint8 offset) internal pure returns (bytes8 result) {
        bytes4 oldValue = extract_8_4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_8_6(bytes8 self, uint8 offset) internal pure returns (bytes6 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function replace_8_6(bytes8 self, bytes6 value, uint8 offset) internal pure returns (bytes8 result) {
        bytes6 oldValue = extract_8_6(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_12_1(bytes12 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_12_1(bytes12 self, bytes1 value, uint8 offset) internal pure returns (bytes12 result) {
        bytes1 oldValue = extract_12_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_12_2(bytes12 self, uint8 offset) internal pure returns (bytes2 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace_12_2(bytes12 self, bytes2 value, uint8 offset) internal pure returns (bytes12 result) {
        bytes2 oldValue = extract_12_2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_12_4(bytes12 self, uint8 offset) internal pure returns (bytes4 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace_12_4(bytes12 self, bytes4 value, uint8 offset) internal pure returns (bytes12 result) {
        bytes4 oldValue = extract_12_4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_12_6(bytes12 self, uint8 offset) internal pure returns (bytes6 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function replace_12_6(bytes12 self, bytes6 value, uint8 offset) internal pure returns (bytes12 result) {
        bytes6 oldValue = extract_12_6(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_12_8(bytes12 self, uint8 offset) internal pure returns (bytes8 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace_12_8(bytes12 self, bytes8 value, uint8 offset) internal pure returns (bytes12 result) {
        bytes8 oldValue = extract_12_8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_16_1(bytes16 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_16_1(bytes16 self, bytes1 value, uint8 offset) internal pure returns (bytes16 result) {
        bytes1 oldValue = extract_16_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_16_2(bytes16 self, uint8 offset) internal pure returns (bytes2 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace_16_2(bytes16 self, bytes2 value, uint8 offset) internal pure returns (bytes16 result) {
        bytes2 oldValue = extract_16_2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_16_4(bytes16 self, uint8 offset) internal pure returns (bytes4 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace_16_4(bytes16 self, bytes4 value, uint8 offset) internal pure returns (bytes16 result) {
        bytes4 oldValue = extract_16_4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_16_6(bytes16 self, uint8 offset) internal pure returns (bytes6 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function replace_16_6(bytes16 self, bytes6 value, uint8 offset) internal pure returns (bytes16 result) {
        bytes6 oldValue = extract_16_6(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_16_8(bytes16 self, uint8 offset) internal pure returns (bytes8 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace_16_8(bytes16 self, bytes8 value, uint8 offset) internal pure returns (bytes16 result) {
        bytes8 oldValue = extract_16_8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_16_12(bytes16 self, uint8 offset) internal pure returns (bytes12 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace_16_12(bytes16 self, bytes12 value, uint8 offset) internal pure returns (bytes16 result) {
        bytes12 oldValue = extract_16_12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_20_1(bytes20 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_20_1(bytes20 self, bytes1 value, uint8 offset) internal pure returns (bytes20 result) {
        bytes1 oldValue = extract_20_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_20_2(bytes20 self, uint8 offset) internal pure returns (bytes2 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace_20_2(bytes20 self, bytes2 value, uint8 offset) internal pure returns (bytes20 result) {
        bytes2 oldValue = extract_20_2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_20_4(bytes20 self, uint8 offset) internal pure returns (bytes4 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace_20_4(bytes20 self, bytes4 value, uint8 offset) internal pure returns (bytes20 result) {
        bytes4 oldValue = extract_20_4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_20_6(bytes20 self, uint8 offset) internal pure returns (bytes6 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function replace_20_6(bytes20 self, bytes6 value, uint8 offset) internal pure returns (bytes20 result) {
        bytes6 oldValue = extract_20_6(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_20_8(bytes20 self, uint8 offset) internal pure returns (bytes8 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace_20_8(bytes20 self, bytes8 value, uint8 offset) internal pure returns (bytes20 result) {
        bytes8 oldValue = extract_20_8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_20_12(bytes20 self, uint8 offset) internal pure returns (bytes12 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace_20_12(bytes20 self, bytes12 value, uint8 offset) internal pure returns (bytes20 result) {
        bytes12 oldValue = extract_20_12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_20_16(bytes20 self, uint8 offset) internal pure returns (bytes16 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function replace_20_16(bytes20 self, bytes16 value, uint8 offset) internal pure returns (bytes20 result) {
        bytes16 oldValue = extract_20_16(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_24_1(bytes24 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_24_1(bytes24 self, bytes1 value, uint8 offset) internal pure returns (bytes24 result) {
        bytes1 oldValue = extract_24_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_24_2(bytes24 self, uint8 offset) internal pure returns (bytes2 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace_24_2(bytes24 self, bytes2 value, uint8 offset) internal pure returns (bytes24 result) {
        bytes2 oldValue = extract_24_2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_24_4(bytes24 self, uint8 offset) internal pure returns (bytes4 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace_24_4(bytes24 self, bytes4 value, uint8 offset) internal pure returns (bytes24 result) {
        bytes4 oldValue = extract_24_4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_24_6(bytes24 self, uint8 offset) internal pure returns (bytes6 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function replace_24_6(bytes24 self, bytes6 value, uint8 offset) internal pure returns (bytes24 result) {
        bytes6 oldValue = extract_24_6(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_24_8(bytes24 self, uint8 offset) internal pure returns (bytes8 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace_24_8(bytes24 self, bytes8 value, uint8 offset) internal pure returns (bytes24 result) {
        bytes8 oldValue = extract_24_8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_24_12(bytes24 self, uint8 offset) internal pure returns (bytes12 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace_24_12(bytes24 self, bytes12 value, uint8 offset) internal pure returns (bytes24 result) {
        bytes12 oldValue = extract_24_12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_24_16(bytes24 self, uint8 offset) internal pure returns (bytes16 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function replace_24_16(bytes24 self, bytes16 value, uint8 offset) internal pure returns (bytes24 result) {
        bytes16 oldValue = extract_24_16(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_24_20(bytes24 self, uint8 offset) internal pure returns (bytes20 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function replace_24_20(bytes24 self, bytes20 value, uint8 offset) internal pure returns (bytes24 result) {
        bytes20 oldValue = extract_24_20(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_28_1(bytes28 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 27) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_28_1(bytes28 self, bytes1 value, uint8 offset) internal pure returns (bytes28 result) {
        bytes1 oldValue = extract_28_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_28_2(bytes28 self, uint8 offset) internal pure returns (bytes2 result) {
        if (offset > 26) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace_28_2(bytes28 self, bytes2 value, uint8 offset) internal pure returns (bytes28 result) {
        bytes2 oldValue = extract_28_2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_28_4(bytes28 self, uint8 offset) internal pure returns (bytes4 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace_28_4(bytes28 self, bytes4 value, uint8 offset) internal pure returns (bytes28 result) {
        bytes4 oldValue = extract_28_4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_28_6(bytes28 self, uint8 offset) internal pure returns (bytes6 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function replace_28_6(bytes28 self, bytes6 value, uint8 offset) internal pure returns (bytes28 result) {
        bytes6 oldValue = extract_28_6(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_28_8(bytes28 self, uint8 offset) internal pure returns (bytes8 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace_28_8(bytes28 self, bytes8 value, uint8 offset) internal pure returns (bytes28 result) {
        bytes8 oldValue = extract_28_8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_28_12(bytes28 self, uint8 offset) internal pure returns (bytes12 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace_28_12(bytes28 self, bytes12 value, uint8 offset) internal pure returns (bytes28 result) {
        bytes12 oldValue = extract_28_12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_28_16(bytes28 self, uint8 offset) internal pure returns (bytes16 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function replace_28_16(bytes28 self, bytes16 value, uint8 offset) internal pure returns (bytes28 result) {
        bytes16 oldValue = extract_28_16(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_28_20(bytes28 self, uint8 offset) internal pure returns (bytes20 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function replace_28_20(bytes28 self, bytes20 value, uint8 offset) internal pure returns (bytes28 result) {
        bytes20 oldValue = extract_28_20(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_28_24(bytes28 self, uint8 offset) internal pure returns (bytes24 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function replace_28_24(bytes28 self, bytes24 value, uint8 offset) internal pure returns (bytes28 result) {
        bytes24 oldValue = extract_28_24(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_1(bytes32 self, uint8 offset) internal pure returns (bytes1 result) {
        if (offset > 31) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function replace_32_1(bytes32 self, bytes1 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes1 oldValue = extract_32_1(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_2(bytes32 self, uint8 offset) internal pure returns (bytes2 result) {
        if (offset > 30) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function replace_32_2(bytes32 self, bytes2 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes2 oldValue = extract_32_2(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_4(bytes32 self, uint8 offset) internal pure returns (bytes4 result) {
        if (offset > 28) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function replace_32_4(bytes32 self, bytes4 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes4 oldValue = extract_32_4(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_6(bytes32 self, uint8 offset) internal pure returns (bytes6 result) {
        if (offset > 26) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function replace_32_6(bytes32 self, bytes6 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes6 oldValue = extract_32_6(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_8(bytes32 self, uint8 offset) internal pure returns (bytes8 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function replace_32_8(bytes32 self, bytes8 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes8 oldValue = extract_32_8(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_12(bytes32 self, uint8 offset) internal pure returns (bytes12 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function replace_32_12(bytes32 self, bytes12 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes12 oldValue = extract_32_12(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_16(bytes32 self, uint8 offset) internal pure returns (bytes16 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function replace_32_16(bytes32 self, bytes16 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes16 oldValue = extract_32_16(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_20(bytes32 self, uint8 offset) internal pure returns (bytes20 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function replace_32_20(bytes32 self, bytes20 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes20 oldValue = extract_32_20(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_24(bytes32 self, uint8 offset) internal pure returns (bytes24 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function replace_32_24(bytes32 self, bytes24 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes24 oldValue = extract_32_24(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }

    function extract_32_28(bytes32 self, uint8 offset) internal pure returns (bytes28 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(32, not(0)))
        }
    }

    function replace_32_28(bytes32 self, bytes28 value, uint8 offset) internal pure returns (bytes32 result) {
        bytes28 oldValue = extract_32_28(self, offset);
        assembly ("memory-safe") {
            result := xor(self, shr(mul(8, offset), xor(oldValue, value)))
        }
    }
}
