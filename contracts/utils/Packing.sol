// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.js.

pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytesXX.
 */
library Packing {
    type Uint128x2 is bytes32;

    error OutOfBoundAccessUint128x2(uint8);

    /// @dev Cast a bytes32 into a Uint128x2
    function asUint128x2(bytes32 self) internal pure returns (Uint128x2) {
        return Uint128x2.wrap(self);
    }

    /// @dev Cast a uint256 into a Uint128x2
    function asUint128x2(uint256 self) internal pure returns (Uint128x2) {
        return Uint128x2.wrap(bytes32(self));
    }

    /// @dev Cast a Uint128x2 into a bytes32
    function asBytes32(Uint128x2 self) internal pure returns (bytes32) {
        return Uint128x2.unwrap(self);
    }

    /// @dev Cast a Uint128x2 into a uint256
    function asUint256(Uint128x2 self) internal pure returns (uint256) {
        return uint256(Uint128x2.unwrap(self));
    }

    function at(Uint128x2 self, uint8 pos) internal pure returns (uint128) {
        if (pos > 1) revert OutOfBoundAccessUint128x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint128x2 self, uint8 pos) internal pure returns (uint128) {
        unchecked {
            return uint128(bytes16(_extractLeftmostBits(bytes32(Uint128x2.unwrap(self)), 128 * pos, 128)));
        }
    }

    /// @dev Pack 2 uint128 into a Uint128x2
    function pack(uint128 arg0, uint128 arg1) internal pure returns (Uint128x2 result) {
        assembly {
            result := shr(128, arg0)
            result := or(result, shr(0, arg1))
        }
    }

    /// @dev Split a Uint128x2 into 2 uint128
    function split(Uint128x2 self) internal pure returns (uint128, uint128) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint64x4 is bytes32;

    error OutOfBoundAccessUint64x4(uint8);

    /// @dev Cast a bytes32 into a Uint64x4
    function asUint64x4(bytes32 self) internal pure returns (Uint64x4) {
        return Uint64x4.wrap(self);
    }

    /// @dev Cast a uint256 into a Uint64x4
    function asUint64x4(uint256 self) internal pure returns (Uint64x4) {
        return Uint64x4.wrap(bytes32(self));
    }

    /// @dev Cast a Uint64x4 into a bytes32
    function asBytes32(Uint64x4 self) internal pure returns (bytes32) {
        return Uint64x4.unwrap(self);
    }

    /// @dev Cast a Uint64x4 into a uint256
    function asUint256(Uint64x4 self) internal pure returns (uint256) {
        return uint256(Uint64x4.unwrap(self));
    }

    function at(Uint64x4 self, uint8 pos) internal pure returns (uint64) {
        if (pos > 3) revert OutOfBoundAccessUint64x4(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint64x4 self, uint8 pos) internal pure returns (uint64) {
        unchecked {
            return uint64(bytes8(_extractLeftmostBits(bytes32(Uint64x4.unwrap(self)), 64 * pos, 64)));
        }
    }

    /// @dev Pack 4 uint64 into a Uint64x4
    function pack(uint64 arg0, uint64 arg1, uint64 arg2, uint64 arg3) internal pure returns (Uint64x4 result) {
        assembly {
            result := shr(192, arg0)
            result := or(result, shr(128, arg1))
            result := or(result, shr(64, arg2))
            result := or(result, shr(0, arg3))
        }
    }

    /// @dev Split a Uint64x4 into 4 uint64
    function split(Uint64x4 self) internal pure returns (uint64, uint64, uint64, uint64) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3));
    }

    type Uint32x8 is bytes32;

    error OutOfBoundAccessUint32x8(uint8);

    /// @dev Cast a bytes32 into a Uint32x8
    function asUint32x8(bytes32 self) internal pure returns (Uint32x8) {
        return Uint32x8.wrap(self);
    }

    /// @dev Cast a uint256 into a Uint32x8
    function asUint32x8(uint256 self) internal pure returns (Uint32x8) {
        return Uint32x8.wrap(bytes32(self));
    }

    /// @dev Cast a Uint32x8 into a bytes32
    function asBytes32(Uint32x8 self) internal pure returns (bytes32) {
        return Uint32x8.unwrap(self);
    }

    /// @dev Cast a Uint32x8 into a uint256
    function asUint256(Uint32x8 self) internal pure returns (uint256) {
        return uint256(Uint32x8.unwrap(self));
    }

    function at(Uint32x8 self, uint8 pos) internal pure returns (uint32) {
        if (pos > 7) revert OutOfBoundAccessUint32x8(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint32x8 self, uint8 pos) internal pure returns (uint32) {
        unchecked {
            return uint32(bytes4(_extractLeftmostBits(bytes32(Uint32x8.unwrap(self)), 32 * pos, 32)));
        }
    }

    /// @dev Pack 8 uint32 into a Uint32x8
    function pack(
        uint32 arg0,
        uint32 arg1,
        uint32 arg2,
        uint32 arg3,
        uint32 arg4,
        uint32 arg5,
        uint32 arg6,
        uint32 arg7
    ) internal pure returns (Uint32x8 result) {
        assembly {
            result := shr(224, arg0)
            result := or(result, shr(192, arg1))
            result := or(result, shr(160, arg2))
            result := or(result, shr(128, arg3))
            result := or(result, shr(96, arg4))
            result := or(result, shr(64, arg5))
            result := or(result, shr(32, arg6))
            result := or(result, shr(0, arg7))
        }
    }

    /// @dev Split a Uint32x8 into 8 uint32
    function split(
        Uint32x8 self
    ) internal pure returns (uint32, uint32, uint32, uint32, uint32, uint32, uint32, uint32) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5),
            unsafeAt(self, 6),
            unsafeAt(self, 7)
        );
    }

    type Uint16x16 is bytes32;

    error OutOfBoundAccessUint16x16(uint8);

    /// @dev Cast a bytes32 into a Uint16x16
    function asUint16x16(bytes32 self) internal pure returns (Uint16x16) {
        return Uint16x16.wrap(self);
    }

    /// @dev Cast a uint256 into a Uint16x16
    function asUint16x16(uint256 self) internal pure returns (Uint16x16) {
        return Uint16x16.wrap(bytes32(self));
    }

    /// @dev Cast a Uint16x16 into a bytes32
    function asBytes32(Uint16x16 self) internal pure returns (bytes32) {
        return Uint16x16.unwrap(self);
    }

    /// @dev Cast a Uint16x16 into a uint256
    function asUint256(Uint16x16 self) internal pure returns (uint256) {
        return uint256(Uint16x16.unwrap(self));
    }

    function at(Uint16x16 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 15) revert OutOfBoundAccessUint16x16(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x16 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x16.unwrap(self)), 16 * pos, 16)));
        }
    }

    type Uint8x32 is bytes32;

    error OutOfBoundAccessUint8x32(uint8);

    /// @dev Cast a bytes32 into a Uint8x32
    function asUint8x32(bytes32 self) internal pure returns (Uint8x32) {
        return Uint8x32.wrap(self);
    }

    /// @dev Cast a uint256 into a Uint8x32
    function asUint8x32(uint256 self) internal pure returns (Uint8x32) {
        return Uint8x32.wrap(bytes32(self));
    }

    /// @dev Cast a Uint8x32 into a bytes32
    function asBytes32(Uint8x32 self) internal pure returns (bytes32) {
        return Uint8x32.unwrap(self);
    }

    /// @dev Cast a Uint8x32 into a uint256
    function asUint256(Uint8x32 self) internal pure returns (uint256) {
        return uint256(Uint8x32.unwrap(self));
    }

    function at(Uint8x32 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 31) revert OutOfBoundAccessUint8x32(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x32 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x32.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint8x31 is bytes31;

    error OutOfBoundAccessUint8x31(uint8);

    /// @dev Cast a bytes31 into a Uint8x31
    function asUint8x31(bytes31 self) internal pure returns (Uint8x31) {
        return Uint8x31.wrap(self);
    }

    /// @dev Cast a uint248 into a Uint8x31
    function asUint8x31(uint248 self) internal pure returns (Uint8x31) {
        return Uint8x31.wrap(bytes31(self));
    }

    /// @dev Cast a Uint8x31 into a bytes31
    function asBytes31(Uint8x31 self) internal pure returns (bytes31) {
        return Uint8x31.unwrap(self);
    }

    /// @dev Cast a Uint8x31 into a uint248
    function asUint248(Uint8x31 self) internal pure returns (uint248) {
        return uint248(Uint8x31.unwrap(self));
    }

    function at(Uint8x31 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 30) revert OutOfBoundAccessUint8x31(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x31 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x31.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint120x2 is bytes30;

    error OutOfBoundAccessUint120x2(uint8);

    /// @dev Cast a bytes30 into a Uint120x2
    function asUint120x2(bytes30 self) internal pure returns (Uint120x2) {
        return Uint120x2.wrap(self);
    }

    /// @dev Cast a uint240 into a Uint120x2
    function asUint120x2(uint240 self) internal pure returns (Uint120x2) {
        return Uint120x2.wrap(bytes30(self));
    }

    /// @dev Cast a Uint120x2 into a bytes30
    function asBytes30(Uint120x2 self) internal pure returns (bytes30) {
        return Uint120x2.unwrap(self);
    }

    /// @dev Cast a Uint120x2 into a uint240
    function asUint240(Uint120x2 self) internal pure returns (uint240) {
        return uint240(Uint120x2.unwrap(self));
    }

    function at(Uint120x2 self, uint8 pos) internal pure returns (uint120) {
        if (pos > 1) revert OutOfBoundAccessUint120x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint120x2 self, uint8 pos) internal pure returns (uint120) {
        unchecked {
            return uint120(bytes15(_extractLeftmostBits(bytes32(Uint120x2.unwrap(self)), 120 * pos, 120)));
        }
    }

    /// @dev Pack 2 uint120 into a Uint120x2
    function pack(uint120 arg0, uint120 arg1) internal pure returns (Uint120x2 result) {
        assembly {
            result := shr(136, arg0)
            result := or(result, shr(16, arg1))
        }
    }

    /// @dev Split a Uint120x2 into 2 uint120
    function split(Uint120x2 self) internal pure returns (uint120, uint120) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint80x3 is bytes30;

    error OutOfBoundAccessUint80x3(uint8);

    /// @dev Cast a bytes30 into a Uint80x3
    function asUint80x3(bytes30 self) internal pure returns (Uint80x3) {
        return Uint80x3.wrap(self);
    }

    /// @dev Cast a uint240 into a Uint80x3
    function asUint80x3(uint240 self) internal pure returns (Uint80x3) {
        return Uint80x3.wrap(bytes30(self));
    }

    /// @dev Cast a Uint80x3 into a bytes30
    function asBytes30(Uint80x3 self) internal pure returns (bytes30) {
        return Uint80x3.unwrap(self);
    }

    /// @dev Cast a Uint80x3 into a uint240
    function asUint240(Uint80x3 self) internal pure returns (uint240) {
        return uint240(Uint80x3.unwrap(self));
    }

    function at(Uint80x3 self, uint8 pos) internal pure returns (uint80) {
        if (pos > 2) revert OutOfBoundAccessUint80x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint80x3 self, uint8 pos) internal pure returns (uint80) {
        unchecked {
            return uint80(bytes10(_extractLeftmostBits(bytes32(Uint80x3.unwrap(self)), 80 * pos, 80)));
        }
    }

    /// @dev Pack 3 uint80 into a Uint80x3
    function pack(uint80 arg0, uint80 arg1, uint80 arg2) internal pure returns (Uint80x3 result) {
        assembly {
            result := shr(176, arg0)
            result := or(result, shr(96, arg1))
            result := or(result, shr(16, arg2))
        }
    }

    /// @dev Split a Uint80x3 into 3 uint80
    function split(Uint80x3 self) internal pure returns (uint80, uint80, uint80) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint48x5 is bytes30;

    error OutOfBoundAccessUint48x5(uint8);

    /// @dev Cast a bytes30 into a Uint48x5
    function asUint48x5(bytes30 self) internal pure returns (Uint48x5) {
        return Uint48x5.wrap(self);
    }

    /// @dev Cast a uint240 into a Uint48x5
    function asUint48x5(uint240 self) internal pure returns (Uint48x5) {
        return Uint48x5.wrap(bytes30(self));
    }

    /// @dev Cast a Uint48x5 into a bytes30
    function asBytes30(Uint48x5 self) internal pure returns (bytes30) {
        return Uint48x5.unwrap(self);
    }

    /// @dev Cast a Uint48x5 into a uint240
    function asUint240(Uint48x5 self) internal pure returns (uint240) {
        return uint240(Uint48x5.unwrap(self));
    }

    function at(Uint48x5 self, uint8 pos) internal pure returns (uint48) {
        if (pos > 4) revert OutOfBoundAccessUint48x5(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint48x5 self, uint8 pos) internal pure returns (uint48) {
        unchecked {
            return uint48(bytes6(_extractLeftmostBits(bytes32(Uint48x5.unwrap(self)), 48 * pos, 48)));
        }
    }

    /// @dev Pack 5 uint48 into a Uint48x5
    function pack(
        uint48 arg0,
        uint48 arg1,
        uint48 arg2,
        uint48 arg3,
        uint48 arg4
    ) internal pure returns (Uint48x5 result) {
        assembly {
            result := shr(208, arg0)
            result := or(result, shr(160, arg1))
            result := or(result, shr(112, arg2))
            result := or(result, shr(64, arg3))
            result := or(result, shr(16, arg4))
        }
    }

    /// @dev Split a Uint48x5 into 5 uint48
    function split(Uint48x5 self) internal pure returns (uint48, uint48, uint48, uint48, uint48) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3), unsafeAt(self, 4));
    }

    type Uint40x6 is bytes30;

    error OutOfBoundAccessUint40x6(uint8);

    /// @dev Cast a bytes30 into a Uint40x6
    function asUint40x6(bytes30 self) internal pure returns (Uint40x6) {
        return Uint40x6.wrap(self);
    }

    /// @dev Cast a uint240 into a Uint40x6
    function asUint40x6(uint240 self) internal pure returns (Uint40x6) {
        return Uint40x6.wrap(bytes30(self));
    }

    /// @dev Cast a Uint40x6 into a bytes30
    function asBytes30(Uint40x6 self) internal pure returns (bytes30) {
        return Uint40x6.unwrap(self);
    }

    /// @dev Cast a Uint40x6 into a uint240
    function asUint240(Uint40x6 self) internal pure returns (uint240) {
        return uint240(Uint40x6.unwrap(self));
    }

    function at(Uint40x6 self, uint8 pos) internal pure returns (uint40) {
        if (pos > 5) revert OutOfBoundAccessUint40x6(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint40x6 self, uint8 pos) internal pure returns (uint40) {
        unchecked {
            return uint40(bytes5(_extractLeftmostBits(bytes32(Uint40x6.unwrap(self)), 40 * pos, 40)));
        }
    }

    /// @dev Pack 6 uint40 into a Uint40x6
    function pack(
        uint40 arg0,
        uint40 arg1,
        uint40 arg2,
        uint40 arg3,
        uint40 arg4,
        uint40 arg5
    ) internal pure returns (Uint40x6 result) {
        assembly {
            result := shr(216, arg0)
            result := or(result, shr(176, arg1))
            result := or(result, shr(136, arg2))
            result := or(result, shr(96, arg3))
            result := or(result, shr(56, arg4))
            result := or(result, shr(16, arg5))
        }
    }

    /// @dev Split a Uint40x6 into 6 uint40
    function split(Uint40x6 self) internal pure returns (uint40, uint40, uint40, uint40, uint40, uint40) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5)
        );
    }

    type Uint24x10 is bytes30;

    error OutOfBoundAccessUint24x10(uint8);

    /// @dev Cast a bytes30 into a Uint24x10
    function asUint24x10(bytes30 self) internal pure returns (Uint24x10) {
        return Uint24x10.wrap(self);
    }

    /// @dev Cast a uint240 into a Uint24x10
    function asUint24x10(uint240 self) internal pure returns (Uint24x10) {
        return Uint24x10.wrap(bytes30(self));
    }

    /// @dev Cast a Uint24x10 into a bytes30
    function asBytes30(Uint24x10 self) internal pure returns (bytes30) {
        return Uint24x10.unwrap(self);
    }

    /// @dev Cast a Uint24x10 into a uint240
    function asUint240(Uint24x10 self) internal pure returns (uint240) {
        return uint240(Uint24x10.unwrap(self));
    }

    function at(Uint24x10 self, uint8 pos) internal pure returns (uint24) {
        if (pos > 9) revert OutOfBoundAccessUint24x10(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint24x10 self, uint8 pos) internal pure returns (uint24) {
        unchecked {
            return uint24(bytes3(_extractLeftmostBits(bytes32(Uint24x10.unwrap(self)), 24 * pos, 24)));
        }
    }

    type Uint16x15 is bytes30;

    error OutOfBoundAccessUint16x15(uint8);

    /// @dev Cast a bytes30 into a Uint16x15
    function asUint16x15(bytes30 self) internal pure returns (Uint16x15) {
        return Uint16x15.wrap(self);
    }

    /// @dev Cast a uint240 into a Uint16x15
    function asUint16x15(uint240 self) internal pure returns (Uint16x15) {
        return Uint16x15.wrap(bytes30(self));
    }

    /// @dev Cast a Uint16x15 into a bytes30
    function asBytes30(Uint16x15 self) internal pure returns (bytes30) {
        return Uint16x15.unwrap(self);
    }

    /// @dev Cast a Uint16x15 into a uint240
    function asUint240(Uint16x15 self) internal pure returns (uint240) {
        return uint240(Uint16x15.unwrap(self));
    }

    function at(Uint16x15 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 14) revert OutOfBoundAccessUint16x15(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x15 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x15.unwrap(self)), 16 * pos, 16)));
        }
    }

    type Uint8x30 is bytes30;

    error OutOfBoundAccessUint8x30(uint8);

    /// @dev Cast a bytes30 into a Uint8x30
    function asUint8x30(bytes30 self) internal pure returns (Uint8x30) {
        return Uint8x30.wrap(self);
    }

    /// @dev Cast a uint240 into a Uint8x30
    function asUint8x30(uint240 self) internal pure returns (Uint8x30) {
        return Uint8x30.wrap(bytes30(self));
    }

    /// @dev Cast a Uint8x30 into a bytes30
    function asBytes30(Uint8x30 self) internal pure returns (bytes30) {
        return Uint8x30.unwrap(self);
    }

    /// @dev Cast a Uint8x30 into a uint240
    function asUint240(Uint8x30 self) internal pure returns (uint240) {
        return uint240(Uint8x30.unwrap(self));
    }

    function at(Uint8x30 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 29) revert OutOfBoundAccessUint8x30(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x30 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x30.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint8x29 is bytes29;

    error OutOfBoundAccessUint8x29(uint8);

    /// @dev Cast a bytes29 into a Uint8x29
    function asUint8x29(bytes29 self) internal pure returns (Uint8x29) {
        return Uint8x29.wrap(self);
    }

    /// @dev Cast a uint232 into a Uint8x29
    function asUint8x29(uint232 self) internal pure returns (Uint8x29) {
        return Uint8x29.wrap(bytes29(self));
    }

    /// @dev Cast a Uint8x29 into a bytes29
    function asBytes29(Uint8x29 self) internal pure returns (bytes29) {
        return Uint8x29.unwrap(self);
    }

    /// @dev Cast a Uint8x29 into a uint232
    function asUint232(Uint8x29 self) internal pure returns (uint232) {
        return uint232(Uint8x29.unwrap(self));
    }

    function at(Uint8x29 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 28) revert OutOfBoundAccessUint8x29(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x29 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x29.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint112x2 is bytes28;

    error OutOfBoundAccessUint112x2(uint8);

    /// @dev Cast a bytes28 into a Uint112x2
    function asUint112x2(bytes28 self) internal pure returns (Uint112x2) {
        return Uint112x2.wrap(self);
    }

    /// @dev Cast a uint224 into a Uint112x2
    function asUint112x2(uint224 self) internal pure returns (Uint112x2) {
        return Uint112x2.wrap(bytes28(self));
    }

    /// @dev Cast a Uint112x2 into a bytes28
    function asBytes28(Uint112x2 self) internal pure returns (bytes28) {
        return Uint112x2.unwrap(self);
    }

    /// @dev Cast a Uint112x2 into a uint224
    function asUint224(Uint112x2 self) internal pure returns (uint224) {
        return uint224(Uint112x2.unwrap(self));
    }

    function at(Uint112x2 self, uint8 pos) internal pure returns (uint112) {
        if (pos > 1) revert OutOfBoundAccessUint112x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint112x2 self, uint8 pos) internal pure returns (uint112) {
        unchecked {
            return uint112(bytes14(_extractLeftmostBits(bytes32(Uint112x2.unwrap(self)), 112 * pos, 112)));
        }
    }

    /// @dev Pack 2 uint112 into a Uint112x2
    function pack(uint112 arg0, uint112 arg1) internal pure returns (Uint112x2 result) {
        assembly {
            result := shr(144, arg0)
            result := or(result, shr(32, arg1))
        }
    }

    /// @dev Split a Uint112x2 into 2 uint112
    function split(Uint112x2 self) internal pure returns (uint112, uint112) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint56x4 is bytes28;

    error OutOfBoundAccessUint56x4(uint8);

    /// @dev Cast a bytes28 into a Uint56x4
    function asUint56x4(bytes28 self) internal pure returns (Uint56x4) {
        return Uint56x4.wrap(self);
    }

    /// @dev Cast a uint224 into a Uint56x4
    function asUint56x4(uint224 self) internal pure returns (Uint56x4) {
        return Uint56x4.wrap(bytes28(self));
    }

    /// @dev Cast a Uint56x4 into a bytes28
    function asBytes28(Uint56x4 self) internal pure returns (bytes28) {
        return Uint56x4.unwrap(self);
    }

    /// @dev Cast a Uint56x4 into a uint224
    function asUint224(Uint56x4 self) internal pure returns (uint224) {
        return uint224(Uint56x4.unwrap(self));
    }

    function at(Uint56x4 self, uint8 pos) internal pure returns (uint56) {
        if (pos > 3) revert OutOfBoundAccessUint56x4(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint56x4 self, uint8 pos) internal pure returns (uint56) {
        unchecked {
            return uint56(bytes7(_extractLeftmostBits(bytes32(Uint56x4.unwrap(self)), 56 * pos, 56)));
        }
    }

    /// @dev Pack 4 uint56 into a Uint56x4
    function pack(uint56 arg0, uint56 arg1, uint56 arg2, uint56 arg3) internal pure returns (Uint56x4 result) {
        assembly {
            result := shr(200, arg0)
            result := or(result, shr(144, arg1))
            result := or(result, shr(88, arg2))
            result := or(result, shr(32, arg3))
        }
    }

    /// @dev Split a Uint56x4 into 4 uint56
    function split(Uint56x4 self) internal pure returns (uint56, uint56, uint56, uint56) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3));
    }

    type Uint32x7 is bytes28;

    error OutOfBoundAccessUint32x7(uint8);

    /// @dev Cast a bytes28 into a Uint32x7
    function asUint32x7(bytes28 self) internal pure returns (Uint32x7) {
        return Uint32x7.wrap(self);
    }

    /// @dev Cast a uint224 into a Uint32x7
    function asUint32x7(uint224 self) internal pure returns (Uint32x7) {
        return Uint32x7.wrap(bytes28(self));
    }

    /// @dev Cast a Uint32x7 into a bytes28
    function asBytes28(Uint32x7 self) internal pure returns (bytes28) {
        return Uint32x7.unwrap(self);
    }

    /// @dev Cast a Uint32x7 into a uint224
    function asUint224(Uint32x7 self) internal pure returns (uint224) {
        return uint224(Uint32x7.unwrap(self));
    }

    function at(Uint32x7 self, uint8 pos) internal pure returns (uint32) {
        if (pos > 6) revert OutOfBoundAccessUint32x7(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint32x7 self, uint8 pos) internal pure returns (uint32) {
        unchecked {
            return uint32(bytes4(_extractLeftmostBits(bytes32(Uint32x7.unwrap(self)), 32 * pos, 32)));
        }
    }

    /// @dev Pack 7 uint32 into a Uint32x7
    function pack(
        uint32 arg0,
        uint32 arg1,
        uint32 arg2,
        uint32 arg3,
        uint32 arg4,
        uint32 arg5,
        uint32 arg6
    ) internal pure returns (Uint32x7 result) {
        assembly {
            result := shr(224, arg0)
            result := or(result, shr(192, arg1))
            result := or(result, shr(160, arg2))
            result := or(result, shr(128, arg3))
            result := or(result, shr(96, arg4))
            result := or(result, shr(64, arg5))
            result := or(result, shr(32, arg6))
        }
    }

    /// @dev Split a Uint32x7 into 7 uint32
    function split(Uint32x7 self) internal pure returns (uint32, uint32, uint32, uint32, uint32, uint32, uint32) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5),
            unsafeAt(self, 6)
        );
    }

    type Uint16x14 is bytes28;

    error OutOfBoundAccessUint16x14(uint8);

    /// @dev Cast a bytes28 into a Uint16x14
    function asUint16x14(bytes28 self) internal pure returns (Uint16x14) {
        return Uint16x14.wrap(self);
    }

    /// @dev Cast a uint224 into a Uint16x14
    function asUint16x14(uint224 self) internal pure returns (Uint16x14) {
        return Uint16x14.wrap(bytes28(self));
    }

    /// @dev Cast a Uint16x14 into a bytes28
    function asBytes28(Uint16x14 self) internal pure returns (bytes28) {
        return Uint16x14.unwrap(self);
    }

    /// @dev Cast a Uint16x14 into a uint224
    function asUint224(Uint16x14 self) internal pure returns (uint224) {
        return uint224(Uint16x14.unwrap(self));
    }

    function at(Uint16x14 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 13) revert OutOfBoundAccessUint16x14(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x14 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x14.unwrap(self)), 16 * pos, 16)));
        }
    }

    type Uint8x28 is bytes28;

    error OutOfBoundAccessUint8x28(uint8);

    /// @dev Cast a bytes28 into a Uint8x28
    function asUint8x28(bytes28 self) internal pure returns (Uint8x28) {
        return Uint8x28.wrap(self);
    }

    /// @dev Cast a uint224 into a Uint8x28
    function asUint8x28(uint224 self) internal pure returns (Uint8x28) {
        return Uint8x28.wrap(bytes28(self));
    }

    /// @dev Cast a Uint8x28 into a bytes28
    function asBytes28(Uint8x28 self) internal pure returns (bytes28) {
        return Uint8x28.unwrap(self);
    }

    /// @dev Cast a Uint8x28 into a uint224
    function asUint224(Uint8x28 self) internal pure returns (uint224) {
        return uint224(Uint8x28.unwrap(self));
    }

    function at(Uint8x28 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 27) revert OutOfBoundAccessUint8x28(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x28 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x28.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint72x3 is bytes27;

    error OutOfBoundAccessUint72x3(uint8);

    /// @dev Cast a bytes27 into a Uint72x3
    function asUint72x3(bytes27 self) internal pure returns (Uint72x3) {
        return Uint72x3.wrap(self);
    }

    /// @dev Cast a uint216 into a Uint72x3
    function asUint72x3(uint216 self) internal pure returns (Uint72x3) {
        return Uint72x3.wrap(bytes27(self));
    }

    /// @dev Cast a Uint72x3 into a bytes27
    function asBytes27(Uint72x3 self) internal pure returns (bytes27) {
        return Uint72x3.unwrap(self);
    }

    /// @dev Cast a Uint72x3 into a uint216
    function asUint216(Uint72x3 self) internal pure returns (uint216) {
        return uint216(Uint72x3.unwrap(self));
    }

    function at(Uint72x3 self, uint8 pos) internal pure returns (uint72) {
        if (pos > 2) revert OutOfBoundAccessUint72x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint72x3 self, uint8 pos) internal pure returns (uint72) {
        unchecked {
            return uint72(bytes9(_extractLeftmostBits(bytes32(Uint72x3.unwrap(self)), 72 * pos, 72)));
        }
    }

    /// @dev Pack 3 uint72 into a Uint72x3
    function pack(uint72 arg0, uint72 arg1, uint72 arg2) internal pure returns (Uint72x3 result) {
        assembly {
            result := shr(184, arg0)
            result := or(result, shr(112, arg1))
            result := or(result, shr(40, arg2))
        }
    }

    /// @dev Split a Uint72x3 into 3 uint72
    function split(Uint72x3 self) internal pure returns (uint72, uint72, uint72) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint24x9 is bytes27;

    error OutOfBoundAccessUint24x9(uint8);

    /// @dev Cast a bytes27 into a Uint24x9
    function asUint24x9(bytes27 self) internal pure returns (Uint24x9) {
        return Uint24x9.wrap(self);
    }

    /// @dev Cast a uint216 into a Uint24x9
    function asUint24x9(uint216 self) internal pure returns (Uint24x9) {
        return Uint24x9.wrap(bytes27(self));
    }

    /// @dev Cast a Uint24x9 into a bytes27
    function asBytes27(Uint24x9 self) internal pure returns (bytes27) {
        return Uint24x9.unwrap(self);
    }

    /// @dev Cast a Uint24x9 into a uint216
    function asUint216(Uint24x9 self) internal pure returns (uint216) {
        return uint216(Uint24x9.unwrap(self));
    }

    function at(Uint24x9 self, uint8 pos) internal pure returns (uint24) {
        if (pos > 8) revert OutOfBoundAccessUint24x9(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint24x9 self, uint8 pos) internal pure returns (uint24) {
        unchecked {
            return uint24(bytes3(_extractLeftmostBits(bytes32(Uint24x9.unwrap(self)), 24 * pos, 24)));
        }
    }

    type Uint8x27 is bytes27;

    error OutOfBoundAccessUint8x27(uint8);

    /// @dev Cast a bytes27 into a Uint8x27
    function asUint8x27(bytes27 self) internal pure returns (Uint8x27) {
        return Uint8x27.wrap(self);
    }

    /// @dev Cast a uint216 into a Uint8x27
    function asUint8x27(uint216 self) internal pure returns (Uint8x27) {
        return Uint8x27.wrap(bytes27(self));
    }

    /// @dev Cast a Uint8x27 into a bytes27
    function asBytes27(Uint8x27 self) internal pure returns (bytes27) {
        return Uint8x27.unwrap(self);
    }

    /// @dev Cast a Uint8x27 into a uint216
    function asUint216(Uint8x27 self) internal pure returns (uint216) {
        return uint216(Uint8x27.unwrap(self));
    }

    function at(Uint8x27 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 26) revert OutOfBoundAccessUint8x27(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x27 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x27.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint104x2 is bytes26;

    error OutOfBoundAccessUint104x2(uint8);

    /// @dev Cast a bytes26 into a Uint104x2
    function asUint104x2(bytes26 self) internal pure returns (Uint104x2) {
        return Uint104x2.wrap(self);
    }

    /// @dev Cast a uint208 into a Uint104x2
    function asUint104x2(uint208 self) internal pure returns (Uint104x2) {
        return Uint104x2.wrap(bytes26(self));
    }

    /// @dev Cast a Uint104x2 into a bytes26
    function asBytes26(Uint104x2 self) internal pure returns (bytes26) {
        return Uint104x2.unwrap(self);
    }

    /// @dev Cast a Uint104x2 into a uint208
    function asUint208(Uint104x2 self) internal pure returns (uint208) {
        return uint208(Uint104x2.unwrap(self));
    }

    function at(Uint104x2 self, uint8 pos) internal pure returns (uint104) {
        if (pos > 1) revert OutOfBoundAccessUint104x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint104x2 self, uint8 pos) internal pure returns (uint104) {
        unchecked {
            return uint104(bytes13(_extractLeftmostBits(bytes32(Uint104x2.unwrap(self)), 104 * pos, 104)));
        }
    }

    /// @dev Pack 2 uint104 into a Uint104x2
    function pack(uint104 arg0, uint104 arg1) internal pure returns (Uint104x2 result) {
        assembly {
            result := shr(152, arg0)
            result := or(result, shr(48, arg1))
        }
    }

    /// @dev Split a Uint104x2 into 2 uint104
    function split(Uint104x2 self) internal pure returns (uint104, uint104) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint16x13 is bytes26;

    error OutOfBoundAccessUint16x13(uint8);

    /// @dev Cast a bytes26 into a Uint16x13
    function asUint16x13(bytes26 self) internal pure returns (Uint16x13) {
        return Uint16x13.wrap(self);
    }

    /// @dev Cast a uint208 into a Uint16x13
    function asUint16x13(uint208 self) internal pure returns (Uint16x13) {
        return Uint16x13.wrap(bytes26(self));
    }

    /// @dev Cast a Uint16x13 into a bytes26
    function asBytes26(Uint16x13 self) internal pure returns (bytes26) {
        return Uint16x13.unwrap(self);
    }

    /// @dev Cast a Uint16x13 into a uint208
    function asUint208(Uint16x13 self) internal pure returns (uint208) {
        return uint208(Uint16x13.unwrap(self));
    }

    function at(Uint16x13 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 12) revert OutOfBoundAccessUint16x13(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x13 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x13.unwrap(self)), 16 * pos, 16)));
        }
    }

    type Uint8x26 is bytes26;

    error OutOfBoundAccessUint8x26(uint8);

    /// @dev Cast a bytes26 into a Uint8x26
    function asUint8x26(bytes26 self) internal pure returns (Uint8x26) {
        return Uint8x26.wrap(self);
    }

    /// @dev Cast a uint208 into a Uint8x26
    function asUint8x26(uint208 self) internal pure returns (Uint8x26) {
        return Uint8x26.wrap(bytes26(self));
    }

    /// @dev Cast a Uint8x26 into a bytes26
    function asBytes26(Uint8x26 self) internal pure returns (bytes26) {
        return Uint8x26.unwrap(self);
    }

    /// @dev Cast a Uint8x26 into a uint208
    function asUint208(Uint8x26 self) internal pure returns (uint208) {
        return uint208(Uint8x26.unwrap(self));
    }

    function at(Uint8x26 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 25) revert OutOfBoundAccessUint8x26(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x26 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x26.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint40x5 is bytes25;

    error OutOfBoundAccessUint40x5(uint8);

    /// @dev Cast a bytes25 into a Uint40x5
    function asUint40x5(bytes25 self) internal pure returns (Uint40x5) {
        return Uint40x5.wrap(self);
    }

    /// @dev Cast a uint200 into a Uint40x5
    function asUint40x5(uint200 self) internal pure returns (Uint40x5) {
        return Uint40x5.wrap(bytes25(self));
    }

    /// @dev Cast a Uint40x5 into a bytes25
    function asBytes25(Uint40x5 self) internal pure returns (bytes25) {
        return Uint40x5.unwrap(self);
    }

    /// @dev Cast a Uint40x5 into a uint200
    function asUint200(Uint40x5 self) internal pure returns (uint200) {
        return uint200(Uint40x5.unwrap(self));
    }

    function at(Uint40x5 self, uint8 pos) internal pure returns (uint40) {
        if (pos > 4) revert OutOfBoundAccessUint40x5(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint40x5 self, uint8 pos) internal pure returns (uint40) {
        unchecked {
            return uint40(bytes5(_extractLeftmostBits(bytes32(Uint40x5.unwrap(self)), 40 * pos, 40)));
        }
    }

    /// @dev Pack 5 uint40 into a Uint40x5
    function pack(
        uint40 arg0,
        uint40 arg1,
        uint40 arg2,
        uint40 arg3,
        uint40 arg4
    ) internal pure returns (Uint40x5 result) {
        assembly {
            result := shr(216, arg0)
            result := or(result, shr(176, arg1))
            result := or(result, shr(136, arg2))
            result := or(result, shr(96, arg3))
            result := or(result, shr(56, arg4))
        }
    }

    /// @dev Split a Uint40x5 into 5 uint40
    function split(Uint40x5 self) internal pure returns (uint40, uint40, uint40, uint40, uint40) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3), unsafeAt(self, 4));
    }

    type Uint8x25 is bytes25;

    error OutOfBoundAccessUint8x25(uint8);

    /// @dev Cast a bytes25 into a Uint8x25
    function asUint8x25(bytes25 self) internal pure returns (Uint8x25) {
        return Uint8x25.wrap(self);
    }

    /// @dev Cast a uint200 into a Uint8x25
    function asUint8x25(uint200 self) internal pure returns (Uint8x25) {
        return Uint8x25.wrap(bytes25(self));
    }

    /// @dev Cast a Uint8x25 into a bytes25
    function asBytes25(Uint8x25 self) internal pure returns (bytes25) {
        return Uint8x25.unwrap(self);
    }

    /// @dev Cast a Uint8x25 into a uint200
    function asUint200(Uint8x25 self) internal pure returns (uint200) {
        return uint200(Uint8x25.unwrap(self));
    }

    function at(Uint8x25 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 24) revert OutOfBoundAccessUint8x25(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x25 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x25.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint96x2 is bytes24;

    error OutOfBoundAccessUint96x2(uint8);

    /// @dev Cast a bytes24 into a Uint96x2
    function asUint96x2(bytes24 self) internal pure returns (Uint96x2) {
        return Uint96x2.wrap(self);
    }

    /// @dev Cast a uint192 into a Uint96x2
    function asUint96x2(uint192 self) internal pure returns (Uint96x2) {
        return Uint96x2.wrap(bytes24(self));
    }

    /// @dev Cast a Uint96x2 into a bytes24
    function asBytes24(Uint96x2 self) internal pure returns (bytes24) {
        return Uint96x2.unwrap(self);
    }

    /// @dev Cast a Uint96x2 into a uint192
    function asUint192(Uint96x2 self) internal pure returns (uint192) {
        return uint192(Uint96x2.unwrap(self));
    }

    function at(Uint96x2 self, uint8 pos) internal pure returns (uint96) {
        if (pos > 1) revert OutOfBoundAccessUint96x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint96x2 self, uint8 pos) internal pure returns (uint96) {
        unchecked {
            return uint96(bytes12(_extractLeftmostBits(bytes32(Uint96x2.unwrap(self)), 96 * pos, 96)));
        }
    }

    /// @dev Pack 2 uint96 into a Uint96x2
    function pack(uint96 arg0, uint96 arg1) internal pure returns (Uint96x2 result) {
        assembly {
            result := shr(160, arg0)
            result := or(result, shr(64, arg1))
        }
    }

    /// @dev Split a Uint96x2 into 2 uint96
    function split(Uint96x2 self) internal pure returns (uint96, uint96) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint64x3 is bytes24;

    error OutOfBoundAccessUint64x3(uint8);

    /// @dev Cast a bytes24 into a Uint64x3
    function asUint64x3(bytes24 self) internal pure returns (Uint64x3) {
        return Uint64x3.wrap(self);
    }

    /// @dev Cast a uint192 into a Uint64x3
    function asUint64x3(uint192 self) internal pure returns (Uint64x3) {
        return Uint64x3.wrap(bytes24(self));
    }

    /// @dev Cast a Uint64x3 into a bytes24
    function asBytes24(Uint64x3 self) internal pure returns (bytes24) {
        return Uint64x3.unwrap(self);
    }

    /// @dev Cast a Uint64x3 into a uint192
    function asUint192(Uint64x3 self) internal pure returns (uint192) {
        return uint192(Uint64x3.unwrap(self));
    }

    function at(Uint64x3 self, uint8 pos) internal pure returns (uint64) {
        if (pos > 2) revert OutOfBoundAccessUint64x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint64x3 self, uint8 pos) internal pure returns (uint64) {
        unchecked {
            return uint64(bytes8(_extractLeftmostBits(bytes32(Uint64x3.unwrap(self)), 64 * pos, 64)));
        }
    }

    /// @dev Pack 3 uint64 into a Uint64x3
    function pack(uint64 arg0, uint64 arg1, uint64 arg2) internal pure returns (Uint64x3 result) {
        assembly {
            result := shr(192, arg0)
            result := or(result, shr(128, arg1))
            result := or(result, shr(64, arg2))
        }
    }

    /// @dev Split a Uint64x3 into 3 uint64
    function split(Uint64x3 self) internal pure returns (uint64, uint64, uint64) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint48x4 is bytes24;

    error OutOfBoundAccessUint48x4(uint8);

    /// @dev Cast a bytes24 into a Uint48x4
    function asUint48x4(bytes24 self) internal pure returns (Uint48x4) {
        return Uint48x4.wrap(self);
    }

    /// @dev Cast a uint192 into a Uint48x4
    function asUint48x4(uint192 self) internal pure returns (Uint48x4) {
        return Uint48x4.wrap(bytes24(self));
    }

    /// @dev Cast a Uint48x4 into a bytes24
    function asBytes24(Uint48x4 self) internal pure returns (bytes24) {
        return Uint48x4.unwrap(self);
    }

    /// @dev Cast a Uint48x4 into a uint192
    function asUint192(Uint48x4 self) internal pure returns (uint192) {
        return uint192(Uint48x4.unwrap(self));
    }

    function at(Uint48x4 self, uint8 pos) internal pure returns (uint48) {
        if (pos > 3) revert OutOfBoundAccessUint48x4(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint48x4 self, uint8 pos) internal pure returns (uint48) {
        unchecked {
            return uint48(bytes6(_extractLeftmostBits(bytes32(Uint48x4.unwrap(self)), 48 * pos, 48)));
        }
    }

    /// @dev Pack 4 uint48 into a Uint48x4
    function pack(uint48 arg0, uint48 arg1, uint48 arg2, uint48 arg3) internal pure returns (Uint48x4 result) {
        assembly {
            result := shr(208, arg0)
            result := or(result, shr(160, arg1))
            result := or(result, shr(112, arg2))
            result := or(result, shr(64, arg3))
        }
    }

    /// @dev Split a Uint48x4 into 4 uint48
    function split(Uint48x4 self) internal pure returns (uint48, uint48, uint48, uint48) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3));
    }

    type Uint32x6 is bytes24;

    error OutOfBoundAccessUint32x6(uint8);

    /// @dev Cast a bytes24 into a Uint32x6
    function asUint32x6(bytes24 self) internal pure returns (Uint32x6) {
        return Uint32x6.wrap(self);
    }

    /// @dev Cast a uint192 into a Uint32x6
    function asUint32x6(uint192 self) internal pure returns (Uint32x6) {
        return Uint32x6.wrap(bytes24(self));
    }

    /// @dev Cast a Uint32x6 into a bytes24
    function asBytes24(Uint32x6 self) internal pure returns (bytes24) {
        return Uint32x6.unwrap(self);
    }

    /// @dev Cast a Uint32x6 into a uint192
    function asUint192(Uint32x6 self) internal pure returns (uint192) {
        return uint192(Uint32x6.unwrap(self));
    }

    function at(Uint32x6 self, uint8 pos) internal pure returns (uint32) {
        if (pos > 5) revert OutOfBoundAccessUint32x6(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint32x6 self, uint8 pos) internal pure returns (uint32) {
        unchecked {
            return uint32(bytes4(_extractLeftmostBits(bytes32(Uint32x6.unwrap(self)), 32 * pos, 32)));
        }
    }

    /// @dev Pack 6 uint32 into a Uint32x6
    function pack(
        uint32 arg0,
        uint32 arg1,
        uint32 arg2,
        uint32 arg3,
        uint32 arg4,
        uint32 arg5
    ) internal pure returns (Uint32x6 result) {
        assembly {
            result := shr(224, arg0)
            result := or(result, shr(192, arg1))
            result := or(result, shr(160, arg2))
            result := or(result, shr(128, arg3))
            result := or(result, shr(96, arg4))
            result := or(result, shr(64, arg5))
        }
    }

    /// @dev Split a Uint32x6 into 6 uint32
    function split(Uint32x6 self) internal pure returns (uint32, uint32, uint32, uint32, uint32, uint32) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5)
        );
    }

    type Uint24x8 is bytes24;

    error OutOfBoundAccessUint24x8(uint8);

    /// @dev Cast a bytes24 into a Uint24x8
    function asUint24x8(bytes24 self) internal pure returns (Uint24x8) {
        return Uint24x8.wrap(self);
    }

    /// @dev Cast a uint192 into a Uint24x8
    function asUint24x8(uint192 self) internal pure returns (Uint24x8) {
        return Uint24x8.wrap(bytes24(self));
    }

    /// @dev Cast a Uint24x8 into a bytes24
    function asBytes24(Uint24x8 self) internal pure returns (bytes24) {
        return Uint24x8.unwrap(self);
    }

    /// @dev Cast a Uint24x8 into a uint192
    function asUint192(Uint24x8 self) internal pure returns (uint192) {
        return uint192(Uint24x8.unwrap(self));
    }

    function at(Uint24x8 self, uint8 pos) internal pure returns (uint24) {
        if (pos > 7) revert OutOfBoundAccessUint24x8(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint24x8 self, uint8 pos) internal pure returns (uint24) {
        unchecked {
            return uint24(bytes3(_extractLeftmostBits(bytes32(Uint24x8.unwrap(self)), 24 * pos, 24)));
        }
    }

    /// @dev Pack 8 uint24 into a Uint24x8
    function pack(
        uint24 arg0,
        uint24 arg1,
        uint24 arg2,
        uint24 arg3,
        uint24 arg4,
        uint24 arg5,
        uint24 arg6,
        uint24 arg7
    ) internal pure returns (Uint24x8 result) {
        assembly {
            result := shr(232, arg0)
            result := or(result, shr(208, arg1))
            result := or(result, shr(184, arg2))
            result := or(result, shr(160, arg3))
            result := or(result, shr(136, arg4))
            result := or(result, shr(112, arg5))
            result := or(result, shr(88, arg6))
            result := or(result, shr(64, arg7))
        }
    }

    /// @dev Split a Uint24x8 into 8 uint24
    function split(
        Uint24x8 self
    ) internal pure returns (uint24, uint24, uint24, uint24, uint24, uint24, uint24, uint24) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5),
            unsafeAt(self, 6),
            unsafeAt(self, 7)
        );
    }

    type Uint16x12 is bytes24;

    error OutOfBoundAccessUint16x12(uint8);

    /// @dev Cast a bytes24 into a Uint16x12
    function asUint16x12(bytes24 self) internal pure returns (Uint16x12) {
        return Uint16x12.wrap(self);
    }

    /// @dev Cast a uint192 into a Uint16x12
    function asUint16x12(uint192 self) internal pure returns (Uint16x12) {
        return Uint16x12.wrap(bytes24(self));
    }

    /// @dev Cast a Uint16x12 into a bytes24
    function asBytes24(Uint16x12 self) internal pure returns (bytes24) {
        return Uint16x12.unwrap(self);
    }

    /// @dev Cast a Uint16x12 into a uint192
    function asUint192(Uint16x12 self) internal pure returns (uint192) {
        return uint192(Uint16x12.unwrap(self));
    }

    function at(Uint16x12 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 11) revert OutOfBoundAccessUint16x12(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x12 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x12.unwrap(self)), 16 * pos, 16)));
        }
    }

    type Uint8x24 is bytes24;

    error OutOfBoundAccessUint8x24(uint8);

    /// @dev Cast a bytes24 into a Uint8x24
    function asUint8x24(bytes24 self) internal pure returns (Uint8x24) {
        return Uint8x24.wrap(self);
    }

    /// @dev Cast a uint192 into a Uint8x24
    function asUint8x24(uint192 self) internal pure returns (Uint8x24) {
        return Uint8x24.wrap(bytes24(self));
    }

    /// @dev Cast a Uint8x24 into a bytes24
    function asBytes24(Uint8x24 self) internal pure returns (bytes24) {
        return Uint8x24.unwrap(self);
    }

    /// @dev Cast a Uint8x24 into a uint192
    function asUint192(Uint8x24 self) internal pure returns (uint192) {
        return uint192(Uint8x24.unwrap(self));
    }

    function at(Uint8x24 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 23) revert OutOfBoundAccessUint8x24(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x24 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x24.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint8x23 is bytes23;

    error OutOfBoundAccessUint8x23(uint8);

    /// @dev Cast a bytes23 into a Uint8x23
    function asUint8x23(bytes23 self) internal pure returns (Uint8x23) {
        return Uint8x23.wrap(self);
    }

    /// @dev Cast a uint184 into a Uint8x23
    function asUint8x23(uint184 self) internal pure returns (Uint8x23) {
        return Uint8x23.wrap(bytes23(self));
    }

    /// @dev Cast a Uint8x23 into a bytes23
    function asBytes23(Uint8x23 self) internal pure returns (bytes23) {
        return Uint8x23.unwrap(self);
    }

    /// @dev Cast a Uint8x23 into a uint184
    function asUint184(Uint8x23 self) internal pure returns (uint184) {
        return uint184(Uint8x23.unwrap(self));
    }

    function at(Uint8x23 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 22) revert OutOfBoundAccessUint8x23(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x23 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x23.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint88x2 is bytes22;

    error OutOfBoundAccessUint88x2(uint8);

    /// @dev Cast a bytes22 into a Uint88x2
    function asUint88x2(bytes22 self) internal pure returns (Uint88x2) {
        return Uint88x2.wrap(self);
    }

    /// @dev Cast a uint176 into a Uint88x2
    function asUint88x2(uint176 self) internal pure returns (Uint88x2) {
        return Uint88x2.wrap(bytes22(self));
    }

    /// @dev Cast a Uint88x2 into a bytes22
    function asBytes22(Uint88x2 self) internal pure returns (bytes22) {
        return Uint88x2.unwrap(self);
    }

    /// @dev Cast a Uint88x2 into a uint176
    function asUint176(Uint88x2 self) internal pure returns (uint176) {
        return uint176(Uint88x2.unwrap(self));
    }

    function at(Uint88x2 self, uint8 pos) internal pure returns (uint88) {
        if (pos > 1) revert OutOfBoundAccessUint88x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint88x2 self, uint8 pos) internal pure returns (uint88) {
        unchecked {
            return uint88(bytes11(_extractLeftmostBits(bytes32(Uint88x2.unwrap(self)), 88 * pos, 88)));
        }
    }

    /// @dev Pack 2 uint88 into a Uint88x2
    function pack(uint88 arg0, uint88 arg1) internal pure returns (Uint88x2 result) {
        assembly {
            result := shr(168, arg0)
            result := or(result, shr(80, arg1))
        }
    }

    /// @dev Split a Uint88x2 into 2 uint88
    function split(Uint88x2 self) internal pure returns (uint88, uint88) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint16x11 is bytes22;

    error OutOfBoundAccessUint16x11(uint8);

    /// @dev Cast a bytes22 into a Uint16x11
    function asUint16x11(bytes22 self) internal pure returns (Uint16x11) {
        return Uint16x11.wrap(self);
    }

    /// @dev Cast a uint176 into a Uint16x11
    function asUint16x11(uint176 self) internal pure returns (Uint16x11) {
        return Uint16x11.wrap(bytes22(self));
    }

    /// @dev Cast a Uint16x11 into a bytes22
    function asBytes22(Uint16x11 self) internal pure returns (bytes22) {
        return Uint16x11.unwrap(self);
    }

    /// @dev Cast a Uint16x11 into a uint176
    function asUint176(Uint16x11 self) internal pure returns (uint176) {
        return uint176(Uint16x11.unwrap(self));
    }

    function at(Uint16x11 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 10) revert OutOfBoundAccessUint16x11(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x11 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x11.unwrap(self)), 16 * pos, 16)));
        }
    }

    type Uint8x22 is bytes22;

    error OutOfBoundAccessUint8x22(uint8);

    /// @dev Cast a bytes22 into a Uint8x22
    function asUint8x22(bytes22 self) internal pure returns (Uint8x22) {
        return Uint8x22.wrap(self);
    }

    /// @dev Cast a uint176 into a Uint8x22
    function asUint8x22(uint176 self) internal pure returns (Uint8x22) {
        return Uint8x22.wrap(bytes22(self));
    }

    /// @dev Cast a Uint8x22 into a bytes22
    function asBytes22(Uint8x22 self) internal pure returns (bytes22) {
        return Uint8x22.unwrap(self);
    }

    /// @dev Cast a Uint8x22 into a uint176
    function asUint176(Uint8x22 self) internal pure returns (uint176) {
        return uint176(Uint8x22.unwrap(self));
    }

    function at(Uint8x22 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 21) revert OutOfBoundAccessUint8x22(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x22 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x22.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint56x3 is bytes21;

    error OutOfBoundAccessUint56x3(uint8);

    /// @dev Cast a bytes21 into a Uint56x3
    function asUint56x3(bytes21 self) internal pure returns (Uint56x3) {
        return Uint56x3.wrap(self);
    }

    /// @dev Cast a uint168 into a Uint56x3
    function asUint56x3(uint168 self) internal pure returns (Uint56x3) {
        return Uint56x3.wrap(bytes21(self));
    }

    /// @dev Cast a Uint56x3 into a bytes21
    function asBytes21(Uint56x3 self) internal pure returns (bytes21) {
        return Uint56x3.unwrap(self);
    }

    /// @dev Cast a Uint56x3 into a uint168
    function asUint168(Uint56x3 self) internal pure returns (uint168) {
        return uint168(Uint56x3.unwrap(self));
    }

    function at(Uint56x3 self, uint8 pos) internal pure returns (uint56) {
        if (pos > 2) revert OutOfBoundAccessUint56x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint56x3 self, uint8 pos) internal pure returns (uint56) {
        unchecked {
            return uint56(bytes7(_extractLeftmostBits(bytes32(Uint56x3.unwrap(self)), 56 * pos, 56)));
        }
    }

    /// @dev Pack 3 uint56 into a Uint56x3
    function pack(uint56 arg0, uint56 arg1, uint56 arg2) internal pure returns (Uint56x3 result) {
        assembly {
            result := shr(200, arg0)
            result := or(result, shr(144, arg1))
            result := or(result, shr(88, arg2))
        }
    }

    /// @dev Split a Uint56x3 into 3 uint56
    function split(Uint56x3 self) internal pure returns (uint56, uint56, uint56) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint24x7 is bytes21;

    error OutOfBoundAccessUint24x7(uint8);

    /// @dev Cast a bytes21 into a Uint24x7
    function asUint24x7(bytes21 self) internal pure returns (Uint24x7) {
        return Uint24x7.wrap(self);
    }

    /// @dev Cast a uint168 into a Uint24x7
    function asUint24x7(uint168 self) internal pure returns (Uint24x7) {
        return Uint24x7.wrap(bytes21(self));
    }

    /// @dev Cast a Uint24x7 into a bytes21
    function asBytes21(Uint24x7 self) internal pure returns (bytes21) {
        return Uint24x7.unwrap(self);
    }

    /// @dev Cast a Uint24x7 into a uint168
    function asUint168(Uint24x7 self) internal pure returns (uint168) {
        return uint168(Uint24x7.unwrap(self));
    }

    function at(Uint24x7 self, uint8 pos) internal pure returns (uint24) {
        if (pos > 6) revert OutOfBoundAccessUint24x7(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint24x7 self, uint8 pos) internal pure returns (uint24) {
        unchecked {
            return uint24(bytes3(_extractLeftmostBits(bytes32(Uint24x7.unwrap(self)), 24 * pos, 24)));
        }
    }

    /// @dev Pack 7 uint24 into a Uint24x7
    function pack(
        uint24 arg0,
        uint24 arg1,
        uint24 arg2,
        uint24 arg3,
        uint24 arg4,
        uint24 arg5,
        uint24 arg6
    ) internal pure returns (Uint24x7 result) {
        assembly {
            result := shr(232, arg0)
            result := or(result, shr(208, arg1))
            result := or(result, shr(184, arg2))
            result := or(result, shr(160, arg3))
            result := or(result, shr(136, arg4))
            result := or(result, shr(112, arg5))
            result := or(result, shr(88, arg6))
        }
    }

    /// @dev Split a Uint24x7 into 7 uint24
    function split(Uint24x7 self) internal pure returns (uint24, uint24, uint24, uint24, uint24, uint24, uint24) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5),
            unsafeAt(self, 6)
        );
    }

    type Uint8x21 is bytes21;

    error OutOfBoundAccessUint8x21(uint8);

    /// @dev Cast a bytes21 into a Uint8x21
    function asUint8x21(bytes21 self) internal pure returns (Uint8x21) {
        return Uint8x21.wrap(self);
    }

    /// @dev Cast a uint168 into a Uint8x21
    function asUint8x21(uint168 self) internal pure returns (Uint8x21) {
        return Uint8x21.wrap(bytes21(self));
    }

    /// @dev Cast a Uint8x21 into a bytes21
    function asBytes21(Uint8x21 self) internal pure returns (bytes21) {
        return Uint8x21.unwrap(self);
    }

    /// @dev Cast a Uint8x21 into a uint168
    function asUint168(Uint8x21 self) internal pure returns (uint168) {
        return uint168(Uint8x21.unwrap(self));
    }

    function at(Uint8x21 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 20) revert OutOfBoundAccessUint8x21(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x21 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x21.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint80x2 is bytes20;

    error OutOfBoundAccessUint80x2(uint8);

    /// @dev Cast a bytes20 into a Uint80x2
    function asUint80x2(bytes20 self) internal pure returns (Uint80x2) {
        return Uint80x2.wrap(self);
    }

    /// @dev Cast a uint160 into a Uint80x2
    function asUint80x2(uint160 self) internal pure returns (Uint80x2) {
        return Uint80x2.wrap(bytes20(self));
    }

    /// @dev Cast a Uint80x2 into a bytes20
    function asBytes20(Uint80x2 self) internal pure returns (bytes20) {
        return Uint80x2.unwrap(self);
    }

    /// @dev Cast a Uint80x2 into a uint160
    function asUint160(Uint80x2 self) internal pure returns (uint160) {
        return uint160(Uint80x2.unwrap(self));
    }

    function at(Uint80x2 self, uint8 pos) internal pure returns (uint80) {
        if (pos > 1) revert OutOfBoundAccessUint80x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint80x2 self, uint8 pos) internal pure returns (uint80) {
        unchecked {
            return uint80(bytes10(_extractLeftmostBits(bytes32(Uint80x2.unwrap(self)), 80 * pos, 80)));
        }
    }

    /// @dev Pack 2 uint80 into a Uint80x2
    function pack(uint80 arg0, uint80 arg1) internal pure returns (Uint80x2 result) {
        assembly {
            result := shr(176, arg0)
            result := or(result, shr(96, arg1))
        }
    }

    /// @dev Split a Uint80x2 into 2 uint80
    function split(Uint80x2 self) internal pure returns (uint80, uint80) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint40x4 is bytes20;

    error OutOfBoundAccessUint40x4(uint8);

    /// @dev Cast a bytes20 into a Uint40x4
    function asUint40x4(bytes20 self) internal pure returns (Uint40x4) {
        return Uint40x4.wrap(self);
    }

    /// @dev Cast a uint160 into a Uint40x4
    function asUint40x4(uint160 self) internal pure returns (Uint40x4) {
        return Uint40x4.wrap(bytes20(self));
    }

    /// @dev Cast a Uint40x4 into a bytes20
    function asBytes20(Uint40x4 self) internal pure returns (bytes20) {
        return Uint40x4.unwrap(self);
    }

    /// @dev Cast a Uint40x4 into a uint160
    function asUint160(Uint40x4 self) internal pure returns (uint160) {
        return uint160(Uint40x4.unwrap(self));
    }

    function at(Uint40x4 self, uint8 pos) internal pure returns (uint40) {
        if (pos > 3) revert OutOfBoundAccessUint40x4(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint40x4 self, uint8 pos) internal pure returns (uint40) {
        unchecked {
            return uint40(bytes5(_extractLeftmostBits(bytes32(Uint40x4.unwrap(self)), 40 * pos, 40)));
        }
    }

    /// @dev Pack 4 uint40 into a Uint40x4
    function pack(uint40 arg0, uint40 arg1, uint40 arg2, uint40 arg3) internal pure returns (Uint40x4 result) {
        assembly {
            result := shr(216, arg0)
            result := or(result, shr(176, arg1))
            result := or(result, shr(136, arg2))
            result := or(result, shr(96, arg3))
        }
    }

    /// @dev Split a Uint40x4 into 4 uint40
    function split(Uint40x4 self) internal pure returns (uint40, uint40, uint40, uint40) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3));
    }

    type Uint32x5 is bytes20;

    error OutOfBoundAccessUint32x5(uint8);

    /// @dev Cast a bytes20 into a Uint32x5
    function asUint32x5(bytes20 self) internal pure returns (Uint32x5) {
        return Uint32x5.wrap(self);
    }

    /// @dev Cast a uint160 into a Uint32x5
    function asUint32x5(uint160 self) internal pure returns (Uint32x5) {
        return Uint32x5.wrap(bytes20(self));
    }

    /// @dev Cast a Uint32x5 into a bytes20
    function asBytes20(Uint32x5 self) internal pure returns (bytes20) {
        return Uint32x5.unwrap(self);
    }

    /// @dev Cast a Uint32x5 into a uint160
    function asUint160(Uint32x5 self) internal pure returns (uint160) {
        return uint160(Uint32x5.unwrap(self));
    }

    function at(Uint32x5 self, uint8 pos) internal pure returns (uint32) {
        if (pos > 4) revert OutOfBoundAccessUint32x5(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint32x5 self, uint8 pos) internal pure returns (uint32) {
        unchecked {
            return uint32(bytes4(_extractLeftmostBits(bytes32(Uint32x5.unwrap(self)), 32 * pos, 32)));
        }
    }

    /// @dev Pack 5 uint32 into a Uint32x5
    function pack(
        uint32 arg0,
        uint32 arg1,
        uint32 arg2,
        uint32 arg3,
        uint32 arg4
    ) internal pure returns (Uint32x5 result) {
        assembly {
            result := shr(224, arg0)
            result := or(result, shr(192, arg1))
            result := or(result, shr(160, arg2))
            result := or(result, shr(128, arg3))
            result := or(result, shr(96, arg4))
        }
    }

    /// @dev Split a Uint32x5 into 5 uint32
    function split(Uint32x5 self) internal pure returns (uint32, uint32, uint32, uint32, uint32) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3), unsafeAt(self, 4));
    }

    type Uint16x10 is bytes20;

    error OutOfBoundAccessUint16x10(uint8);

    /// @dev Cast a bytes20 into a Uint16x10
    function asUint16x10(bytes20 self) internal pure returns (Uint16x10) {
        return Uint16x10.wrap(self);
    }

    /// @dev Cast a uint160 into a Uint16x10
    function asUint16x10(uint160 self) internal pure returns (Uint16x10) {
        return Uint16x10.wrap(bytes20(self));
    }

    /// @dev Cast a Uint16x10 into a bytes20
    function asBytes20(Uint16x10 self) internal pure returns (bytes20) {
        return Uint16x10.unwrap(self);
    }

    /// @dev Cast a Uint16x10 into a uint160
    function asUint160(Uint16x10 self) internal pure returns (uint160) {
        return uint160(Uint16x10.unwrap(self));
    }

    function at(Uint16x10 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 9) revert OutOfBoundAccessUint16x10(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x10 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x10.unwrap(self)), 16 * pos, 16)));
        }
    }

    type Uint8x20 is bytes20;

    error OutOfBoundAccessUint8x20(uint8);

    /// @dev Cast a bytes20 into a Uint8x20
    function asUint8x20(bytes20 self) internal pure returns (Uint8x20) {
        return Uint8x20.wrap(self);
    }

    /// @dev Cast a uint160 into a Uint8x20
    function asUint8x20(uint160 self) internal pure returns (Uint8x20) {
        return Uint8x20.wrap(bytes20(self));
    }

    /// @dev Cast a Uint8x20 into a bytes20
    function asBytes20(Uint8x20 self) internal pure returns (bytes20) {
        return Uint8x20.unwrap(self);
    }

    /// @dev Cast a Uint8x20 into a uint160
    function asUint160(Uint8x20 self) internal pure returns (uint160) {
        return uint160(Uint8x20.unwrap(self));
    }

    function at(Uint8x20 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 19) revert OutOfBoundAccessUint8x20(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x20 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x20.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint8x19 is bytes19;

    error OutOfBoundAccessUint8x19(uint8);

    /// @dev Cast a bytes19 into a Uint8x19
    function asUint8x19(bytes19 self) internal pure returns (Uint8x19) {
        return Uint8x19.wrap(self);
    }

    /// @dev Cast a uint152 into a Uint8x19
    function asUint8x19(uint152 self) internal pure returns (Uint8x19) {
        return Uint8x19.wrap(bytes19(self));
    }

    /// @dev Cast a Uint8x19 into a bytes19
    function asBytes19(Uint8x19 self) internal pure returns (bytes19) {
        return Uint8x19.unwrap(self);
    }

    /// @dev Cast a Uint8x19 into a uint152
    function asUint152(Uint8x19 self) internal pure returns (uint152) {
        return uint152(Uint8x19.unwrap(self));
    }

    function at(Uint8x19 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 18) revert OutOfBoundAccessUint8x19(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x19 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x19.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint72x2 is bytes18;

    error OutOfBoundAccessUint72x2(uint8);

    /// @dev Cast a bytes18 into a Uint72x2
    function asUint72x2(bytes18 self) internal pure returns (Uint72x2) {
        return Uint72x2.wrap(self);
    }

    /// @dev Cast a uint144 into a Uint72x2
    function asUint72x2(uint144 self) internal pure returns (Uint72x2) {
        return Uint72x2.wrap(bytes18(self));
    }

    /// @dev Cast a Uint72x2 into a bytes18
    function asBytes18(Uint72x2 self) internal pure returns (bytes18) {
        return Uint72x2.unwrap(self);
    }

    /// @dev Cast a Uint72x2 into a uint144
    function asUint144(Uint72x2 self) internal pure returns (uint144) {
        return uint144(Uint72x2.unwrap(self));
    }

    function at(Uint72x2 self, uint8 pos) internal pure returns (uint72) {
        if (pos > 1) revert OutOfBoundAccessUint72x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint72x2 self, uint8 pos) internal pure returns (uint72) {
        unchecked {
            return uint72(bytes9(_extractLeftmostBits(bytes32(Uint72x2.unwrap(self)), 72 * pos, 72)));
        }
    }

    /// @dev Pack 2 uint72 into a Uint72x2
    function pack(uint72 arg0, uint72 arg1) internal pure returns (Uint72x2 result) {
        assembly {
            result := shr(184, arg0)
            result := or(result, shr(112, arg1))
        }
    }

    /// @dev Split a Uint72x2 into 2 uint72
    function split(Uint72x2 self) internal pure returns (uint72, uint72) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint48x3 is bytes18;

    error OutOfBoundAccessUint48x3(uint8);

    /// @dev Cast a bytes18 into a Uint48x3
    function asUint48x3(bytes18 self) internal pure returns (Uint48x3) {
        return Uint48x3.wrap(self);
    }

    /// @dev Cast a uint144 into a Uint48x3
    function asUint48x3(uint144 self) internal pure returns (Uint48x3) {
        return Uint48x3.wrap(bytes18(self));
    }

    /// @dev Cast a Uint48x3 into a bytes18
    function asBytes18(Uint48x3 self) internal pure returns (bytes18) {
        return Uint48x3.unwrap(self);
    }

    /// @dev Cast a Uint48x3 into a uint144
    function asUint144(Uint48x3 self) internal pure returns (uint144) {
        return uint144(Uint48x3.unwrap(self));
    }

    function at(Uint48x3 self, uint8 pos) internal pure returns (uint48) {
        if (pos > 2) revert OutOfBoundAccessUint48x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint48x3 self, uint8 pos) internal pure returns (uint48) {
        unchecked {
            return uint48(bytes6(_extractLeftmostBits(bytes32(Uint48x3.unwrap(self)), 48 * pos, 48)));
        }
    }

    /// @dev Pack 3 uint48 into a Uint48x3
    function pack(uint48 arg0, uint48 arg1, uint48 arg2) internal pure returns (Uint48x3 result) {
        assembly {
            result := shr(208, arg0)
            result := or(result, shr(160, arg1))
            result := or(result, shr(112, arg2))
        }
    }

    /// @dev Split a Uint48x3 into 3 uint48
    function split(Uint48x3 self) internal pure returns (uint48, uint48, uint48) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint24x6 is bytes18;

    error OutOfBoundAccessUint24x6(uint8);

    /// @dev Cast a bytes18 into a Uint24x6
    function asUint24x6(bytes18 self) internal pure returns (Uint24x6) {
        return Uint24x6.wrap(self);
    }

    /// @dev Cast a uint144 into a Uint24x6
    function asUint24x6(uint144 self) internal pure returns (Uint24x6) {
        return Uint24x6.wrap(bytes18(self));
    }

    /// @dev Cast a Uint24x6 into a bytes18
    function asBytes18(Uint24x6 self) internal pure returns (bytes18) {
        return Uint24x6.unwrap(self);
    }

    /// @dev Cast a Uint24x6 into a uint144
    function asUint144(Uint24x6 self) internal pure returns (uint144) {
        return uint144(Uint24x6.unwrap(self));
    }

    function at(Uint24x6 self, uint8 pos) internal pure returns (uint24) {
        if (pos > 5) revert OutOfBoundAccessUint24x6(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint24x6 self, uint8 pos) internal pure returns (uint24) {
        unchecked {
            return uint24(bytes3(_extractLeftmostBits(bytes32(Uint24x6.unwrap(self)), 24 * pos, 24)));
        }
    }

    /// @dev Pack 6 uint24 into a Uint24x6
    function pack(
        uint24 arg0,
        uint24 arg1,
        uint24 arg2,
        uint24 arg3,
        uint24 arg4,
        uint24 arg5
    ) internal pure returns (Uint24x6 result) {
        assembly {
            result := shr(232, arg0)
            result := or(result, shr(208, arg1))
            result := or(result, shr(184, arg2))
            result := or(result, shr(160, arg3))
            result := or(result, shr(136, arg4))
            result := or(result, shr(112, arg5))
        }
    }

    /// @dev Split a Uint24x6 into 6 uint24
    function split(Uint24x6 self) internal pure returns (uint24, uint24, uint24, uint24, uint24, uint24) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5)
        );
    }

    type Uint16x9 is bytes18;

    error OutOfBoundAccessUint16x9(uint8);

    /// @dev Cast a bytes18 into a Uint16x9
    function asUint16x9(bytes18 self) internal pure returns (Uint16x9) {
        return Uint16x9.wrap(self);
    }

    /// @dev Cast a uint144 into a Uint16x9
    function asUint16x9(uint144 self) internal pure returns (Uint16x9) {
        return Uint16x9.wrap(bytes18(self));
    }

    /// @dev Cast a Uint16x9 into a bytes18
    function asBytes18(Uint16x9 self) internal pure returns (bytes18) {
        return Uint16x9.unwrap(self);
    }

    /// @dev Cast a Uint16x9 into a uint144
    function asUint144(Uint16x9 self) internal pure returns (uint144) {
        return uint144(Uint16x9.unwrap(self));
    }

    function at(Uint16x9 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 8) revert OutOfBoundAccessUint16x9(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x9 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x9.unwrap(self)), 16 * pos, 16)));
        }
    }

    type Uint8x18 is bytes18;

    error OutOfBoundAccessUint8x18(uint8);

    /// @dev Cast a bytes18 into a Uint8x18
    function asUint8x18(bytes18 self) internal pure returns (Uint8x18) {
        return Uint8x18.wrap(self);
    }

    /// @dev Cast a uint144 into a Uint8x18
    function asUint8x18(uint144 self) internal pure returns (Uint8x18) {
        return Uint8x18.wrap(bytes18(self));
    }

    /// @dev Cast a Uint8x18 into a bytes18
    function asBytes18(Uint8x18 self) internal pure returns (bytes18) {
        return Uint8x18.unwrap(self);
    }

    /// @dev Cast a Uint8x18 into a uint144
    function asUint144(Uint8x18 self) internal pure returns (uint144) {
        return uint144(Uint8x18.unwrap(self));
    }

    function at(Uint8x18 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 17) revert OutOfBoundAccessUint8x18(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x18 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x18.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint8x17 is bytes17;

    error OutOfBoundAccessUint8x17(uint8);

    /// @dev Cast a bytes17 into a Uint8x17
    function asUint8x17(bytes17 self) internal pure returns (Uint8x17) {
        return Uint8x17.wrap(self);
    }

    /// @dev Cast a uint136 into a Uint8x17
    function asUint8x17(uint136 self) internal pure returns (Uint8x17) {
        return Uint8x17.wrap(bytes17(self));
    }

    /// @dev Cast a Uint8x17 into a bytes17
    function asBytes17(Uint8x17 self) internal pure returns (bytes17) {
        return Uint8x17.unwrap(self);
    }

    /// @dev Cast a Uint8x17 into a uint136
    function asUint136(Uint8x17 self) internal pure returns (uint136) {
        return uint136(Uint8x17.unwrap(self));
    }

    function at(Uint8x17 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 16) revert OutOfBoundAccessUint8x17(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x17 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x17.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint64x2 is bytes16;

    error OutOfBoundAccessUint64x2(uint8);

    /// @dev Cast a bytes16 into a Uint64x2
    function asUint64x2(bytes16 self) internal pure returns (Uint64x2) {
        return Uint64x2.wrap(self);
    }

    /// @dev Cast a uint128 into a Uint64x2
    function asUint64x2(uint128 self) internal pure returns (Uint64x2) {
        return Uint64x2.wrap(bytes16(self));
    }

    /// @dev Cast a Uint64x2 into a bytes16
    function asBytes16(Uint64x2 self) internal pure returns (bytes16) {
        return Uint64x2.unwrap(self);
    }

    /// @dev Cast a Uint64x2 into a uint128
    function asUint128(Uint64x2 self) internal pure returns (uint128) {
        return uint128(Uint64x2.unwrap(self));
    }

    function at(Uint64x2 self, uint8 pos) internal pure returns (uint64) {
        if (pos > 1) revert OutOfBoundAccessUint64x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint64x2 self, uint8 pos) internal pure returns (uint64) {
        unchecked {
            return uint64(bytes8(_extractLeftmostBits(bytes32(Uint64x2.unwrap(self)), 64 * pos, 64)));
        }
    }

    /// @dev Pack 2 uint64 into a Uint64x2
    function pack(uint64 arg0, uint64 arg1) internal pure returns (Uint64x2 result) {
        assembly {
            result := shr(192, arg0)
            result := or(result, shr(128, arg1))
        }
    }

    /// @dev Split a Uint64x2 into 2 uint64
    function split(Uint64x2 self) internal pure returns (uint64, uint64) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint32x4 is bytes16;

    error OutOfBoundAccessUint32x4(uint8);

    /// @dev Cast a bytes16 into a Uint32x4
    function asUint32x4(bytes16 self) internal pure returns (Uint32x4) {
        return Uint32x4.wrap(self);
    }

    /// @dev Cast a uint128 into a Uint32x4
    function asUint32x4(uint128 self) internal pure returns (Uint32x4) {
        return Uint32x4.wrap(bytes16(self));
    }

    /// @dev Cast a Uint32x4 into a bytes16
    function asBytes16(Uint32x4 self) internal pure returns (bytes16) {
        return Uint32x4.unwrap(self);
    }

    /// @dev Cast a Uint32x4 into a uint128
    function asUint128(Uint32x4 self) internal pure returns (uint128) {
        return uint128(Uint32x4.unwrap(self));
    }

    function at(Uint32x4 self, uint8 pos) internal pure returns (uint32) {
        if (pos > 3) revert OutOfBoundAccessUint32x4(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint32x4 self, uint8 pos) internal pure returns (uint32) {
        unchecked {
            return uint32(bytes4(_extractLeftmostBits(bytes32(Uint32x4.unwrap(self)), 32 * pos, 32)));
        }
    }

    /// @dev Pack 4 uint32 into a Uint32x4
    function pack(uint32 arg0, uint32 arg1, uint32 arg2, uint32 arg3) internal pure returns (Uint32x4 result) {
        assembly {
            result := shr(224, arg0)
            result := or(result, shr(192, arg1))
            result := or(result, shr(160, arg2))
            result := or(result, shr(128, arg3))
        }
    }

    /// @dev Split a Uint32x4 into 4 uint32
    function split(Uint32x4 self) internal pure returns (uint32, uint32, uint32, uint32) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3));
    }

    type Uint16x8 is bytes16;

    error OutOfBoundAccessUint16x8(uint8);

    /// @dev Cast a bytes16 into a Uint16x8
    function asUint16x8(bytes16 self) internal pure returns (Uint16x8) {
        return Uint16x8.wrap(self);
    }

    /// @dev Cast a uint128 into a Uint16x8
    function asUint16x8(uint128 self) internal pure returns (Uint16x8) {
        return Uint16x8.wrap(bytes16(self));
    }

    /// @dev Cast a Uint16x8 into a bytes16
    function asBytes16(Uint16x8 self) internal pure returns (bytes16) {
        return Uint16x8.unwrap(self);
    }

    /// @dev Cast a Uint16x8 into a uint128
    function asUint128(Uint16x8 self) internal pure returns (uint128) {
        return uint128(Uint16x8.unwrap(self));
    }

    function at(Uint16x8 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 7) revert OutOfBoundAccessUint16x8(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x8 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x8.unwrap(self)), 16 * pos, 16)));
        }
    }

    /// @dev Pack 8 uint16 into a Uint16x8
    function pack(
        uint16 arg0,
        uint16 arg1,
        uint16 arg2,
        uint16 arg3,
        uint16 arg4,
        uint16 arg5,
        uint16 arg6,
        uint16 arg7
    ) internal pure returns (Uint16x8 result) {
        assembly {
            result := shr(240, arg0)
            result := or(result, shr(224, arg1))
            result := or(result, shr(208, arg2))
            result := or(result, shr(192, arg3))
            result := or(result, shr(176, arg4))
            result := or(result, shr(160, arg5))
            result := or(result, shr(144, arg6))
            result := or(result, shr(128, arg7))
        }
    }

    /// @dev Split a Uint16x8 into 8 uint16
    function split(
        Uint16x8 self
    ) internal pure returns (uint16, uint16, uint16, uint16, uint16, uint16, uint16, uint16) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5),
            unsafeAt(self, 6),
            unsafeAt(self, 7)
        );
    }

    type Uint8x16 is bytes16;

    error OutOfBoundAccessUint8x16(uint8);

    /// @dev Cast a bytes16 into a Uint8x16
    function asUint8x16(bytes16 self) internal pure returns (Uint8x16) {
        return Uint8x16.wrap(self);
    }

    /// @dev Cast a uint128 into a Uint8x16
    function asUint8x16(uint128 self) internal pure returns (Uint8x16) {
        return Uint8x16.wrap(bytes16(self));
    }

    /// @dev Cast a Uint8x16 into a bytes16
    function asBytes16(Uint8x16 self) internal pure returns (bytes16) {
        return Uint8x16.unwrap(self);
    }

    /// @dev Cast a Uint8x16 into a uint128
    function asUint128(Uint8x16 self) internal pure returns (uint128) {
        return uint128(Uint8x16.unwrap(self));
    }

    function at(Uint8x16 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 15) revert OutOfBoundAccessUint8x16(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x16 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x16.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint40x3 is bytes15;

    error OutOfBoundAccessUint40x3(uint8);

    /// @dev Cast a bytes15 into a Uint40x3
    function asUint40x3(bytes15 self) internal pure returns (Uint40x3) {
        return Uint40x3.wrap(self);
    }

    /// @dev Cast a uint120 into a Uint40x3
    function asUint40x3(uint120 self) internal pure returns (Uint40x3) {
        return Uint40x3.wrap(bytes15(self));
    }

    /// @dev Cast a Uint40x3 into a bytes15
    function asBytes15(Uint40x3 self) internal pure returns (bytes15) {
        return Uint40x3.unwrap(self);
    }

    /// @dev Cast a Uint40x3 into a uint120
    function asUint120(Uint40x3 self) internal pure returns (uint120) {
        return uint120(Uint40x3.unwrap(self));
    }

    function at(Uint40x3 self, uint8 pos) internal pure returns (uint40) {
        if (pos > 2) revert OutOfBoundAccessUint40x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint40x3 self, uint8 pos) internal pure returns (uint40) {
        unchecked {
            return uint40(bytes5(_extractLeftmostBits(bytes32(Uint40x3.unwrap(self)), 40 * pos, 40)));
        }
    }

    /// @dev Pack 3 uint40 into a Uint40x3
    function pack(uint40 arg0, uint40 arg1, uint40 arg2) internal pure returns (Uint40x3 result) {
        assembly {
            result := shr(216, arg0)
            result := or(result, shr(176, arg1))
            result := or(result, shr(136, arg2))
        }
    }

    /// @dev Split a Uint40x3 into 3 uint40
    function split(Uint40x3 self) internal pure returns (uint40, uint40, uint40) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint24x5 is bytes15;

    error OutOfBoundAccessUint24x5(uint8);

    /// @dev Cast a bytes15 into a Uint24x5
    function asUint24x5(bytes15 self) internal pure returns (Uint24x5) {
        return Uint24x5.wrap(self);
    }

    /// @dev Cast a uint120 into a Uint24x5
    function asUint24x5(uint120 self) internal pure returns (Uint24x5) {
        return Uint24x5.wrap(bytes15(self));
    }

    /// @dev Cast a Uint24x5 into a bytes15
    function asBytes15(Uint24x5 self) internal pure returns (bytes15) {
        return Uint24x5.unwrap(self);
    }

    /// @dev Cast a Uint24x5 into a uint120
    function asUint120(Uint24x5 self) internal pure returns (uint120) {
        return uint120(Uint24x5.unwrap(self));
    }

    function at(Uint24x5 self, uint8 pos) internal pure returns (uint24) {
        if (pos > 4) revert OutOfBoundAccessUint24x5(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint24x5 self, uint8 pos) internal pure returns (uint24) {
        unchecked {
            return uint24(bytes3(_extractLeftmostBits(bytes32(Uint24x5.unwrap(self)), 24 * pos, 24)));
        }
    }

    /// @dev Pack 5 uint24 into a Uint24x5
    function pack(
        uint24 arg0,
        uint24 arg1,
        uint24 arg2,
        uint24 arg3,
        uint24 arg4
    ) internal pure returns (Uint24x5 result) {
        assembly {
            result := shr(232, arg0)
            result := or(result, shr(208, arg1))
            result := or(result, shr(184, arg2))
            result := or(result, shr(160, arg3))
            result := or(result, shr(136, arg4))
        }
    }

    /// @dev Split a Uint24x5 into 5 uint24
    function split(Uint24x5 self) internal pure returns (uint24, uint24, uint24, uint24, uint24) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3), unsafeAt(self, 4));
    }

    type Uint8x15 is bytes15;

    error OutOfBoundAccessUint8x15(uint8);

    /// @dev Cast a bytes15 into a Uint8x15
    function asUint8x15(bytes15 self) internal pure returns (Uint8x15) {
        return Uint8x15.wrap(self);
    }

    /// @dev Cast a uint120 into a Uint8x15
    function asUint8x15(uint120 self) internal pure returns (Uint8x15) {
        return Uint8x15.wrap(bytes15(self));
    }

    /// @dev Cast a Uint8x15 into a bytes15
    function asBytes15(Uint8x15 self) internal pure returns (bytes15) {
        return Uint8x15.unwrap(self);
    }

    /// @dev Cast a Uint8x15 into a uint120
    function asUint120(Uint8x15 self) internal pure returns (uint120) {
        return uint120(Uint8x15.unwrap(self));
    }

    function at(Uint8x15 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 14) revert OutOfBoundAccessUint8x15(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x15 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x15.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint56x2 is bytes14;

    error OutOfBoundAccessUint56x2(uint8);

    /// @dev Cast a bytes14 into a Uint56x2
    function asUint56x2(bytes14 self) internal pure returns (Uint56x2) {
        return Uint56x2.wrap(self);
    }

    /// @dev Cast a uint112 into a Uint56x2
    function asUint56x2(uint112 self) internal pure returns (Uint56x2) {
        return Uint56x2.wrap(bytes14(self));
    }

    /// @dev Cast a Uint56x2 into a bytes14
    function asBytes14(Uint56x2 self) internal pure returns (bytes14) {
        return Uint56x2.unwrap(self);
    }

    /// @dev Cast a Uint56x2 into a uint112
    function asUint112(Uint56x2 self) internal pure returns (uint112) {
        return uint112(Uint56x2.unwrap(self));
    }

    function at(Uint56x2 self, uint8 pos) internal pure returns (uint56) {
        if (pos > 1) revert OutOfBoundAccessUint56x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint56x2 self, uint8 pos) internal pure returns (uint56) {
        unchecked {
            return uint56(bytes7(_extractLeftmostBits(bytes32(Uint56x2.unwrap(self)), 56 * pos, 56)));
        }
    }

    /// @dev Pack 2 uint56 into a Uint56x2
    function pack(uint56 arg0, uint56 arg1) internal pure returns (Uint56x2 result) {
        assembly {
            result := shr(200, arg0)
            result := or(result, shr(144, arg1))
        }
    }

    /// @dev Split a Uint56x2 into 2 uint56
    function split(Uint56x2 self) internal pure returns (uint56, uint56) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint16x7 is bytes14;

    error OutOfBoundAccessUint16x7(uint8);

    /// @dev Cast a bytes14 into a Uint16x7
    function asUint16x7(bytes14 self) internal pure returns (Uint16x7) {
        return Uint16x7.wrap(self);
    }

    /// @dev Cast a uint112 into a Uint16x7
    function asUint16x7(uint112 self) internal pure returns (Uint16x7) {
        return Uint16x7.wrap(bytes14(self));
    }

    /// @dev Cast a Uint16x7 into a bytes14
    function asBytes14(Uint16x7 self) internal pure returns (bytes14) {
        return Uint16x7.unwrap(self);
    }

    /// @dev Cast a Uint16x7 into a uint112
    function asUint112(Uint16x7 self) internal pure returns (uint112) {
        return uint112(Uint16x7.unwrap(self));
    }

    function at(Uint16x7 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 6) revert OutOfBoundAccessUint16x7(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x7 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x7.unwrap(self)), 16 * pos, 16)));
        }
    }

    /// @dev Pack 7 uint16 into a Uint16x7
    function pack(
        uint16 arg0,
        uint16 arg1,
        uint16 arg2,
        uint16 arg3,
        uint16 arg4,
        uint16 arg5,
        uint16 arg6
    ) internal pure returns (Uint16x7 result) {
        assembly {
            result := shr(240, arg0)
            result := or(result, shr(224, arg1))
            result := or(result, shr(208, arg2))
            result := or(result, shr(192, arg3))
            result := or(result, shr(176, arg4))
            result := or(result, shr(160, arg5))
            result := or(result, shr(144, arg6))
        }
    }

    /// @dev Split a Uint16x7 into 7 uint16
    function split(Uint16x7 self) internal pure returns (uint16, uint16, uint16, uint16, uint16, uint16, uint16) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5),
            unsafeAt(self, 6)
        );
    }

    type Uint8x14 is bytes14;

    error OutOfBoundAccessUint8x14(uint8);

    /// @dev Cast a bytes14 into a Uint8x14
    function asUint8x14(bytes14 self) internal pure returns (Uint8x14) {
        return Uint8x14.wrap(self);
    }

    /// @dev Cast a uint112 into a Uint8x14
    function asUint8x14(uint112 self) internal pure returns (Uint8x14) {
        return Uint8x14.wrap(bytes14(self));
    }

    /// @dev Cast a Uint8x14 into a bytes14
    function asBytes14(Uint8x14 self) internal pure returns (bytes14) {
        return Uint8x14.unwrap(self);
    }

    /// @dev Cast a Uint8x14 into a uint112
    function asUint112(Uint8x14 self) internal pure returns (uint112) {
        return uint112(Uint8x14.unwrap(self));
    }

    function at(Uint8x14 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 13) revert OutOfBoundAccessUint8x14(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x14 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x14.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint8x13 is bytes13;

    error OutOfBoundAccessUint8x13(uint8);

    /// @dev Cast a bytes13 into a Uint8x13
    function asUint8x13(bytes13 self) internal pure returns (Uint8x13) {
        return Uint8x13.wrap(self);
    }

    /// @dev Cast a uint104 into a Uint8x13
    function asUint8x13(uint104 self) internal pure returns (Uint8x13) {
        return Uint8x13.wrap(bytes13(self));
    }

    /// @dev Cast a Uint8x13 into a bytes13
    function asBytes13(Uint8x13 self) internal pure returns (bytes13) {
        return Uint8x13.unwrap(self);
    }

    /// @dev Cast a Uint8x13 into a uint104
    function asUint104(Uint8x13 self) internal pure returns (uint104) {
        return uint104(Uint8x13.unwrap(self));
    }

    function at(Uint8x13 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 12) revert OutOfBoundAccessUint8x13(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x13 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x13.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint48x2 is bytes12;

    error OutOfBoundAccessUint48x2(uint8);

    /// @dev Cast a bytes12 into a Uint48x2
    function asUint48x2(bytes12 self) internal pure returns (Uint48x2) {
        return Uint48x2.wrap(self);
    }

    /// @dev Cast a uint96 into a Uint48x2
    function asUint48x2(uint96 self) internal pure returns (Uint48x2) {
        return Uint48x2.wrap(bytes12(self));
    }

    /// @dev Cast a Uint48x2 into a bytes12
    function asBytes12(Uint48x2 self) internal pure returns (bytes12) {
        return Uint48x2.unwrap(self);
    }

    /// @dev Cast a Uint48x2 into a uint96
    function asUint96(Uint48x2 self) internal pure returns (uint96) {
        return uint96(Uint48x2.unwrap(self));
    }

    function at(Uint48x2 self, uint8 pos) internal pure returns (uint48) {
        if (pos > 1) revert OutOfBoundAccessUint48x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint48x2 self, uint8 pos) internal pure returns (uint48) {
        unchecked {
            return uint48(bytes6(_extractLeftmostBits(bytes32(Uint48x2.unwrap(self)), 48 * pos, 48)));
        }
    }

    /// @dev Pack 2 uint48 into a Uint48x2
    function pack(uint48 arg0, uint48 arg1) internal pure returns (Uint48x2 result) {
        assembly {
            result := shr(208, arg0)
            result := or(result, shr(160, arg1))
        }
    }

    /// @dev Split a Uint48x2 into 2 uint48
    function split(Uint48x2 self) internal pure returns (uint48, uint48) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint32x3 is bytes12;

    error OutOfBoundAccessUint32x3(uint8);

    /// @dev Cast a bytes12 into a Uint32x3
    function asUint32x3(bytes12 self) internal pure returns (Uint32x3) {
        return Uint32x3.wrap(self);
    }

    /// @dev Cast a uint96 into a Uint32x3
    function asUint32x3(uint96 self) internal pure returns (Uint32x3) {
        return Uint32x3.wrap(bytes12(self));
    }

    /// @dev Cast a Uint32x3 into a bytes12
    function asBytes12(Uint32x3 self) internal pure returns (bytes12) {
        return Uint32x3.unwrap(self);
    }

    /// @dev Cast a Uint32x3 into a uint96
    function asUint96(Uint32x3 self) internal pure returns (uint96) {
        return uint96(Uint32x3.unwrap(self));
    }

    function at(Uint32x3 self, uint8 pos) internal pure returns (uint32) {
        if (pos > 2) revert OutOfBoundAccessUint32x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint32x3 self, uint8 pos) internal pure returns (uint32) {
        unchecked {
            return uint32(bytes4(_extractLeftmostBits(bytes32(Uint32x3.unwrap(self)), 32 * pos, 32)));
        }
    }

    /// @dev Pack 3 uint32 into a Uint32x3
    function pack(uint32 arg0, uint32 arg1, uint32 arg2) internal pure returns (Uint32x3 result) {
        assembly {
            result := shr(224, arg0)
            result := or(result, shr(192, arg1))
            result := or(result, shr(160, arg2))
        }
    }

    /// @dev Split a Uint32x3 into 3 uint32
    function split(Uint32x3 self) internal pure returns (uint32, uint32, uint32) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint24x4 is bytes12;

    error OutOfBoundAccessUint24x4(uint8);

    /// @dev Cast a bytes12 into a Uint24x4
    function asUint24x4(bytes12 self) internal pure returns (Uint24x4) {
        return Uint24x4.wrap(self);
    }

    /// @dev Cast a uint96 into a Uint24x4
    function asUint24x4(uint96 self) internal pure returns (Uint24x4) {
        return Uint24x4.wrap(bytes12(self));
    }

    /// @dev Cast a Uint24x4 into a bytes12
    function asBytes12(Uint24x4 self) internal pure returns (bytes12) {
        return Uint24x4.unwrap(self);
    }

    /// @dev Cast a Uint24x4 into a uint96
    function asUint96(Uint24x4 self) internal pure returns (uint96) {
        return uint96(Uint24x4.unwrap(self));
    }

    function at(Uint24x4 self, uint8 pos) internal pure returns (uint24) {
        if (pos > 3) revert OutOfBoundAccessUint24x4(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint24x4 self, uint8 pos) internal pure returns (uint24) {
        unchecked {
            return uint24(bytes3(_extractLeftmostBits(bytes32(Uint24x4.unwrap(self)), 24 * pos, 24)));
        }
    }

    /// @dev Pack 4 uint24 into a Uint24x4
    function pack(uint24 arg0, uint24 arg1, uint24 arg2, uint24 arg3) internal pure returns (Uint24x4 result) {
        assembly {
            result := shr(232, arg0)
            result := or(result, shr(208, arg1))
            result := or(result, shr(184, arg2))
            result := or(result, shr(160, arg3))
        }
    }

    /// @dev Split a Uint24x4 into 4 uint24
    function split(Uint24x4 self) internal pure returns (uint24, uint24, uint24, uint24) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3));
    }

    type Uint16x6 is bytes12;

    error OutOfBoundAccessUint16x6(uint8);

    /// @dev Cast a bytes12 into a Uint16x6
    function asUint16x6(bytes12 self) internal pure returns (Uint16x6) {
        return Uint16x6.wrap(self);
    }

    /// @dev Cast a uint96 into a Uint16x6
    function asUint16x6(uint96 self) internal pure returns (Uint16x6) {
        return Uint16x6.wrap(bytes12(self));
    }

    /// @dev Cast a Uint16x6 into a bytes12
    function asBytes12(Uint16x6 self) internal pure returns (bytes12) {
        return Uint16x6.unwrap(self);
    }

    /// @dev Cast a Uint16x6 into a uint96
    function asUint96(Uint16x6 self) internal pure returns (uint96) {
        return uint96(Uint16x6.unwrap(self));
    }

    function at(Uint16x6 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 5) revert OutOfBoundAccessUint16x6(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x6 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x6.unwrap(self)), 16 * pos, 16)));
        }
    }

    /// @dev Pack 6 uint16 into a Uint16x6
    function pack(
        uint16 arg0,
        uint16 arg1,
        uint16 arg2,
        uint16 arg3,
        uint16 arg4,
        uint16 arg5
    ) internal pure returns (Uint16x6 result) {
        assembly {
            result := shr(240, arg0)
            result := or(result, shr(224, arg1))
            result := or(result, shr(208, arg2))
            result := or(result, shr(192, arg3))
            result := or(result, shr(176, arg4))
            result := or(result, shr(160, arg5))
        }
    }

    /// @dev Split a Uint16x6 into 6 uint16
    function split(Uint16x6 self) internal pure returns (uint16, uint16, uint16, uint16, uint16, uint16) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5)
        );
    }

    type Uint8x12 is bytes12;

    error OutOfBoundAccessUint8x12(uint8);

    /// @dev Cast a bytes12 into a Uint8x12
    function asUint8x12(bytes12 self) internal pure returns (Uint8x12) {
        return Uint8x12.wrap(self);
    }

    /// @dev Cast a uint96 into a Uint8x12
    function asUint8x12(uint96 self) internal pure returns (Uint8x12) {
        return Uint8x12.wrap(bytes12(self));
    }

    /// @dev Cast a Uint8x12 into a bytes12
    function asBytes12(Uint8x12 self) internal pure returns (bytes12) {
        return Uint8x12.unwrap(self);
    }

    /// @dev Cast a Uint8x12 into a uint96
    function asUint96(Uint8x12 self) internal pure returns (uint96) {
        return uint96(Uint8x12.unwrap(self));
    }

    function at(Uint8x12 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 11) revert OutOfBoundAccessUint8x12(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x12 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x12.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint8x11 is bytes11;

    error OutOfBoundAccessUint8x11(uint8);

    /// @dev Cast a bytes11 into a Uint8x11
    function asUint8x11(bytes11 self) internal pure returns (Uint8x11) {
        return Uint8x11.wrap(self);
    }

    /// @dev Cast a uint88 into a Uint8x11
    function asUint8x11(uint88 self) internal pure returns (Uint8x11) {
        return Uint8x11.wrap(bytes11(self));
    }

    /// @dev Cast a Uint8x11 into a bytes11
    function asBytes11(Uint8x11 self) internal pure returns (bytes11) {
        return Uint8x11.unwrap(self);
    }

    /// @dev Cast a Uint8x11 into a uint88
    function asUint88(Uint8x11 self) internal pure returns (uint88) {
        return uint88(Uint8x11.unwrap(self));
    }

    function at(Uint8x11 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 10) revert OutOfBoundAccessUint8x11(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x11 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x11.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint40x2 is bytes10;

    error OutOfBoundAccessUint40x2(uint8);

    /// @dev Cast a bytes10 into a Uint40x2
    function asUint40x2(bytes10 self) internal pure returns (Uint40x2) {
        return Uint40x2.wrap(self);
    }

    /// @dev Cast a uint80 into a Uint40x2
    function asUint40x2(uint80 self) internal pure returns (Uint40x2) {
        return Uint40x2.wrap(bytes10(self));
    }

    /// @dev Cast a Uint40x2 into a bytes10
    function asBytes10(Uint40x2 self) internal pure returns (bytes10) {
        return Uint40x2.unwrap(self);
    }

    /// @dev Cast a Uint40x2 into a uint80
    function asUint80(Uint40x2 self) internal pure returns (uint80) {
        return uint80(Uint40x2.unwrap(self));
    }

    function at(Uint40x2 self, uint8 pos) internal pure returns (uint40) {
        if (pos > 1) revert OutOfBoundAccessUint40x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint40x2 self, uint8 pos) internal pure returns (uint40) {
        unchecked {
            return uint40(bytes5(_extractLeftmostBits(bytes32(Uint40x2.unwrap(self)), 40 * pos, 40)));
        }
    }

    /// @dev Pack 2 uint40 into a Uint40x2
    function pack(uint40 arg0, uint40 arg1) internal pure returns (Uint40x2 result) {
        assembly {
            result := shr(216, arg0)
            result := or(result, shr(176, arg1))
        }
    }

    /// @dev Split a Uint40x2 into 2 uint40
    function split(Uint40x2 self) internal pure returns (uint40, uint40) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint16x5 is bytes10;

    error OutOfBoundAccessUint16x5(uint8);

    /// @dev Cast a bytes10 into a Uint16x5
    function asUint16x5(bytes10 self) internal pure returns (Uint16x5) {
        return Uint16x5.wrap(self);
    }

    /// @dev Cast a uint80 into a Uint16x5
    function asUint16x5(uint80 self) internal pure returns (Uint16x5) {
        return Uint16x5.wrap(bytes10(self));
    }

    /// @dev Cast a Uint16x5 into a bytes10
    function asBytes10(Uint16x5 self) internal pure returns (bytes10) {
        return Uint16x5.unwrap(self);
    }

    /// @dev Cast a Uint16x5 into a uint80
    function asUint80(Uint16x5 self) internal pure returns (uint80) {
        return uint80(Uint16x5.unwrap(self));
    }

    function at(Uint16x5 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 4) revert OutOfBoundAccessUint16x5(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x5 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x5.unwrap(self)), 16 * pos, 16)));
        }
    }

    /// @dev Pack 5 uint16 into a Uint16x5
    function pack(
        uint16 arg0,
        uint16 arg1,
        uint16 arg2,
        uint16 arg3,
        uint16 arg4
    ) internal pure returns (Uint16x5 result) {
        assembly {
            result := shr(240, arg0)
            result := or(result, shr(224, arg1))
            result := or(result, shr(208, arg2))
            result := or(result, shr(192, arg3))
            result := or(result, shr(176, arg4))
        }
    }

    /// @dev Split a Uint16x5 into 5 uint16
    function split(Uint16x5 self) internal pure returns (uint16, uint16, uint16, uint16, uint16) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3), unsafeAt(self, 4));
    }

    type Uint8x10 is bytes10;

    error OutOfBoundAccessUint8x10(uint8);

    /// @dev Cast a bytes10 into a Uint8x10
    function asUint8x10(bytes10 self) internal pure returns (Uint8x10) {
        return Uint8x10.wrap(self);
    }

    /// @dev Cast a uint80 into a Uint8x10
    function asUint8x10(uint80 self) internal pure returns (Uint8x10) {
        return Uint8x10.wrap(bytes10(self));
    }

    /// @dev Cast a Uint8x10 into a bytes10
    function asBytes10(Uint8x10 self) internal pure returns (bytes10) {
        return Uint8x10.unwrap(self);
    }

    /// @dev Cast a Uint8x10 into a uint80
    function asUint80(Uint8x10 self) internal pure returns (uint80) {
        return uint80(Uint8x10.unwrap(self));
    }

    function at(Uint8x10 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 9) revert OutOfBoundAccessUint8x10(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x10 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x10.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint24x3 is bytes9;

    error OutOfBoundAccessUint24x3(uint8);

    /// @dev Cast a bytes9 into a Uint24x3
    function asUint24x3(bytes9 self) internal pure returns (Uint24x3) {
        return Uint24x3.wrap(self);
    }

    /// @dev Cast a uint72 into a Uint24x3
    function asUint24x3(uint72 self) internal pure returns (Uint24x3) {
        return Uint24x3.wrap(bytes9(self));
    }

    /// @dev Cast a Uint24x3 into a bytes9
    function asBytes9(Uint24x3 self) internal pure returns (bytes9) {
        return Uint24x3.unwrap(self);
    }

    /// @dev Cast a Uint24x3 into a uint72
    function asUint72(Uint24x3 self) internal pure returns (uint72) {
        return uint72(Uint24x3.unwrap(self));
    }

    function at(Uint24x3 self, uint8 pos) internal pure returns (uint24) {
        if (pos > 2) revert OutOfBoundAccessUint24x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint24x3 self, uint8 pos) internal pure returns (uint24) {
        unchecked {
            return uint24(bytes3(_extractLeftmostBits(bytes32(Uint24x3.unwrap(self)), 24 * pos, 24)));
        }
    }

    /// @dev Pack 3 uint24 into a Uint24x3
    function pack(uint24 arg0, uint24 arg1, uint24 arg2) internal pure returns (Uint24x3 result) {
        assembly {
            result := shr(232, arg0)
            result := or(result, shr(208, arg1))
            result := or(result, shr(184, arg2))
        }
    }

    /// @dev Split a Uint24x3 into 3 uint24
    function split(Uint24x3 self) internal pure returns (uint24, uint24, uint24) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint8x9 is bytes9;

    error OutOfBoundAccessUint8x9(uint8);

    /// @dev Cast a bytes9 into a Uint8x9
    function asUint8x9(bytes9 self) internal pure returns (Uint8x9) {
        return Uint8x9.wrap(self);
    }

    /// @dev Cast a uint72 into a Uint8x9
    function asUint8x9(uint72 self) internal pure returns (Uint8x9) {
        return Uint8x9.wrap(bytes9(self));
    }

    /// @dev Cast a Uint8x9 into a bytes9
    function asBytes9(Uint8x9 self) internal pure returns (bytes9) {
        return Uint8x9.unwrap(self);
    }

    /// @dev Cast a Uint8x9 into a uint72
    function asUint72(Uint8x9 self) internal pure returns (uint72) {
        return uint72(Uint8x9.unwrap(self));
    }

    function at(Uint8x9 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 8) revert OutOfBoundAccessUint8x9(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x9 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x9.unwrap(self)), 8 * pos, 8)));
        }
    }

    type Uint32x2 is bytes8;

    error OutOfBoundAccessUint32x2(uint8);

    /// @dev Cast a bytes8 into a Uint32x2
    function asUint32x2(bytes8 self) internal pure returns (Uint32x2) {
        return Uint32x2.wrap(self);
    }

    /// @dev Cast a uint64 into a Uint32x2
    function asUint32x2(uint64 self) internal pure returns (Uint32x2) {
        return Uint32x2.wrap(bytes8(self));
    }

    /// @dev Cast a Uint32x2 into a bytes8
    function asBytes8(Uint32x2 self) internal pure returns (bytes8) {
        return Uint32x2.unwrap(self);
    }

    /// @dev Cast a Uint32x2 into a uint64
    function asUint64(Uint32x2 self) internal pure returns (uint64) {
        return uint64(Uint32x2.unwrap(self));
    }

    function at(Uint32x2 self, uint8 pos) internal pure returns (uint32) {
        if (pos > 1) revert OutOfBoundAccessUint32x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint32x2 self, uint8 pos) internal pure returns (uint32) {
        unchecked {
            return uint32(bytes4(_extractLeftmostBits(bytes32(Uint32x2.unwrap(self)), 32 * pos, 32)));
        }
    }

    /// @dev Pack 2 uint32 into a Uint32x2
    function pack(uint32 arg0, uint32 arg1) internal pure returns (Uint32x2 result) {
        assembly {
            result := shr(224, arg0)
            result := or(result, shr(192, arg1))
        }
    }

    /// @dev Split a Uint32x2 into 2 uint32
    function split(Uint32x2 self) internal pure returns (uint32, uint32) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint16x4 is bytes8;

    error OutOfBoundAccessUint16x4(uint8);

    /// @dev Cast a bytes8 into a Uint16x4
    function asUint16x4(bytes8 self) internal pure returns (Uint16x4) {
        return Uint16x4.wrap(self);
    }

    /// @dev Cast a uint64 into a Uint16x4
    function asUint16x4(uint64 self) internal pure returns (Uint16x4) {
        return Uint16x4.wrap(bytes8(self));
    }

    /// @dev Cast a Uint16x4 into a bytes8
    function asBytes8(Uint16x4 self) internal pure returns (bytes8) {
        return Uint16x4.unwrap(self);
    }

    /// @dev Cast a Uint16x4 into a uint64
    function asUint64(Uint16x4 self) internal pure returns (uint64) {
        return uint64(Uint16x4.unwrap(self));
    }

    function at(Uint16x4 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 3) revert OutOfBoundAccessUint16x4(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x4 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x4.unwrap(self)), 16 * pos, 16)));
        }
    }

    /// @dev Pack 4 uint16 into a Uint16x4
    function pack(uint16 arg0, uint16 arg1, uint16 arg2, uint16 arg3) internal pure returns (Uint16x4 result) {
        assembly {
            result := shr(240, arg0)
            result := or(result, shr(224, arg1))
            result := or(result, shr(208, arg2))
            result := or(result, shr(192, arg3))
        }
    }

    /// @dev Split a Uint16x4 into 4 uint16
    function split(Uint16x4 self) internal pure returns (uint16, uint16, uint16, uint16) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3));
    }

    type Uint8x8 is bytes8;

    error OutOfBoundAccessUint8x8(uint8);

    /// @dev Cast a bytes8 into a Uint8x8
    function asUint8x8(bytes8 self) internal pure returns (Uint8x8) {
        return Uint8x8.wrap(self);
    }

    /// @dev Cast a uint64 into a Uint8x8
    function asUint8x8(uint64 self) internal pure returns (Uint8x8) {
        return Uint8x8.wrap(bytes8(self));
    }

    /// @dev Cast a Uint8x8 into a bytes8
    function asBytes8(Uint8x8 self) internal pure returns (bytes8) {
        return Uint8x8.unwrap(self);
    }

    /// @dev Cast a Uint8x8 into a uint64
    function asUint64(Uint8x8 self) internal pure returns (uint64) {
        return uint64(Uint8x8.unwrap(self));
    }

    function at(Uint8x8 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 7) revert OutOfBoundAccessUint8x8(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x8 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x8.unwrap(self)), 8 * pos, 8)));
        }
    }

    /// @dev Pack 8 uint8 into a Uint8x8
    function pack(
        uint8 arg0,
        uint8 arg1,
        uint8 arg2,
        uint8 arg3,
        uint8 arg4,
        uint8 arg5,
        uint8 arg6,
        uint8 arg7
    ) internal pure returns (Uint8x8 result) {
        assembly {
            result := shr(248, arg0)
            result := or(result, shr(240, arg1))
            result := or(result, shr(232, arg2))
            result := or(result, shr(224, arg3))
            result := or(result, shr(216, arg4))
            result := or(result, shr(208, arg5))
            result := or(result, shr(200, arg6))
            result := or(result, shr(192, arg7))
        }
    }

    /// @dev Split a Uint8x8 into 8 uint8
    function split(Uint8x8 self) internal pure returns (uint8, uint8, uint8, uint8, uint8, uint8, uint8, uint8) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5),
            unsafeAt(self, 6),
            unsafeAt(self, 7)
        );
    }

    type Uint8x7 is bytes7;

    error OutOfBoundAccessUint8x7(uint8);

    /// @dev Cast a bytes7 into a Uint8x7
    function asUint8x7(bytes7 self) internal pure returns (Uint8x7) {
        return Uint8x7.wrap(self);
    }

    /// @dev Cast a uint56 into a Uint8x7
    function asUint8x7(uint56 self) internal pure returns (Uint8x7) {
        return Uint8x7.wrap(bytes7(self));
    }

    /// @dev Cast a Uint8x7 into a bytes7
    function asBytes7(Uint8x7 self) internal pure returns (bytes7) {
        return Uint8x7.unwrap(self);
    }

    /// @dev Cast a Uint8x7 into a uint56
    function asUint56(Uint8x7 self) internal pure returns (uint56) {
        return uint56(Uint8x7.unwrap(self));
    }

    function at(Uint8x7 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 6) revert OutOfBoundAccessUint8x7(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x7 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x7.unwrap(self)), 8 * pos, 8)));
        }
    }

    /// @dev Pack 7 uint8 into a Uint8x7
    function pack(
        uint8 arg0,
        uint8 arg1,
        uint8 arg2,
        uint8 arg3,
        uint8 arg4,
        uint8 arg5,
        uint8 arg6
    ) internal pure returns (Uint8x7 result) {
        assembly {
            result := shr(248, arg0)
            result := or(result, shr(240, arg1))
            result := or(result, shr(232, arg2))
            result := or(result, shr(224, arg3))
            result := or(result, shr(216, arg4))
            result := or(result, shr(208, arg5))
            result := or(result, shr(200, arg6))
        }
    }

    /// @dev Split a Uint8x7 into 7 uint8
    function split(Uint8x7 self) internal pure returns (uint8, uint8, uint8, uint8, uint8, uint8, uint8) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5),
            unsafeAt(self, 6)
        );
    }

    type Uint24x2 is bytes6;

    error OutOfBoundAccessUint24x2(uint8);

    /// @dev Cast a bytes6 into a Uint24x2
    function asUint24x2(bytes6 self) internal pure returns (Uint24x2) {
        return Uint24x2.wrap(self);
    }

    /// @dev Cast a uint48 into a Uint24x2
    function asUint24x2(uint48 self) internal pure returns (Uint24x2) {
        return Uint24x2.wrap(bytes6(self));
    }

    /// @dev Cast a Uint24x2 into a bytes6
    function asBytes6(Uint24x2 self) internal pure returns (bytes6) {
        return Uint24x2.unwrap(self);
    }

    /// @dev Cast a Uint24x2 into a uint48
    function asUint48(Uint24x2 self) internal pure returns (uint48) {
        return uint48(Uint24x2.unwrap(self));
    }

    function at(Uint24x2 self, uint8 pos) internal pure returns (uint24) {
        if (pos > 1) revert OutOfBoundAccessUint24x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint24x2 self, uint8 pos) internal pure returns (uint24) {
        unchecked {
            return uint24(bytes3(_extractLeftmostBits(bytes32(Uint24x2.unwrap(self)), 24 * pos, 24)));
        }
    }

    /// @dev Pack 2 uint24 into a Uint24x2
    function pack(uint24 arg0, uint24 arg1) internal pure returns (Uint24x2 result) {
        assembly {
            result := shr(232, arg0)
            result := or(result, shr(208, arg1))
        }
    }

    /// @dev Split a Uint24x2 into 2 uint24
    function split(Uint24x2 self) internal pure returns (uint24, uint24) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint16x3 is bytes6;

    error OutOfBoundAccessUint16x3(uint8);

    /// @dev Cast a bytes6 into a Uint16x3
    function asUint16x3(bytes6 self) internal pure returns (Uint16x3) {
        return Uint16x3.wrap(self);
    }

    /// @dev Cast a uint48 into a Uint16x3
    function asUint16x3(uint48 self) internal pure returns (Uint16x3) {
        return Uint16x3.wrap(bytes6(self));
    }

    /// @dev Cast a Uint16x3 into a bytes6
    function asBytes6(Uint16x3 self) internal pure returns (bytes6) {
        return Uint16x3.unwrap(self);
    }

    /// @dev Cast a Uint16x3 into a uint48
    function asUint48(Uint16x3 self) internal pure returns (uint48) {
        return uint48(Uint16x3.unwrap(self));
    }

    function at(Uint16x3 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 2) revert OutOfBoundAccessUint16x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x3 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x3.unwrap(self)), 16 * pos, 16)));
        }
    }

    /// @dev Pack 3 uint16 into a Uint16x3
    function pack(uint16 arg0, uint16 arg1, uint16 arg2) internal pure returns (Uint16x3 result) {
        assembly {
            result := shr(240, arg0)
            result := or(result, shr(224, arg1))
            result := or(result, shr(208, arg2))
        }
    }

    /// @dev Split a Uint16x3 into 3 uint16
    function split(Uint16x3 self) internal pure returns (uint16, uint16, uint16) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint8x6 is bytes6;

    error OutOfBoundAccessUint8x6(uint8);

    /// @dev Cast a bytes6 into a Uint8x6
    function asUint8x6(bytes6 self) internal pure returns (Uint8x6) {
        return Uint8x6.wrap(self);
    }

    /// @dev Cast a uint48 into a Uint8x6
    function asUint8x6(uint48 self) internal pure returns (Uint8x6) {
        return Uint8x6.wrap(bytes6(self));
    }

    /// @dev Cast a Uint8x6 into a bytes6
    function asBytes6(Uint8x6 self) internal pure returns (bytes6) {
        return Uint8x6.unwrap(self);
    }

    /// @dev Cast a Uint8x6 into a uint48
    function asUint48(Uint8x6 self) internal pure returns (uint48) {
        return uint48(Uint8x6.unwrap(self));
    }

    function at(Uint8x6 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 5) revert OutOfBoundAccessUint8x6(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x6 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x6.unwrap(self)), 8 * pos, 8)));
        }
    }

    /// @dev Pack 6 uint8 into a Uint8x6
    function pack(
        uint8 arg0,
        uint8 arg1,
        uint8 arg2,
        uint8 arg3,
        uint8 arg4,
        uint8 arg5
    ) internal pure returns (Uint8x6 result) {
        assembly {
            result := shr(248, arg0)
            result := or(result, shr(240, arg1))
            result := or(result, shr(232, arg2))
            result := or(result, shr(224, arg3))
            result := or(result, shr(216, arg4))
            result := or(result, shr(208, arg5))
        }
    }

    /// @dev Split a Uint8x6 into 6 uint8
    function split(Uint8x6 self) internal pure returns (uint8, uint8, uint8, uint8, uint8, uint8) {
        return (
            unsafeAt(self, 0),
            unsafeAt(self, 1),
            unsafeAt(self, 2),
            unsafeAt(self, 3),
            unsafeAt(self, 4),
            unsafeAt(self, 5)
        );
    }

    type Uint8x5 is bytes5;

    error OutOfBoundAccessUint8x5(uint8);

    /// @dev Cast a bytes5 into a Uint8x5
    function asUint8x5(bytes5 self) internal pure returns (Uint8x5) {
        return Uint8x5.wrap(self);
    }

    /// @dev Cast a uint40 into a Uint8x5
    function asUint8x5(uint40 self) internal pure returns (Uint8x5) {
        return Uint8x5.wrap(bytes5(self));
    }

    /// @dev Cast a Uint8x5 into a bytes5
    function asBytes5(Uint8x5 self) internal pure returns (bytes5) {
        return Uint8x5.unwrap(self);
    }

    /// @dev Cast a Uint8x5 into a uint40
    function asUint40(Uint8x5 self) internal pure returns (uint40) {
        return uint40(Uint8x5.unwrap(self));
    }

    function at(Uint8x5 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 4) revert OutOfBoundAccessUint8x5(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x5 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x5.unwrap(self)), 8 * pos, 8)));
        }
    }

    /// @dev Pack 5 uint8 into a Uint8x5
    function pack(uint8 arg0, uint8 arg1, uint8 arg2, uint8 arg3, uint8 arg4) internal pure returns (Uint8x5 result) {
        assembly {
            result := shr(248, arg0)
            result := or(result, shr(240, arg1))
            result := or(result, shr(232, arg2))
            result := or(result, shr(224, arg3))
            result := or(result, shr(216, arg4))
        }
    }

    /// @dev Split a Uint8x5 into 5 uint8
    function split(Uint8x5 self) internal pure returns (uint8, uint8, uint8, uint8, uint8) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3), unsafeAt(self, 4));
    }

    type Uint16x2 is bytes4;

    error OutOfBoundAccessUint16x2(uint8);

    /// @dev Cast a bytes4 into a Uint16x2
    function asUint16x2(bytes4 self) internal pure returns (Uint16x2) {
        return Uint16x2.wrap(self);
    }

    /// @dev Cast a uint32 into a Uint16x2
    function asUint16x2(uint32 self) internal pure returns (Uint16x2) {
        return Uint16x2.wrap(bytes4(self));
    }

    /// @dev Cast a Uint16x2 into a bytes4
    function asBytes4(Uint16x2 self) internal pure returns (bytes4) {
        return Uint16x2.unwrap(self);
    }

    /// @dev Cast a Uint16x2 into a uint32
    function asUint32(Uint16x2 self) internal pure returns (uint32) {
        return uint32(Uint16x2.unwrap(self));
    }

    function at(Uint16x2 self, uint8 pos) internal pure returns (uint16) {
        if (pos > 1) revert OutOfBoundAccessUint16x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint16x2 self, uint8 pos) internal pure returns (uint16) {
        unchecked {
            return uint16(bytes2(_extractLeftmostBits(bytes32(Uint16x2.unwrap(self)), 16 * pos, 16)));
        }
    }

    /// @dev Pack 2 uint16 into a Uint16x2
    function pack(uint16 arg0, uint16 arg1) internal pure returns (Uint16x2 result) {
        assembly {
            result := shr(240, arg0)
            result := or(result, shr(224, arg1))
        }
    }

    /// @dev Split a Uint16x2 into 2 uint16
    function split(Uint16x2 self) internal pure returns (uint16, uint16) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    type Uint8x4 is bytes4;

    error OutOfBoundAccessUint8x4(uint8);

    /// @dev Cast a bytes4 into a Uint8x4
    function asUint8x4(bytes4 self) internal pure returns (Uint8x4) {
        return Uint8x4.wrap(self);
    }

    /// @dev Cast a uint32 into a Uint8x4
    function asUint8x4(uint32 self) internal pure returns (Uint8x4) {
        return Uint8x4.wrap(bytes4(self));
    }

    /// @dev Cast a Uint8x4 into a bytes4
    function asBytes4(Uint8x4 self) internal pure returns (bytes4) {
        return Uint8x4.unwrap(self);
    }

    /// @dev Cast a Uint8x4 into a uint32
    function asUint32(Uint8x4 self) internal pure returns (uint32) {
        return uint32(Uint8x4.unwrap(self));
    }

    function at(Uint8x4 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 3) revert OutOfBoundAccessUint8x4(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x4 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x4.unwrap(self)), 8 * pos, 8)));
        }
    }

    /// @dev Pack 4 uint8 into a Uint8x4
    function pack(uint8 arg0, uint8 arg1, uint8 arg2, uint8 arg3) internal pure returns (Uint8x4 result) {
        assembly {
            result := shr(248, arg0)
            result := or(result, shr(240, arg1))
            result := or(result, shr(232, arg2))
            result := or(result, shr(224, arg3))
        }
    }

    /// @dev Split a Uint8x4 into 4 uint8
    function split(Uint8x4 self) internal pure returns (uint8, uint8, uint8, uint8) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2), unsafeAt(self, 3));
    }

    type Uint8x3 is bytes3;

    error OutOfBoundAccessUint8x3(uint8);

    /// @dev Cast a bytes3 into a Uint8x3
    function asUint8x3(bytes3 self) internal pure returns (Uint8x3) {
        return Uint8x3.wrap(self);
    }

    /// @dev Cast a uint24 into a Uint8x3
    function asUint8x3(uint24 self) internal pure returns (Uint8x3) {
        return Uint8x3.wrap(bytes3(self));
    }

    /// @dev Cast a Uint8x3 into a bytes3
    function asBytes3(Uint8x3 self) internal pure returns (bytes3) {
        return Uint8x3.unwrap(self);
    }

    /// @dev Cast a Uint8x3 into a uint24
    function asUint24(Uint8x3 self) internal pure returns (uint24) {
        return uint24(Uint8x3.unwrap(self));
    }

    function at(Uint8x3 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 2) revert OutOfBoundAccessUint8x3(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x3 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x3.unwrap(self)), 8 * pos, 8)));
        }
    }

    /// @dev Pack 3 uint8 into a Uint8x3
    function pack(uint8 arg0, uint8 arg1, uint8 arg2) internal pure returns (Uint8x3 result) {
        assembly {
            result := shr(248, arg0)
            result := or(result, shr(240, arg1))
            result := or(result, shr(232, arg2))
        }
    }

    /// @dev Split a Uint8x3 into 3 uint8
    function split(Uint8x3 self) internal pure returns (uint8, uint8, uint8) {
        return (unsafeAt(self, 0), unsafeAt(self, 1), unsafeAt(self, 2));
    }

    type Uint8x2 is bytes2;

    error OutOfBoundAccessUint8x2(uint8);

    /// @dev Cast a bytes2 into a Uint8x2
    function asUint8x2(bytes2 self) internal pure returns (Uint8x2) {
        return Uint8x2.wrap(self);
    }

    /// @dev Cast a uint16 into a Uint8x2
    function asUint8x2(uint16 self) internal pure returns (Uint8x2) {
        return Uint8x2.wrap(bytes2(self));
    }

    /// @dev Cast a Uint8x2 into a bytes2
    function asBytes2(Uint8x2 self) internal pure returns (bytes2) {
        return Uint8x2.unwrap(self);
    }

    /// @dev Cast a Uint8x2 into a uint16
    function asUint16(Uint8x2 self) internal pure returns (uint16) {
        return uint16(Uint8x2.unwrap(self));
    }

    function at(Uint8x2 self, uint8 pos) internal pure returns (uint8) {
        if (pos > 1) revert OutOfBoundAccessUint8x2(pos);
        return unsafeAt(self, pos);
    }

    function unsafeAt(Uint8x2 self, uint8 pos) internal pure returns (uint8) {
        unchecked {
            return uint8(bytes1(_extractLeftmostBits(bytes32(Uint8x2.unwrap(self)), 8 * pos, 8)));
        }
    }

    /// @dev Pack 2 uint8 into a Uint8x2
    function pack(uint8 arg0, uint8 arg1) internal pure returns (Uint8x2 result) {
        assembly {
            result := shr(248, arg0)
            result := or(result, shr(240, arg1))
        }
    }

    /// @dev Split a Uint8x2 into 2 uint8
    function split(Uint8x2 self) internal pure returns (uint8, uint8) {
        return (unsafeAt(self, 0), unsafeAt(self, 1));
    }

    function _extractLeftmostBits(bytes32 input, uint8 offset, uint8 count) private pure returns (bytes32 output) {
        assembly {
            output := and(shl(offset, input), shl(sub(0x100, count), not(0)))
        }
    }
}
