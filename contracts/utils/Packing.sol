// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.js.

pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytesXX.
 */
library Packing {
    type Uint128x2 is bytes32;

    /// @dev Cast a bytes32 into a Uint128x2
    function asUint128x2(bytes32 self) internal pure returns (Uint128x2) {
        return Uint128x2.wrap(self);
    }

    /// @dev Cast a Uint128x2 into a bytes32
    function asBytes32(Uint128x2 self) internal pure returns (bytes32) {
        return Uint128x2.unwrap(self);
    }

    function at(Uint128x2 self, uint8 pos) internal pure returns (uint128) {
        return uint128(bytes16(Uint128x2.unwrap(self) << (pos * 128)));
    }

    /// @dev Pack 2 uint128 into a Uint128x2
    function pack(uint128 arg0, uint128 arg1) internal pure returns (Uint128x2) {
        return Uint128x2.wrap((bytes32(bytes16(arg0)) << 128) | bytes32(bytes16(arg1)));
    }

    /// @dev Split a Uint128x2 into 2 uint128
    function split(Uint128x2 self) internal pure returns (uint128, uint128) {
        return (at(self, 0), at(self, 1));
    }

    type Uint64x4 is bytes32;

    /// @dev Cast a bytes32 into a Uint64x4
    function asUint64x4(bytes32 self) internal pure returns (Uint64x4) {
        return Uint64x4.wrap(self);
    }

    /// @dev Cast a Uint64x4 into a bytes32
    function asBytes32(Uint64x4 self) internal pure returns (bytes32) {
        return Uint64x4.unwrap(self);
    }

    function at(Uint64x4 self, uint8 pos) internal pure returns (uint64) {
        return uint64(bytes8(Uint64x4.unwrap(self) << (pos * 64)));
    }

    /// @dev Pack 4 uint64 into a Uint64x4
    function pack(uint64 arg0, uint64 arg1, uint64 arg2, uint64 arg3) internal pure returns (Uint64x4) {
        return
            Uint64x4.wrap(
                (bytes32(bytes8(arg0)) << 192) |
                    (bytes32(bytes8(arg1)) << 128) |
                    (bytes32(bytes8(arg2)) << 64) |
                    bytes32(bytes8(arg3))
            );
    }

    /// @dev Split a Uint64x4 into 4 uint64
    function split(Uint64x4 self) internal pure returns (uint64, uint64, uint64, uint64) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }

    type Uint32x8 is bytes32;

    /// @dev Cast a bytes32 into a Uint32x8
    function asUint32x8(bytes32 self) internal pure returns (Uint32x8) {
        return Uint32x8.wrap(self);
    }

    /// @dev Cast a Uint32x8 into a bytes32
    function asBytes32(Uint32x8 self) internal pure returns (bytes32) {
        return Uint32x8.unwrap(self);
    }

    function at(Uint32x8 self, uint8 pos) internal pure returns (uint32) {
        return uint32(bytes4(Uint32x8.unwrap(self) << (pos * 32)));
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
    ) internal pure returns (Uint32x8) {
        return
            Uint32x8.wrap(
                (bytes32(bytes4(arg0)) << 224) |
                    (bytes32(bytes4(arg1)) << 192) |
                    (bytes32(bytes4(arg2)) << 160) |
                    (bytes32(bytes4(arg3)) << 128) |
                    (bytes32(bytes4(arg4)) << 96) |
                    (bytes32(bytes4(arg5)) << 64) |
                    (bytes32(bytes4(arg6)) << 32) |
                    bytes32(bytes4(arg7))
            );
    }

    /// @dev Split a Uint32x8 into 8 uint32
    function split(
        Uint32x8 self
    ) internal pure returns (uint32, uint32, uint32, uint32, uint32, uint32, uint32, uint32) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5), at(self, 6), at(self, 7));
    }

    type Uint16x16 is bytes32;

    /// @dev Cast a bytes32 into a Uint16x16
    function asUint16x16(bytes32 self) internal pure returns (Uint16x16) {
        return Uint16x16.wrap(self);
    }

    /// @dev Cast a Uint16x16 into a bytes32
    function asBytes32(Uint16x16 self) internal pure returns (bytes32) {
        return Uint16x16.unwrap(self);
    }

    function at(Uint16x16 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x16.unwrap(self) << (pos * 16)));
    }

    type Uint8x32 is bytes32;

    /// @dev Cast a bytes32 into a Uint8x32
    function asUint8x32(bytes32 self) internal pure returns (Uint8x32) {
        return Uint8x32.wrap(self);
    }

    /// @dev Cast a Uint8x32 into a bytes32
    function asBytes32(Uint8x32 self) internal pure returns (bytes32) {
        return Uint8x32.unwrap(self);
    }

    function at(Uint8x32 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x32.unwrap(self) << (pos * 8)));
    }

    type Uint8x31 is bytes31;

    /// @dev Cast a bytes31 into a Uint8x31
    function asUint8x31(bytes31 self) internal pure returns (Uint8x31) {
        return Uint8x31.wrap(self);
    }

    /// @dev Cast a Uint8x31 into a bytes31
    function asBytes31(Uint8x31 self) internal pure returns (bytes31) {
        return Uint8x31.unwrap(self);
    }

    function at(Uint8x31 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x31.unwrap(self) << (pos * 8)));
    }

    type Uint120x2 is bytes30;

    /// @dev Cast a bytes30 into a Uint120x2
    function asUint120x2(bytes30 self) internal pure returns (Uint120x2) {
        return Uint120x2.wrap(self);
    }

    /// @dev Cast a Uint120x2 into a bytes30
    function asBytes30(Uint120x2 self) internal pure returns (bytes30) {
        return Uint120x2.unwrap(self);
    }

    function at(Uint120x2 self, uint8 pos) internal pure returns (uint120) {
        return uint120(bytes15(Uint120x2.unwrap(self) << (pos * 120)));
    }

    /// @dev Pack 2 uint120 into a Uint120x2
    function pack(uint120 arg0, uint120 arg1) internal pure returns (Uint120x2) {
        return Uint120x2.wrap((bytes30(bytes15(arg0)) << 120) | bytes30(bytes15(arg1)));
    }

    /// @dev Split a Uint120x2 into 2 uint120
    function split(Uint120x2 self) internal pure returns (uint120, uint120) {
        return (at(self, 0), at(self, 1));
    }

    type Uint80x3 is bytes30;

    /// @dev Cast a bytes30 into a Uint80x3
    function asUint80x3(bytes30 self) internal pure returns (Uint80x3) {
        return Uint80x3.wrap(self);
    }

    /// @dev Cast a Uint80x3 into a bytes30
    function asBytes30(Uint80x3 self) internal pure returns (bytes30) {
        return Uint80x3.unwrap(self);
    }

    function at(Uint80x3 self, uint8 pos) internal pure returns (uint80) {
        return uint80(bytes10(Uint80x3.unwrap(self) << (pos * 80)));
    }

    /// @dev Pack 3 uint80 into a Uint80x3
    function pack(uint80 arg0, uint80 arg1, uint80 arg2) internal pure returns (Uint80x3) {
        return Uint80x3.wrap((bytes30(bytes10(arg0)) << 160) | (bytes30(bytes10(arg1)) << 80) | bytes30(bytes10(arg2)));
    }

    /// @dev Split a Uint80x3 into 3 uint80
    function split(Uint80x3 self) internal pure returns (uint80, uint80, uint80) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint48x5 is bytes30;

    /// @dev Cast a bytes30 into a Uint48x5
    function asUint48x5(bytes30 self) internal pure returns (Uint48x5) {
        return Uint48x5.wrap(self);
    }

    /// @dev Cast a Uint48x5 into a bytes30
    function asBytes30(Uint48x5 self) internal pure returns (bytes30) {
        return Uint48x5.unwrap(self);
    }

    function at(Uint48x5 self, uint8 pos) internal pure returns (uint48) {
        return uint48(bytes6(Uint48x5.unwrap(self) << (pos * 48)));
    }

    /// @dev Pack 5 uint48 into a Uint48x5
    function pack(uint48 arg0, uint48 arg1, uint48 arg2, uint48 arg3, uint48 arg4) internal pure returns (Uint48x5) {
        return
            Uint48x5.wrap(
                (bytes30(bytes6(arg0)) << 192) |
                    (bytes30(bytes6(arg1)) << 144) |
                    (bytes30(bytes6(arg2)) << 96) |
                    (bytes30(bytes6(arg3)) << 48) |
                    bytes30(bytes6(arg4))
            );
    }

    /// @dev Split a Uint48x5 into 5 uint48
    function split(Uint48x5 self) internal pure returns (uint48, uint48, uint48, uint48, uint48) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4));
    }

    type Uint40x6 is bytes30;

    /// @dev Cast a bytes30 into a Uint40x6
    function asUint40x6(bytes30 self) internal pure returns (Uint40x6) {
        return Uint40x6.wrap(self);
    }

    /// @dev Cast a Uint40x6 into a bytes30
    function asBytes30(Uint40x6 self) internal pure returns (bytes30) {
        return Uint40x6.unwrap(self);
    }

    function at(Uint40x6 self, uint8 pos) internal pure returns (uint40) {
        return uint40(bytes5(Uint40x6.unwrap(self) << (pos * 40)));
    }

    /// @dev Pack 6 uint40 into a Uint40x6
    function pack(
        uint40 arg0,
        uint40 arg1,
        uint40 arg2,
        uint40 arg3,
        uint40 arg4,
        uint40 arg5
    ) internal pure returns (Uint40x6) {
        return
            Uint40x6.wrap(
                (bytes30(bytes5(arg0)) << 200) |
                    (bytes30(bytes5(arg1)) << 160) |
                    (bytes30(bytes5(arg2)) << 120) |
                    (bytes30(bytes5(arg3)) << 80) |
                    (bytes30(bytes5(arg4)) << 40) |
                    bytes30(bytes5(arg5))
            );
    }

    /// @dev Split a Uint40x6 into 6 uint40
    function split(Uint40x6 self) internal pure returns (uint40, uint40, uint40, uint40, uint40, uint40) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5));
    }

    type Uint24x10 is bytes30;

    /// @dev Cast a bytes30 into a Uint24x10
    function asUint24x10(bytes30 self) internal pure returns (Uint24x10) {
        return Uint24x10.wrap(self);
    }

    /// @dev Cast a Uint24x10 into a bytes30
    function asBytes30(Uint24x10 self) internal pure returns (bytes30) {
        return Uint24x10.unwrap(self);
    }

    function at(Uint24x10 self, uint8 pos) internal pure returns (uint24) {
        return uint24(bytes3(Uint24x10.unwrap(self) << (pos * 24)));
    }

    type Uint16x15 is bytes30;

    /// @dev Cast a bytes30 into a Uint16x15
    function asUint16x15(bytes30 self) internal pure returns (Uint16x15) {
        return Uint16x15.wrap(self);
    }

    /// @dev Cast a Uint16x15 into a bytes30
    function asBytes30(Uint16x15 self) internal pure returns (bytes30) {
        return Uint16x15.unwrap(self);
    }

    function at(Uint16x15 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x15.unwrap(self) << (pos * 16)));
    }

    type Uint8x30 is bytes30;

    /// @dev Cast a bytes30 into a Uint8x30
    function asUint8x30(bytes30 self) internal pure returns (Uint8x30) {
        return Uint8x30.wrap(self);
    }

    /// @dev Cast a Uint8x30 into a bytes30
    function asBytes30(Uint8x30 self) internal pure returns (bytes30) {
        return Uint8x30.unwrap(self);
    }

    function at(Uint8x30 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x30.unwrap(self) << (pos * 8)));
    }

    type Uint8x29 is bytes29;

    /// @dev Cast a bytes29 into a Uint8x29
    function asUint8x29(bytes29 self) internal pure returns (Uint8x29) {
        return Uint8x29.wrap(self);
    }

    /// @dev Cast a Uint8x29 into a bytes29
    function asBytes29(Uint8x29 self) internal pure returns (bytes29) {
        return Uint8x29.unwrap(self);
    }

    function at(Uint8x29 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x29.unwrap(self) << (pos * 8)));
    }

    type Uint112x2 is bytes28;

    /// @dev Cast a bytes28 into a Uint112x2
    function asUint112x2(bytes28 self) internal pure returns (Uint112x2) {
        return Uint112x2.wrap(self);
    }

    /// @dev Cast a Uint112x2 into a bytes28
    function asBytes28(Uint112x2 self) internal pure returns (bytes28) {
        return Uint112x2.unwrap(self);
    }

    function at(Uint112x2 self, uint8 pos) internal pure returns (uint112) {
        return uint112(bytes14(Uint112x2.unwrap(self) << (pos * 112)));
    }

    /// @dev Pack 2 uint112 into a Uint112x2
    function pack(uint112 arg0, uint112 arg1) internal pure returns (Uint112x2) {
        return Uint112x2.wrap((bytes28(bytes14(arg0)) << 112) | bytes28(bytes14(arg1)));
    }

    /// @dev Split a Uint112x2 into 2 uint112
    function split(Uint112x2 self) internal pure returns (uint112, uint112) {
        return (at(self, 0), at(self, 1));
    }

    type Uint56x4 is bytes28;

    /// @dev Cast a bytes28 into a Uint56x4
    function asUint56x4(bytes28 self) internal pure returns (Uint56x4) {
        return Uint56x4.wrap(self);
    }

    /// @dev Cast a Uint56x4 into a bytes28
    function asBytes28(Uint56x4 self) internal pure returns (bytes28) {
        return Uint56x4.unwrap(self);
    }

    function at(Uint56x4 self, uint8 pos) internal pure returns (uint56) {
        return uint56(bytes7(Uint56x4.unwrap(self) << (pos * 56)));
    }

    /// @dev Pack 4 uint56 into a Uint56x4
    function pack(uint56 arg0, uint56 arg1, uint56 arg2, uint56 arg3) internal pure returns (Uint56x4) {
        return
            Uint56x4.wrap(
                (bytes28(bytes7(arg0)) << 168) |
                    (bytes28(bytes7(arg1)) << 112) |
                    (bytes28(bytes7(arg2)) << 56) |
                    bytes28(bytes7(arg3))
            );
    }

    /// @dev Split a Uint56x4 into 4 uint56
    function split(Uint56x4 self) internal pure returns (uint56, uint56, uint56, uint56) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }

    type Uint32x7 is bytes28;

    /// @dev Cast a bytes28 into a Uint32x7
    function asUint32x7(bytes28 self) internal pure returns (Uint32x7) {
        return Uint32x7.wrap(self);
    }

    /// @dev Cast a Uint32x7 into a bytes28
    function asBytes28(Uint32x7 self) internal pure returns (bytes28) {
        return Uint32x7.unwrap(self);
    }

    function at(Uint32x7 self, uint8 pos) internal pure returns (uint32) {
        return uint32(bytes4(Uint32x7.unwrap(self) << (pos * 32)));
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
    ) internal pure returns (Uint32x7) {
        return
            Uint32x7.wrap(
                (bytes28(bytes4(arg0)) << 192) |
                    (bytes28(bytes4(arg1)) << 160) |
                    (bytes28(bytes4(arg2)) << 128) |
                    (bytes28(bytes4(arg3)) << 96) |
                    (bytes28(bytes4(arg4)) << 64) |
                    (bytes28(bytes4(arg5)) << 32) |
                    bytes28(bytes4(arg6))
            );
    }

    /// @dev Split a Uint32x7 into 7 uint32
    function split(Uint32x7 self) internal pure returns (uint32, uint32, uint32, uint32, uint32, uint32, uint32) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5), at(self, 6));
    }

    type Uint16x14 is bytes28;

    /// @dev Cast a bytes28 into a Uint16x14
    function asUint16x14(bytes28 self) internal pure returns (Uint16x14) {
        return Uint16x14.wrap(self);
    }

    /// @dev Cast a Uint16x14 into a bytes28
    function asBytes28(Uint16x14 self) internal pure returns (bytes28) {
        return Uint16x14.unwrap(self);
    }

    function at(Uint16x14 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x14.unwrap(self) << (pos * 16)));
    }

    type Uint8x28 is bytes28;

    /// @dev Cast a bytes28 into a Uint8x28
    function asUint8x28(bytes28 self) internal pure returns (Uint8x28) {
        return Uint8x28.wrap(self);
    }

    /// @dev Cast a Uint8x28 into a bytes28
    function asBytes28(Uint8x28 self) internal pure returns (bytes28) {
        return Uint8x28.unwrap(self);
    }

    function at(Uint8x28 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x28.unwrap(self) << (pos * 8)));
    }

    type Uint72x3 is bytes27;

    /// @dev Cast a bytes27 into a Uint72x3
    function asUint72x3(bytes27 self) internal pure returns (Uint72x3) {
        return Uint72x3.wrap(self);
    }

    /// @dev Cast a Uint72x3 into a bytes27
    function asBytes27(Uint72x3 self) internal pure returns (bytes27) {
        return Uint72x3.unwrap(self);
    }

    function at(Uint72x3 self, uint8 pos) internal pure returns (uint72) {
        return uint72(bytes9(Uint72x3.unwrap(self) << (pos * 72)));
    }

    /// @dev Pack 3 uint72 into a Uint72x3
    function pack(uint72 arg0, uint72 arg1, uint72 arg2) internal pure returns (Uint72x3) {
        return Uint72x3.wrap((bytes27(bytes9(arg0)) << 144) | (bytes27(bytes9(arg1)) << 72) | bytes27(bytes9(arg2)));
    }

    /// @dev Split a Uint72x3 into 3 uint72
    function split(Uint72x3 self) internal pure returns (uint72, uint72, uint72) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint24x9 is bytes27;

    /// @dev Cast a bytes27 into a Uint24x9
    function asUint24x9(bytes27 self) internal pure returns (Uint24x9) {
        return Uint24x9.wrap(self);
    }

    /// @dev Cast a Uint24x9 into a bytes27
    function asBytes27(Uint24x9 self) internal pure returns (bytes27) {
        return Uint24x9.unwrap(self);
    }

    function at(Uint24x9 self, uint8 pos) internal pure returns (uint24) {
        return uint24(bytes3(Uint24x9.unwrap(self) << (pos * 24)));
    }

    type Uint8x27 is bytes27;

    /// @dev Cast a bytes27 into a Uint8x27
    function asUint8x27(bytes27 self) internal pure returns (Uint8x27) {
        return Uint8x27.wrap(self);
    }

    /// @dev Cast a Uint8x27 into a bytes27
    function asBytes27(Uint8x27 self) internal pure returns (bytes27) {
        return Uint8x27.unwrap(self);
    }

    function at(Uint8x27 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x27.unwrap(self) << (pos * 8)));
    }

    type Uint104x2 is bytes26;

    /// @dev Cast a bytes26 into a Uint104x2
    function asUint104x2(bytes26 self) internal pure returns (Uint104x2) {
        return Uint104x2.wrap(self);
    }

    /// @dev Cast a Uint104x2 into a bytes26
    function asBytes26(Uint104x2 self) internal pure returns (bytes26) {
        return Uint104x2.unwrap(self);
    }

    function at(Uint104x2 self, uint8 pos) internal pure returns (uint104) {
        return uint104(bytes13(Uint104x2.unwrap(self) << (pos * 104)));
    }

    /// @dev Pack 2 uint104 into a Uint104x2
    function pack(uint104 arg0, uint104 arg1) internal pure returns (Uint104x2) {
        return Uint104x2.wrap((bytes26(bytes13(arg0)) << 104) | bytes26(bytes13(arg1)));
    }

    /// @dev Split a Uint104x2 into 2 uint104
    function split(Uint104x2 self) internal pure returns (uint104, uint104) {
        return (at(self, 0), at(self, 1));
    }

    type Uint16x13 is bytes26;

    /// @dev Cast a bytes26 into a Uint16x13
    function asUint16x13(bytes26 self) internal pure returns (Uint16x13) {
        return Uint16x13.wrap(self);
    }

    /// @dev Cast a Uint16x13 into a bytes26
    function asBytes26(Uint16x13 self) internal pure returns (bytes26) {
        return Uint16x13.unwrap(self);
    }

    function at(Uint16x13 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x13.unwrap(self) << (pos * 16)));
    }

    type Uint8x26 is bytes26;

    /// @dev Cast a bytes26 into a Uint8x26
    function asUint8x26(bytes26 self) internal pure returns (Uint8x26) {
        return Uint8x26.wrap(self);
    }

    /// @dev Cast a Uint8x26 into a bytes26
    function asBytes26(Uint8x26 self) internal pure returns (bytes26) {
        return Uint8x26.unwrap(self);
    }

    function at(Uint8x26 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x26.unwrap(self) << (pos * 8)));
    }

    type Uint40x5 is bytes25;

    /// @dev Cast a bytes25 into a Uint40x5
    function asUint40x5(bytes25 self) internal pure returns (Uint40x5) {
        return Uint40x5.wrap(self);
    }

    /// @dev Cast a Uint40x5 into a bytes25
    function asBytes25(Uint40x5 self) internal pure returns (bytes25) {
        return Uint40x5.unwrap(self);
    }

    function at(Uint40x5 self, uint8 pos) internal pure returns (uint40) {
        return uint40(bytes5(Uint40x5.unwrap(self) << (pos * 40)));
    }

    /// @dev Pack 5 uint40 into a Uint40x5
    function pack(uint40 arg0, uint40 arg1, uint40 arg2, uint40 arg3, uint40 arg4) internal pure returns (Uint40x5) {
        return
            Uint40x5.wrap(
                (bytes25(bytes5(arg0)) << 160) |
                    (bytes25(bytes5(arg1)) << 120) |
                    (bytes25(bytes5(arg2)) << 80) |
                    (bytes25(bytes5(arg3)) << 40) |
                    bytes25(bytes5(arg4))
            );
    }

    /// @dev Split a Uint40x5 into 5 uint40
    function split(Uint40x5 self) internal pure returns (uint40, uint40, uint40, uint40, uint40) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4));
    }

    type Uint8x25 is bytes25;

    /// @dev Cast a bytes25 into a Uint8x25
    function asUint8x25(bytes25 self) internal pure returns (Uint8x25) {
        return Uint8x25.wrap(self);
    }

    /// @dev Cast a Uint8x25 into a bytes25
    function asBytes25(Uint8x25 self) internal pure returns (bytes25) {
        return Uint8x25.unwrap(self);
    }

    function at(Uint8x25 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x25.unwrap(self) << (pos * 8)));
    }

    type Uint96x2 is bytes24;

    /// @dev Cast a bytes24 into a Uint96x2
    function asUint96x2(bytes24 self) internal pure returns (Uint96x2) {
        return Uint96x2.wrap(self);
    }

    /// @dev Cast a Uint96x2 into a bytes24
    function asBytes24(Uint96x2 self) internal pure returns (bytes24) {
        return Uint96x2.unwrap(self);
    }

    function at(Uint96x2 self, uint8 pos) internal pure returns (uint96) {
        return uint96(bytes12(Uint96x2.unwrap(self) << (pos * 96)));
    }

    /// @dev Pack 2 uint96 into a Uint96x2
    function pack(uint96 arg0, uint96 arg1) internal pure returns (Uint96x2) {
        return Uint96x2.wrap((bytes24(bytes12(arg0)) << 96) | bytes24(bytes12(arg1)));
    }

    /// @dev Split a Uint96x2 into 2 uint96
    function split(Uint96x2 self) internal pure returns (uint96, uint96) {
        return (at(self, 0), at(self, 1));
    }

    type Uint64x3 is bytes24;

    /// @dev Cast a bytes24 into a Uint64x3
    function asUint64x3(bytes24 self) internal pure returns (Uint64x3) {
        return Uint64x3.wrap(self);
    }

    /// @dev Cast a Uint64x3 into a bytes24
    function asBytes24(Uint64x3 self) internal pure returns (bytes24) {
        return Uint64x3.unwrap(self);
    }

    function at(Uint64x3 self, uint8 pos) internal pure returns (uint64) {
        return uint64(bytes8(Uint64x3.unwrap(self) << (pos * 64)));
    }

    /// @dev Pack 3 uint64 into a Uint64x3
    function pack(uint64 arg0, uint64 arg1, uint64 arg2) internal pure returns (Uint64x3) {
        return Uint64x3.wrap((bytes24(bytes8(arg0)) << 128) | (bytes24(bytes8(arg1)) << 64) | bytes24(bytes8(arg2)));
    }

    /// @dev Split a Uint64x3 into 3 uint64
    function split(Uint64x3 self) internal pure returns (uint64, uint64, uint64) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint48x4 is bytes24;

    /// @dev Cast a bytes24 into a Uint48x4
    function asUint48x4(bytes24 self) internal pure returns (Uint48x4) {
        return Uint48x4.wrap(self);
    }

    /// @dev Cast a Uint48x4 into a bytes24
    function asBytes24(Uint48x4 self) internal pure returns (bytes24) {
        return Uint48x4.unwrap(self);
    }

    function at(Uint48x4 self, uint8 pos) internal pure returns (uint48) {
        return uint48(bytes6(Uint48x4.unwrap(self) << (pos * 48)));
    }

    /// @dev Pack 4 uint48 into a Uint48x4
    function pack(uint48 arg0, uint48 arg1, uint48 arg2, uint48 arg3) internal pure returns (Uint48x4) {
        return
            Uint48x4.wrap(
                (bytes24(bytes6(arg0)) << 144) |
                    (bytes24(bytes6(arg1)) << 96) |
                    (bytes24(bytes6(arg2)) << 48) |
                    bytes24(bytes6(arg3))
            );
    }

    /// @dev Split a Uint48x4 into 4 uint48
    function split(Uint48x4 self) internal pure returns (uint48, uint48, uint48, uint48) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }

    type Uint32x6 is bytes24;

    /// @dev Cast a bytes24 into a Uint32x6
    function asUint32x6(bytes24 self) internal pure returns (Uint32x6) {
        return Uint32x6.wrap(self);
    }

    /// @dev Cast a Uint32x6 into a bytes24
    function asBytes24(Uint32x6 self) internal pure returns (bytes24) {
        return Uint32x6.unwrap(self);
    }

    function at(Uint32x6 self, uint8 pos) internal pure returns (uint32) {
        return uint32(bytes4(Uint32x6.unwrap(self) << (pos * 32)));
    }

    /// @dev Pack 6 uint32 into a Uint32x6
    function pack(
        uint32 arg0,
        uint32 arg1,
        uint32 arg2,
        uint32 arg3,
        uint32 arg4,
        uint32 arg5
    ) internal pure returns (Uint32x6) {
        return
            Uint32x6.wrap(
                (bytes24(bytes4(arg0)) << 160) |
                    (bytes24(bytes4(arg1)) << 128) |
                    (bytes24(bytes4(arg2)) << 96) |
                    (bytes24(bytes4(arg3)) << 64) |
                    (bytes24(bytes4(arg4)) << 32) |
                    bytes24(bytes4(arg5))
            );
    }

    /// @dev Split a Uint32x6 into 6 uint32
    function split(Uint32x6 self) internal pure returns (uint32, uint32, uint32, uint32, uint32, uint32) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5));
    }

    type Uint24x8 is bytes24;

    /// @dev Cast a bytes24 into a Uint24x8
    function asUint24x8(bytes24 self) internal pure returns (Uint24x8) {
        return Uint24x8.wrap(self);
    }

    /// @dev Cast a Uint24x8 into a bytes24
    function asBytes24(Uint24x8 self) internal pure returns (bytes24) {
        return Uint24x8.unwrap(self);
    }

    function at(Uint24x8 self, uint8 pos) internal pure returns (uint24) {
        return uint24(bytes3(Uint24x8.unwrap(self) << (pos * 24)));
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
    ) internal pure returns (Uint24x8) {
        return
            Uint24x8.wrap(
                (bytes24(bytes3(arg0)) << 168) |
                    (bytes24(bytes3(arg1)) << 144) |
                    (bytes24(bytes3(arg2)) << 120) |
                    (bytes24(bytes3(arg3)) << 96) |
                    (bytes24(bytes3(arg4)) << 72) |
                    (bytes24(bytes3(arg5)) << 48) |
                    (bytes24(bytes3(arg6)) << 24) |
                    bytes24(bytes3(arg7))
            );
    }

    /// @dev Split a Uint24x8 into 8 uint24
    function split(
        Uint24x8 self
    ) internal pure returns (uint24, uint24, uint24, uint24, uint24, uint24, uint24, uint24) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5), at(self, 6), at(self, 7));
    }

    type Uint16x12 is bytes24;

    /// @dev Cast a bytes24 into a Uint16x12
    function asUint16x12(bytes24 self) internal pure returns (Uint16x12) {
        return Uint16x12.wrap(self);
    }

    /// @dev Cast a Uint16x12 into a bytes24
    function asBytes24(Uint16x12 self) internal pure returns (bytes24) {
        return Uint16x12.unwrap(self);
    }

    function at(Uint16x12 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x12.unwrap(self) << (pos * 16)));
    }

    type Uint8x24 is bytes24;

    /// @dev Cast a bytes24 into a Uint8x24
    function asUint8x24(bytes24 self) internal pure returns (Uint8x24) {
        return Uint8x24.wrap(self);
    }

    /// @dev Cast a Uint8x24 into a bytes24
    function asBytes24(Uint8x24 self) internal pure returns (bytes24) {
        return Uint8x24.unwrap(self);
    }

    function at(Uint8x24 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x24.unwrap(self) << (pos * 8)));
    }

    type Uint8x23 is bytes23;

    /// @dev Cast a bytes23 into a Uint8x23
    function asUint8x23(bytes23 self) internal pure returns (Uint8x23) {
        return Uint8x23.wrap(self);
    }

    /// @dev Cast a Uint8x23 into a bytes23
    function asBytes23(Uint8x23 self) internal pure returns (bytes23) {
        return Uint8x23.unwrap(self);
    }

    function at(Uint8x23 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x23.unwrap(self) << (pos * 8)));
    }

    type Uint88x2 is bytes22;

    /// @dev Cast a bytes22 into a Uint88x2
    function asUint88x2(bytes22 self) internal pure returns (Uint88x2) {
        return Uint88x2.wrap(self);
    }

    /// @dev Cast a Uint88x2 into a bytes22
    function asBytes22(Uint88x2 self) internal pure returns (bytes22) {
        return Uint88x2.unwrap(self);
    }

    function at(Uint88x2 self, uint8 pos) internal pure returns (uint88) {
        return uint88(bytes11(Uint88x2.unwrap(self) << (pos * 88)));
    }

    /// @dev Pack 2 uint88 into a Uint88x2
    function pack(uint88 arg0, uint88 arg1) internal pure returns (Uint88x2) {
        return Uint88x2.wrap((bytes22(bytes11(arg0)) << 88) | bytes22(bytes11(arg1)));
    }

    /// @dev Split a Uint88x2 into 2 uint88
    function split(Uint88x2 self) internal pure returns (uint88, uint88) {
        return (at(self, 0), at(self, 1));
    }

    type Uint16x11 is bytes22;

    /// @dev Cast a bytes22 into a Uint16x11
    function asUint16x11(bytes22 self) internal pure returns (Uint16x11) {
        return Uint16x11.wrap(self);
    }

    /// @dev Cast a Uint16x11 into a bytes22
    function asBytes22(Uint16x11 self) internal pure returns (bytes22) {
        return Uint16x11.unwrap(self);
    }

    function at(Uint16x11 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x11.unwrap(self) << (pos * 16)));
    }

    type Uint8x22 is bytes22;

    /// @dev Cast a bytes22 into a Uint8x22
    function asUint8x22(bytes22 self) internal pure returns (Uint8x22) {
        return Uint8x22.wrap(self);
    }

    /// @dev Cast a Uint8x22 into a bytes22
    function asBytes22(Uint8x22 self) internal pure returns (bytes22) {
        return Uint8x22.unwrap(self);
    }

    function at(Uint8x22 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x22.unwrap(self) << (pos * 8)));
    }

    type Uint56x3 is bytes21;

    /// @dev Cast a bytes21 into a Uint56x3
    function asUint56x3(bytes21 self) internal pure returns (Uint56x3) {
        return Uint56x3.wrap(self);
    }

    /// @dev Cast a Uint56x3 into a bytes21
    function asBytes21(Uint56x3 self) internal pure returns (bytes21) {
        return Uint56x3.unwrap(self);
    }

    function at(Uint56x3 self, uint8 pos) internal pure returns (uint56) {
        return uint56(bytes7(Uint56x3.unwrap(self) << (pos * 56)));
    }

    /// @dev Pack 3 uint56 into a Uint56x3
    function pack(uint56 arg0, uint56 arg1, uint56 arg2) internal pure returns (Uint56x3) {
        return Uint56x3.wrap((bytes21(bytes7(arg0)) << 112) | (bytes21(bytes7(arg1)) << 56) | bytes21(bytes7(arg2)));
    }

    /// @dev Split a Uint56x3 into 3 uint56
    function split(Uint56x3 self) internal pure returns (uint56, uint56, uint56) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint24x7 is bytes21;

    /// @dev Cast a bytes21 into a Uint24x7
    function asUint24x7(bytes21 self) internal pure returns (Uint24x7) {
        return Uint24x7.wrap(self);
    }

    /// @dev Cast a Uint24x7 into a bytes21
    function asBytes21(Uint24x7 self) internal pure returns (bytes21) {
        return Uint24x7.unwrap(self);
    }

    function at(Uint24x7 self, uint8 pos) internal pure returns (uint24) {
        return uint24(bytes3(Uint24x7.unwrap(self) << (pos * 24)));
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
    ) internal pure returns (Uint24x7) {
        return
            Uint24x7.wrap(
                (bytes21(bytes3(arg0)) << 144) |
                    (bytes21(bytes3(arg1)) << 120) |
                    (bytes21(bytes3(arg2)) << 96) |
                    (bytes21(bytes3(arg3)) << 72) |
                    (bytes21(bytes3(arg4)) << 48) |
                    (bytes21(bytes3(arg5)) << 24) |
                    bytes21(bytes3(arg6))
            );
    }

    /// @dev Split a Uint24x7 into 7 uint24
    function split(Uint24x7 self) internal pure returns (uint24, uint24, uint24, uint24, uint24, uint24, uint24) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5), at(self, 6));
    }

    type Uint8x21 is bytes21;

    /// @dev Cast a bytes21 into a Uint8x21
    function asUint8x21(bytes21 self) internal pure returns (Uint8x21) {
        return Uint8x21.wrap(self);
    }

    /// @dev Cast a Uint8x21 into a bytes21
    function asBytes21(Uint8x21 self) internal pure returns (bytes21) {
        return Uint8x21.unwrap(self);
    }

    function at(Uint8x21 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x21.unwrap(self) << (pos * 8)));
    }

    type Uint80x2 is bytes20;

    /// @dev Cast a bytes20 into a Uint80x2
    function asUint80x2(bytes20 self) internal pure returns (Uint80x2) {
        return Uint80x2.wrap(self);
    }

    /// @dev Cast a Uint80x2 into a bytes20
    function asBytes20(Uint80x2 self) internal pure returns (bytes20) {
        return Uint80x2.unwrap(self);
    }

    function at(Uint80x2 self, uint8 pos) internal pure returns (uint80) {
        return uint80(bytes10(Uint80x2.unwrap(self) << (pos * 80)));
    }

    /// @dev Pack 2 uint80 into a Uint80x2
    function pack(uint80 arg0, uint80 arg1) internal pure returns (Uint80x2) {
        return Uint80x2.wrap((bytes20(bytes10(arg0)) << 80) | bytes20(bytes10(arg1)));
    }

    /// @dev Split a Uint80x2 into 2 uint80
    function split(Uint80x2 self) internal pure returns (uint80, uint80) {
        return (at(self, 0), at(self, 1));
    }

    type Uint40x4 is bytes20;

    /// @dev Cast a bytes20 into a Uint40x4
    function asUint40x4(bytes20 self) internal pure returns (Uint40x4) {
        return Uint40x4.wrap(self);
    }

    /// @dev Cast a Uint40x4 into a bytes20
    function asBytes20(Uint40x4 self) internal pure returns (bytes20) {
        return Uint40x4.unwrap(self);
    }

    function at(Uint40x4 self, uint8 pos) internal pure returns (uint40) {
        return uint40(bytes5(Uint40x4.unwrap(self) << (pos * 40)));
    }

    /// @dev Pack 4 uint40 into a Uint40x4
    function pack(uint40 arg0, uint40 arg1, uint40 arg2, uint40 arg3) internal pure returns (Uint40x4) {
        return
            Uint40x4.wrap(
                (bytes20(bytes5(arg0)) << 120) |
                    (bytes20(bytes5(arg1)) << 80) |
                    (bytes20(bytes5(arg2)) << 40) |
                    bytes20(bytes5(arg3))
            );
    }

    /// @dev Split a Uint40x4 into 4 uint40
    function split(Uint40x4 self) internal pure returns (uint40, uint40, uint40, uint40) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }

    type Uint32x5 is bytes20;

    /// @dev Cast a bytes20 into a Uint32x5
    function asUint32x5(bytes20 self) internal pure returns (Uint32x5) {
        return Uint32x5.wrap(self);
    }

    /// @dev Cast a Uint32x5 into a bytes20
    function asBytes20(Uint32x5 self) internal pure returns (bytes20) {
        return Uint32x5.unwrap(self);
    }

    function at(Uint32x5 self, uint8 pos) internal pure returns (uint32) {
        return uint32(bytes4(Uint32x5.unwrap(self) << (pos * 32)));
    }

    /// @dev Pack 5 uint32 into a Uint32x5
    function pack(uint32 arg0, uint32 arg1, uint32 arg2, uint32 arg3, uint32 arg4) internal pure returns (Uint32x5) {
        return
            Uint32x5.wrap(
                (bytes20(bytes4(arg0)) << 128) |
                    (bytes20(bytes4(arg1)) << 96) |
                    (bytes20(bytes4(arg2)) << 64) |
                    (bytes20(bytes4(arg3)) << 32) |
                    bytes20(bytes4(arg4))
            );
    }

    /// @dev Split a Uint32x5 into 5 uint32
    function split(Uint32x5 self) internal pure returns (uint32, uint32, uint32, uint32, uint32) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4));
    }

    type Uint16x10 is bytes20;

    /// @dev Cast a bytes20 into a Uint16x10
    function asUint16x10(bytes20 self) internal pure returns (Uint16x10) {
        return Uint16x10.wrap(self);
    }

    /// @dev Cast a Uint16x10 into a bytes20
    function asBytes20(Uint16x10 self) internal pure returns (bytes20) {
        return Uint16x10.unwrap(self);
    }

    function at(Uint16x10 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x10.unwrap(self) << (pos * 16)));
    }

    type Uint8x20 is bytes20;

    /// @dev Cast a bytes20 into a Uint8x20
    function asUint8x20(bytes20 self) internal pure returns (Uint8x20) {
        return Uint8x20.wrap(self);
    }

    /// @dev Cast a Uint8x20 into a bytes20
    function asBytes20(Uint8x20 self) internal pure returns (bytes20) {
        return Uint8x20.unwrap(self);
    }

    function at(Uint8x20 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x20.unwrap(self) << (pos * 8)));
    }

    type Uint8x19 is bytes19;

    /// @dev Cast a bytes19 into a Uint8x19
    function asUint8x19(bytes19 self) internal pure returns (Uint8x19) {
        return Uint8x19.wrap(self);
    }

    /// @dev Cast a Uint8x19 into a bytes19
    function asBytes19(Uint8x19 self) internal pure returns (bytes19) {
        return Uint8x19.unwrap(self);
    }

    function at(Uint8x19 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x19.unwrap(self) << (pos * 8)));
    }

    type Uint72x2 is bytes18;

    /// @dev Cast a bytes18 into a Uint72x2
    function asUint72x2(bytes18 self) internal pure returns (Uint72x2) {
        return Uint72x2.wrap(self);
    }

    /// @dev Cast a Uint72x2 into a bytes18
    function asBytes18(Uint72x2 self) internal pure returns (bytes18) {
        return Uint72x2.unwrap(self);
    }

    function at(Uint72x2 self, uint8 pos) internal pure returns (uint72) {
        return uint72(bytes9(Uint72x2.unwrap(self) << (pos * 72)));
    }

    /// @dev Pack 2 uint72 into a Uint72x2
    function pack(uint72 arg0, uint72 arg1) internal pure returns (Uint72x2) {
        return Uint72x2.wrap((bytes18(bytes9(arg0)) << 72) | bytes18(bytes9(arg1)));
    }

    /// @dev Split a Uint72x2 into 2 uint72
    function split(Uint72x2 self) internal pure returns (uint72, uint72) {
        return (at(self, 0), at(self, 1));
    }

    type Uint48x3 is bytes18;

    /// @dev Cast a bytes18 into a Uint48x3
    function asUint48x3(bytes18 self) internal pure returns (Uint48x3) {
        return Uint48x3.wrap(self);
    }

    /// @dev Cast a Uint48x3 into a bytes18
    function asBytes18(Uint48x3 self) internal pure returns (bytes18) {
        return Uint48x3.unwrap(self);
    }

    function at(Uint48x3 self, uint8 pos) internal pure returns (uint48) {
        return uint48(bytes6(Uint48x3.unwrap(self) << (pos * 48)));
    }

    /// @dev Pack 3 uint48 into a Uint48x3
    function pack(uint48 arg0, uint48 arg1, uint48 arg2) internal pure returns (Uint48x3) {
        return Uint48x3.wrap((bytes18(bytes6(arg0)) << 96) | (bytes18(bytes6(arg1)) << 48) | bytes18(bytes6(arg2)));
    }

    /// @dev Split a Uint48x3 into 3 uint48
    function split(Uint48x3 self) internal pure returns (uint48, uint48, uint48) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint24x6 is bytes18;

    /// @dev Cast a bytes18 into a Uint24x6
    function asUint24x6(bytes18 self) internal pure returns (Uint24x6) {
        return Uint24x6.wrap(self);
    }

    /// @dev Cast a Uint24x6 into a bytes18
    function asBytes18(Uint24x6 self) internal pure returns (bytes18) {
        return Uint24x6.unwrap(self);
    }

    function at(Uint24x6 self, uint8 pos) internal pure returns (uint24) {
        return uint24(bytes3(Uint24x6.unwrap(self) << (pos * 24)));
    }

    /// @dev Pack 6 uint24 into a Uint24x6
    function pack(
        uint24 arg0,
        uint24 arg1,
        uint24 arg2,
        uint24 arg3,
        uint24 arg4,
        uint24 arg5
    ) internal pure returns (Uint24x6) {
        return
            Uint24x6.wrap(
                (bytes18(bytes3(arg0)) << 120) |
                    (bytes18(bytes3(arg1)) << 96) |
                    (bytes18(bytes3(arg2)) << 72) |
                    (bytes18(bytes3(arg3)) << 48) |
                    (bytes18(bytes3(arg4)) << 24) |
                    bytes18(bytes3(arg5))
            );
    }

    /// @dev Split a Uint24x6 into 6 uint24
    function split(Uint24x6 self) internal pure returns (uint24, uint24, uint24, uint24, uint24, uint24) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5));
    }

    type Uint16x9 is bytes18;

    /// @dev Cast a bytes18 into a Uint16x9
    function asUint16x9(bytes18 self) internal pure returns (Uint16x9) {
        return Uint16x9.wrap(self);
    }

    /// @dev Cast a Uint16x9 into a bytes18
    function asBytes18(Uint16x9 self) internal pure returns (bytes18) {
        return Uint16x9.unwrap(self);
    }

    function at(Uint16x9 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x9.unwrap(self) << (pos * 16)));
    }

    type Uint8x18 is bytes18;

    /// @dev Cast a bytes18 into a Uint8x18
    function asUint8x18(bytes18 self) internal pure returns (Uint8x18) {
        return Uint8x18.wrap(self);
    }

    /// @dev Cast a Uint8x18 into a bytes18
    function asBytes18(Uint8x18 self) internal pure returns (bytes18) {
        return Uint8x18.unwrap(self);
    }

    function at(Uint8x18 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x18.unwrap(self) << (pos * 8)));
    }

    type Uint8x17 is bytes17;

    /// @dev Cast a bytes17 into a Uint8x17
    function asUint8x17(bytes17 self) internal pure returns (Uint8x17) {
        return Uint8x17.wrap(self);
    }

    /// @dev Cast a Uint8x17 into a bytes17
    function asBytes17(Uint8x17 self) internal pure returns (bytes17) {
        return Uint8x17.unwrap(self);
    }

    function at(Uint8x17 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x17.unwrap(self) << (pos * 8)));
    }

    type Uint64x2 is bytes16;

    /// @dev Cast a bytes16 into a Uint64x2
    function asUint64x2(bytes16 self) internal pure returns (Uint64x2) {
        return Uint64x2.wrap(self);
    }

    /// @dev Cast a Uint64x2 into a bytes16
    function asBytes16(Uint64x2 self) internal pure returns (bytes16) {
        return Uint64x2.unwrap(self);
    }

    function at(Uint64x2 self, uint8 pos) internal pure returns (uint64) {
        return uint64(bytes8(Uint64x2.unwrap(self) << (pos * 64)));
    }

    /// @dev Pack 2 uint64 into a Uint64x2
    function pack(uint64 arg0, uint64 arg1) internal pure returns (Uint64x2) {
        return Uint64x2.wrap((bytes16(bytes8(arg0)) << 64) | bytes16(bytes8(arg1)));
    }

    /// @dev Split a Uint64x2 into 2 uint64
    function split(Uint64x2 self) internal pure returns (uint64, uint64) {
        return (at(self, 0), at(self, 1));
    }

    type Uint32x4 is bytes16;

    /// @dev Cast a bytes16 into a Uint32x4
    function asUint32x4(bytes16 self) internal pure returns (Uint32x4) {
        return Uint32x4.wrap(self);
    }

    /// @dev Cast a Uint32x4 into a bytes16
    function asBytes16(Uint32x4 self) internal pure returns (bytes16) {
        return Uint32x4.unwrap(self);
    }

    function at(Uint32x4 self, uint8 pos) internal pure returns (uint32) {
        return uint32(bytes4(Uint32x4.unwrap(self) << (pos * 32)));
    }

    /// @dev Pack 4 uint32 into a Uint32x4
    function pack(uint32 arg0, uint32 arg1, uint32 arg2, uint32 arg3) internal pure returns (Uint32x4) {
        return
            Uint32x4.wrap(
                (bytes16(bytes4(arg0)) << 96) |
                    (bytes16(bytes4(arg1)) << 64) |
                    (bytes16(bytes4(arg2)) << 32) |
                    bytes16(bytes4(arg3))
            );
    }

    /// @dev Split a Uint32x4 into 4 uint32
    function split(Uint32x4 self) internal pure returns (uint32, uint32, uint32, uint32) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }

    type Uint16x8 is bytes16;

    /// @dev Cast a bytes16 into a Uint16x8
    function asUint16x8(bytes16 self) internal pure returns (Uint16x8) {
        return Uint16x8.wrap(self);
    }

    /// @dev Cast a Uint16x8 into a bytes16
    function asBytes16(Uint16x8 self) internal pure returns (bytes16) {
        return Uint16x8.unwrap(self);
    }

    function at(Uint16x8 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x8.unwrap(self) << (pos * 16)));
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
    ) internal pure returns (Uint16x8) {
        return
            Uint16x8.wrap(
                (bytes16(bytes2(arg0)) << 112) |
                    (bytes16(bytes2(arg1)) << 96) |
                    (bytes16(bytes2(arg2)) << 80) |
                    (bytes16(bytes2(arg3)) << 64) |
                    (bytes16(bytes2(arg4)) << 48) |
                    (bytes16(bytes2(arg5)) << 32) |
                    (bytes16(bytes2(arg6)) << 16) |
                    bytes16(bytes2(arg7))
            );
    }

    /// @dev Split a Uint16x8 into 8 uint16
    function split(
        Uint16x8 self
    ) internal pure returns (uint16, uint16, uint16, uint16, uint16, uint16, uint16, uint16) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5), at(self, 6), at(self, 7));
    }

    type Uint8x16 is bytes16;

    /// @dev Cast a bytes16 into a Uint8x16
    function asUint8x16(bytes16 self) internal pure returns (Uint8x16) {
        return Uint8x16.wrap(self);
    }

    /// @dev Cast a Uint8x16 into a bytes16
    function asBytes16(Uint8x16 self) internal pure returns (bytes16) {
        return Uint8x16.unwrap(self);
    }

    function at(Uint8x16 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x16.unwrap(self) << (pos * 8)));
    }

    type Uint40x3 is bytes15;

    /// @dev Cast a bytes15 into a Uint40x3
    function asUint40x3(bytes15 self) internal pure returns (Uint40x3) {
        return Uint40x3.wrap(self);
    }

    /// @dev Cast a Uint40x3 into a bytes15
    function asBytes15(Uint40x3 self) internal pure returns (bytes15) {
        return Uint40x3.unwrap(self);
    }

    function at(Uint40x3 self, uint8 pos) internal pure returns (uint40) {
        return uint40(bytes5(Uint40x3.unwrap(self) << (pos * 40)));
    }

    /// @dev Pack 3 uint40 into a Uint40x3
    function pack(uint40 arg0, uint40 arg1, uint40 arg2) internal pure returns (Uint40x3) {
        return Uint40x3.wrap((bytes15(bytes5(arg0)) << 80) | (bytes15(bytes5(arg1)) << 40) | bytes15(bytes5(arg2)));
    }

    /// @dev Split a Uint40x3 into 3 uint40
    function split(Uint40x3 self) internal pure returns (uint40, uint40, uint40) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint24x5 is bytes15;

    /// @dev Cast a bytes15 into a Uint24x5
    function asUint24x5(bytes15 self) internal pure returns (Uint24x5) {
        return Uint24x5.wrap(self);
    }

    /// @dev Cast a Uint24x5 into a bytes15
    function asBytes15(Uint24x5 self) internal pure returns (bytes15) {
        return Uint24x5.unwrap(self);
    }

    function at(Uint24x5 self, uint8 pos) internal pure returns (uint24) {
        return uint24(bytes3(Uint24x5.unwrap(self) << (pos * 24)));
    }

    /// @dev Pack 5 uint24 into a Uint24x5
    function pack(uint24 arg0, uint24 arg1, uint24 arg2, uint24 arg3, uint24 arg4) internal pure returns (Uint24x5) {
        return
            Uint24x5.wrap(
                (bytes15(bytes3(arg0)) << 96) |
                    (bytes15(bytes3(arg1)) << 72) |
                    (bytes15(bytes3(arg2)) << 48) |
                    (bytes15(bytes3(arg3)) << 24) |
                    bytes15(bytes3(arg4))
            );
    }

    /// @dev Split a Uint24x5 into 5 uint24
    function split(Uint24x5 self) internal pure returns (uint24, uint24, uint24, uint24, uint24) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4));
    }

    type Uint8x15 is bytes15;

    /// @dev Cast a bytes15 into a Uint8x15
    function asUint8x15(bytes15 self) internal pure returns (Uint8x15) {
        return Uint8x15.wrap(self);
    }

    /// @dev Cast a Uint8x15 into a bytes15
    function asBytes15(Uint8x15 self) internal pure returns (bytes15) {
        return Uint8x15.unwrap(self);
    }

    function at(Uint8x15 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x15.unwrap(self) << (pos * 8)));
    }

    type Uint56x2 is bytes14;

    /// @dev Cast a bytes14 into a Uint56x2
    function asUint56x2(bytes14 self) internal pure returns (Uint56x2) {
        return Uint56x2.wrap(self);
    }

    /// @dev Cast a Uint56x2 into a bytes14
    function asBytes14(Uint56x2 self) internal pure returns (bytes14) {
        return Uint56x2.unwrap(self);
    }

    function at(Uint56x2 self, uint8 pos) internal pure returns (uint56) {
        return uint56(bytes7(Uint56x2.unwrap(self) << (pos * 56)));
    }

    /// @dev Pack 2 uint56 into a Uint56x2
    function pack(uint56 arg0, uint56 arg1) internal pure returns (Uint56x2) {
        return Uint56x2.wrap((bytes14(bytes7(arg0)) << 56) | bytes14(bytes7(arg1)));
    }

    /// @dev Split a Uint56x2 into 2 uint56
    function split(Uint56x2 self) internal pure returns (uint56, uint56) {
        return (at(self, 0), at(self, 1));
    }

    type Uint16x7 is bytes14;

    /// @dev Cast a bytes14 into a Uint16x7
    function asUint16x7(bytes14 self) internal pure returns (Uint16x7) {
        return Uint16x7.wrap(self);
    }

    /// @dev Cast a Uint16x7 into a bytes14
    function asBytes14(Uint16x7 self) internal pure returns (bytes14) {
        return Uint16x7.unwrap(self);
    }

    function at(Uint16x7 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x7.unwrap(self) << (pos * 16)));
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
    ) internal pure returns (Uint16x7) {
        return
            Uint16x7.wrap(
                (bytes14(bytes2(arg0)) << 96) |
                    (bytes14(bytes2(arg1)) << 80) |
                    (bytes14(bytes2(arg2)) << 64) |
                    (bytes14(bytes2(arg3)) << 48) |
                    (bytes14(bytes2(arg4)) << 32) |
                    (bytes14(bytes2(arg5)) << 16) |
                    bytes14(bytes2(arg6))
            );
    }

    /// @dev Split a Uint16x7 into 7 uint16
    function split(Uint16x7 self) internal pure returns (uint16, uint16, uint16, uint16, uint16, uint16, uint16) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5), at(self, 6));
    }

    type Uint8x14 is bytes14;

    /// @dev Cast a bytes14 into a Uint8x14
    function asUint8x14(bytes14 self) internal pure returns (Uint8x14) {
        return Uint8x14.wrap(self);
    }

    /// @dev Cast a Uint8x14 into a bytes14
    function asBytes14(Uint8x14 self) internal pure returns (bytes14) {
        return Uint8x14.unwrap(self);
    }

    function at(Uint8x14 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x14.unwrap(self) << (pos * 8)));
    }

    type Uint8x13 is bytes13;

    /// @dev Cast a bytes13 into a Uint8x13
    function asUint8x13(bytes13 self) internal pure returns (Uint8x13) {
        return Uint8x13.wrap(self);
    }

    /// @dev Cast a Uint8x13 into a bytes13
    function asBytes13(Uint8x13 self) internal pure returns (bytes13) {
        return Uint8x13.unwrap(self);
    }

    function at(Uint8x13 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x13.unwrap(self) << (pos * 8)));
    }

    type Uint48x2 is bytes12;

    /// @dev Cast a bytes12 into a Uint48x2
    function asUint48x2(bytes12 self) internal pure returns (Uint48x2) {
        return Uint48x2.wrap(self);
    }

    /// @dev Cast a Uint48x2 into a bytes12
    function asBytes12(Uint48x2 self) internal pure returns (bytes12) {
        return Uint48x2.unwrap(self);
    }

    function at(Uint48x2 self, uint8 pos) internal pure returns (uint48) {
        return uint48(bytes6(Uint48x2.unwrap(self) << (pos * 48)));
    }

    /// @dev Pack 2 uint48 into a Uint48x2
    function pack(uint48 arg0, uint48 arg1) internal pure returns (Uint48x2) {
        return Uint48x2.wrap((bytes12(bytes6(arg0)) << 48) | bytes12(bytes6(arg1)));
    }

    /// @dev Split a Uint48x2 into 2 uint48
    function split(Uint48x2 self) internal pure returns (uint48, uint48) {
        return (at(self, 0), at(self, 1));
    }

    type Uint32x3 is bytes12;

    /// @dev Cast a bytes12 into a Uint32x3
    function asUint32x3(bytes12 self) internal pure returns (Uint32x3) {
        return Uint32x3.wrap(self);
    }

    /// @dev Cast a Uint32x3 into a bytes12
    function asBytes12(Uint32x3 self) internal pure returns (bytes12) {
        return Uint32x3.unwrap(self);
    }

    function at(Uint32x3 self, uint8 pos) internal pure returns (uint32) {
        return uint32(bytes4(Uint32x3.unwrap(self) << (pos * 32)));
    }

    /// @dev Pack 3 uint32 into a Uint32x3
    function pack(uint32 arg0, uint32 arg1, uint32 arg2) internal pure returns (Uint32x3) {
        return Uint32x3.wrap((bytes12(bytes4(arg0)) << 64) | (bytes12(bytes4(arg1)) << 32) | bytes12(bytes4(arg2)));
    }

    /// @dev Split a Uint32x3 into 3 uint32
    function split(Uint32x3 self) internal pure returns (uint32, uint32, uint32) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint24x4 is bytes12;

    /// @dev Cast a bytes12 into a Uint24x4
    function asUint24x4(bytes12 self) internal pure returns (Uint24x4) {
        return Uint24x4.wrap(self);
    }

    /// @dev Cast a Uint24x4 into a bytes12
    function asBytes12(Uint24x4 self) internal pure returns (bytes12) {
        return Uint24x4.unwrap(self);
    }

    function at(Uint24x4 self, uint8 pos) internal pure returns (uint24) {
        return uint24(bytes3(Uint24x4.unwrap(self) << (pos * 24)));
    }

    /// @dev Pack 4 uint24 into a Uint24x4
    function pack(uint24 arg0, uint24 arg1, uint24 arg2, uint24 arg3) internal pure returns (Uint24x4) {
        return
            Uint24x4.wrap(
                (bytes12(bytes3(arg0)) << 72) |
                    (bytes12(bytes3(arg1)) << 48) |
                    (bytes12(bytes3(arg2)) << 24) |
                    bytes12(bytes3(arg3))
            );
    }

    /// @dev Split a Uint24x4 into 4 uint24
    function split(Uint24x4 self) internal pure returns (uint24, uint24, uint24, uint24) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }

    type Uint16x6 is bytes12;

    /// @dev Cast a bytes12 into a Uint16x6
    function asUint16x6(bytes12 self) internal pure returns (Uint16x6) {
        return Uint16x6.wrap(self);
    }

    /// @dev Cast a Uint16x6 into a bytes12
    function asBytes12(Uint16x6 self) internal pure returns (bytes12) {
        return Uint16x6.unwrap(self);
    }

    function at(Uint16x6 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x6.unwrap(self) << (pos * 16)));
    }

    /// @dev Pack 6 uint16 into a Uint16x6
    function pack(
        uint16 arg0,
        uint16 arg1,
        uint16 arg2,
        uint16 arg3,
        uint16 arg4,
        uint16 arg5
    ) internal pure returns (Uint16x6) {
        return
            Uint16x6.wrap(
                (bytes12(bytes2(arg0)) << 80) |
                    (bytes12(bytes2(arg1)) << 64) |
                    (bytes12(bytes2(arg2)) << 48) |
                    (bytes12(bytes2(arg3)) << 32) |
                    (bytes12(bytes2(arg4)) << 16) |
                    bytes12(bytes2(arg5))
            );
    }

    /// @dev Split a Uint16x6 into 6 uint16
    function split(Uint16x6 self) internal pure returns (uint16, uint16, uint16, uint16, uint16, uint16) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5));
    }

    type Uint8x12 is bytes12;

    /// @dev Cast a bytes12 into a Uint8x12
    function asUint8x12(bytes12 self) internal pure returns (Uint8x12) {
        return Uint8x12.wrap(self);
    }

    /// @dev Cast a Uint8x12 into a bytes12
    function asBytes12(Uint8x12 self) internal pure returns (bytes12) {
        return Uint8x12.unwrap(self);
    }

    function at(Uint8x12 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x12.unwrap(self) << (pos * 8)));
    }

    type Uint8x11 is bytes11;

    /// @dev Cast a bytes11 into a Uint8x11
    function asUint8x11(bytes11 self) internal pure returns (Uint8x11) {
        return Uint8x11.wrap(self);
    }

    /// @dev Cast a Uint8x11 into a bytes11
    function asBytes11(Uint8x11 self) internal pure returns (bytes11) {
        return Uint8x11.unwrap(self);
    }

    function at(Uint8x11 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x11.unwrap(self) << (pos * 8)));
    }

    type Uint40x2 is bytes10;

    /// @dev Cast a bytes10 into a Uint40x2
    function asUint40x2(bytes10 self) internal pure returns (Uint40x2) {
        return Uint40x2.wrap(self);
    }

    /// @dev Cast a Uint40x2 into a bytes10
    function asBytes10(Uint40x2 self) internal pure returns (bytes10) {
        return Uint40x2.unwrap(self);
    }

    function at(Uint40x2 self, uint8 pos) internal pure returns (uint40) {
        return uint40(bytes5(Uint40x2.unwrap(self) << (pos * 40)));
    }

    /// @dev Pack 2 uint40 into a Uint40x2
    function pack(uint40 arg0, uint40 arg1) internal pure returns (Uint40x2) {
        return Uint40x2.wrap((bytes10(bytes5(arg0)) << 40) | bytes10(bytes5(arg1)));
    }

    /// @dev Split a Uint40x2 into 2 uint40
    function split(Uint40x2 self) internal pure returns (uint40, uint40) {
        return (at(self, 0), at(self, 1));
    }

    type Uint16x5 is bytes10;

    /// @dev Cast a bytes10 into a Uint16x5
    function asUint16x5(bytes10 self) internal pure returns (Uint16x5) {
        return Uint16x5.wrap(self);
    }

    /// @dev Cast a Uint16x5 into a bytes10
    function asBytes10(Uint16x5 self) internal pure returns (bytes10) {
        return Uint16x5.unwrap(self);
    }

    function at(Uint16x5 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x5.unwrap(self) << (pos * 16)));
    }

    /// @dev Pack 5 uint16 into a Uint16x5
    function pack(uint16 arg0, uint16 arg1, uint16 arg2, uint16 arg3, uint16 arg4) internal pure returns (Uint16x5) {
        return
            Uint16x5.wrap(
                (bytes10(bytes2(arg0)) << 64) |
                    (bytes10(bytes2(arg1)) << 48) |
                    (bytes10(bytes2(arg2)) << 32) |
                    (bytes10(bytes2(arg3)) << 16) |
                    bytes10(bytes2(arg4))
            );
    }

    /// @dev Split a Uint16x5 into 5 uint16
    function split(Uint16x5 self) internal pure returns (uint16, uint16, uint16, uint16, uint16) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4));
    }

    type Uint8x10 is bytes10;

    /// @dev Cast a bytes10 into a Uint8x10
    function asUint8x10(bytes10 self) internal pure returns (Uint8x10) {
        return Uint8x10.wrap(self);
    }

    /// @dev Cast a Uint8x10 into a bytes10
    function asBytes10(Uint8x10 self) internal pure returns (bytes10) {
        return Uint8x10.unwrap(self);
    }

    function at(Uint8x10 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x10.unwrap(self) << (pos * 8)));
    }

    type Uint24x3 is bytes9;

    /// @dev Cast a bytes9 into a Uint24x3
    function asUint24x3(bytes9 self) internal pure returns (Uint24x3) {
        return Uint24x3.wrap(self);
    }

    /// @dev Cast a Uint24x3 into a bytes9
    function asBytes9(Uint24x3 self) internal pure returns (bytes9) {
        return Uint24x3.unwrap(self);
    }

    function at(Uint24x3 self, uint8 pos) internal pure returns (uint24) {
        return uint24(bytes3(Uint24x3.unwrap(self) << (pos * 24)));
    }

    /// @dev Pack 3 uint24 into a Uint24x3
    function pack(uint24 arg0, uint24 arg1, uint24 arg2) internal pure returns (Uint24x3) {
        return Uint24x3.wrap((bytes9(bytes3(arg0)) << 48) | (bytes9(bytes3(arg1)) << 24) | bytes9(bytes3(arg2)));
    }

    /// @dev Split a Uint24x3 into 3 uint24
    function split(Uint24x3 self) internal pure returns (uint24, uint24, uint24) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint8x9 is bytes9;

    /// @dev Cast a bytes9 into a Uint8x9
    function asUint8x9(bytes9 self) internal pure returns (Uint8x9) {
        return Uint8x9.wrap(self);
    }

    /// @dev Cast a Uint8x9 into a bytes9
    function asBytes9(Uint8x9 self) internal pure returns (bytes9) {
        return Uint8x9.unwrap(self);
    }

    function at(Uint8x9 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x9.unwrap(self) << (pos * 8)));
    }

    type Uint32x2 is bytes8;

    /// @dev Cast a bytes8 into a Uint32x2
    function asUint32x2(bytes8 self) internal pure returns (Uint32x2) {
        return Uint32x2.wrap(self);
    }

    /// @dev Cast a Uint32x2 into a bytes8
    function asBytes8(Uint32x2 self) internal pure returns (bytes8) {
        return Uint32x2.unwrap(self);
    }

    function at(Uint32x2 self, uint8 pos) internal pure returns (uint32) {
        return uint32(bytes4(Uint32x2.unwrap(self) << (pos * 32)));
    }

    /// @dev Pack 2 uint32 into a Uint32x2
    function pack(uint32 arg0, uint32 arg1) internal pure returns (Uint32x2) {
        return Uint32x2.wrap((bytes8(bytes4(arg0)) << 32) | bytes8(bytes4(arg1)));
    }

    /// @dev Split a Uint32x2 into 2 uint32
    function split(Uint32x2 self) internal pure returns (uint32, uint32) {
        return (at(self, 0), at(self, 1));
    }

    type Uint16x4 is bytes8;

    /// @dev Cast a bytes8 into a Uint16x4
    function asUint16x4(bytes8 self) internal pure returns (Uint16x4) {
        return Uint16x4.wrap(self);
    }

    /// @dev Cast a Uint16x4 into a bytes8
    function asBytes8(Uint16x4 self) internal pure returns (bytes8) {
        return Uint16x4.unwrap(self);
    }

    function at(Uint16x4 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x4.unwrap(self) << (pos * 16)));
    }

    /// @dev Pack 4 uint16 into a Uint16x4
    function pack(uint16 arg0, uint16 arg1, uint16 arg2, uint16 arg3) internal pure returns (Uint16x4) {
        return
            Uint16x4.wrap(
                (bytes8(bytes2(arg0)) << 48) |
                    (bytes8(bytes2(arg1)) << 32) |
                    (bytes8(bytes2(arg2)) << 16) |
                    bytes8(bytes2(arg3))
            );
    }

    /// @dev Split a Uint16x4 into 4 uint16
    function split(Uint16x4 self) internal pure returns (uint16, uint16, uint16, uint16) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }

    type Uint8x8 is bytes8;

    /// @dev Cast a bytes8 into a Uint8x8
    function asUint8x8(bytes8 self) internal pure returns (Uint8x8) {
        return Uint8x8.wrap(self);
    }

    /// @dev Cast a Uint8x8 into a bytes8
    function asBytes8(Uint8x8 self) internal pure returns (bytes8) {
        return Uint8x8.unwrap(self);
    }

    function at(Uint8x8 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x8.unwrap(self) << (pos * 8)));
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
    ) internal pure returns (Uint8x8) {
        return
            Uint8x8.wrap(
                (bytes8(bytes1(arg0)) << 56) |
                    (bytes8(bytes1(arg1)) << 48) |
                    (bytes8(bytes1(arg2)) << 40) |
                    (bytes8(bytes1(arg3)) << 32) |
                    (bytes8(bytes1(arg4)) << 24) |
                    (bytes8(bytes1(arg5)) << 16) |
                    (bytes8(bytes1(arg6)) << 8) |
                    bytes8(bytes1(arg7))
            );
    }

    /// @dev Split a Uint8x8 into 8 uint8
    function split(Uint8x8 self) internal pure returns (uint8, uint8, uint8, uint8, uint8, uint8, uint8, uint8) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5), at(self, 6), at(self, 7));
    }

    type Uint8x7 is bytes7;

    /// @dev Cast a bytes7 into a Uint8x7
    function asUint8x7(bytes7 self) internal pure returns (Uint8x7) {
        return Uint8x7.wrap(self);
    }

    /// @dev Cast a Uint8x7 into a bytes7
    function asBytes7(Uint8x7 self) internal pure returns (bytes7) {
        return Uint8x7.unwrap(self);
    }

    function at(Uint8x7 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x7.unwrap(self) << (pos * 8)));
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
    ) internal pure returns (Uint8x7) {
        return
            Uint8x7.wrap(
                (bytes7(bytes1(arg0)) << 48) |
                    (bytes7(bytes1(arg1)) << 40) |
                    (bytes7(bytes1(arg2)) << 32) |
                    (bytes7(bytes1(arg3)) << 24) |
                    (bytes7(bytes1(arg4)) << 16) |
                    (bytes7(bytes1(arg5)) << 8) |
                    bytes7(bytes1(arg6))
            );
    }

    /// @dev Split a Uint8x7 into 7 uint8
    function split(Uint8x7 self) internal pure returns (uint8, uint8, uint8, uint8, uint8, uint8, uint8) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5), at(self, 6));
    }

    type Uint24x2 is bytes6;

    /// @dev Cast a bytes6 into a Uint24x2
    function asUint24x2(bytes6 self) internal pure returns (Uint24x2) {
        return Uint24x2.wrap(self);
    }

    /// @dev Cast a Uint24x2 into a bytes6
    function asBytes6(Uint24x2 self) internal pure returns (bytes6) {
        return Uint24x2.unwrap(self);
    }

    function at(Uint24x2 self, uint8 pos) internal pure returns (uint24) {
        return uint24(bytes3(Uint24x2.unwrap(self) << (pos * 24)));
    }

    /// @dev Pack 2 uint24 into a Uint24x2
    function pack(uint24 arg0, uint24 arg1) internal pure returns (Uint24x2) {
        return Uint24x2.wrap((bytes6(bytes3(arg0)) << 24) | bytes6(bytes3(arg1)));
    }

    /// @dev Split a Uint24x2 into 2 uint24
    function split(Uint24x2 self) internal pure returns (uint24, uint24) {
        return (at(self, 0), at(self, 1));
    }

    type Uint16x3 is bytes6;

    /// @dev Cast a bytes6 into a Uint16x3
    function asUint16x3(bytes6 self) internal pure returns (Uint16x3) {
        return Uint16x3.wrap(self);
    }

    /// @dev Cast a Uint16x3 into a bytes6
    function asBytes6(Uint16x3 self) internal pure returns (bytes6) {
        return Uint16x3.unwrap(self);
    }

    function at(Uint16x3 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x3.unwrap(self) << (pos * 16)));
    }

    /// @dev Pack 3 uint16 into a Uint16x3
    function pack(uint16 arg0, uint16 arg1, uint16 arg2) internal pure returns (Uint16x3) {
        return Uint16x3.wrap((bytes6(bytes2(arg0)) << 32) | (bytes6(bytes2(arg1)) << 16) | bytes6(bytes2(arg2)));
    }

    /// @dev Split a Uint16x3 into 3 uint16
    function split(Uint16x3 self) internal pure returns (uint16, uint16, uint16) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint8x6 is bytes6;

    /// @dev Cast a bytes6 into a Uint8x6
    function asUint8x6(bytes6 self) internal pure returns (Uint8x6) {
        return Uint8x6.wrap(self);
    }

    /// @dev Cast a Uint8x6 into a bytes6
    function asBytes6(Uint8x6 self) internal pure returns (bytes6) {
        return Uint8x6.unwrap(self);
    }

    function at(Uint8x6 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x6.unwrap(self) << (pos * 8)));
    }

    /// @dev Pack 6 uint8 into a Uint8x6
    function pack(
        uint8 arg0,
        uint8 arg1,
        uint8 arg2,
        uint8 arg3,
        uint8 arg4,
        uint8 arg5
    ) internal pure returns (Uint8x6) {
        return
            Uint8x6.wrap(
                (bytes6(bytes1(arg0)) << 40) |
                    (bytes6(bytes1(arg1)) << 32) |
                    (bytes6(bytes1(arg2)) << 24) |
                    (bytes6(bytes1(arg3)) << 16) |
                    (bytes6(bytes1(arg4)) << 8) |
                    bytes6(bytes1(arg5))
            );
    }

    /// @dev Split a Uint8x6 into 6 uint8
    function split(Uint8x6 self) internal pure returns (uint8, uint8, uint8, uint8, uint8, uint8) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4), at(self, 5));
    }

    type Uint8x5 is bytes5;

    /// @dev Cast a bytes5 into a Uint8x5
    function asUint8x5(bytes5 self) internal pure returns (Uint8x5) {
        return Uint8x5.wrap(self);
    }

    /// @dev Cast a Uint8x5 into a bytes5
    function asBytes5(Uint8x5 self) internal pure returns (bytes5) {
        return Uint8x5.unwrap(self);
    }

    function at(Uint8x5 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x5.unwrap(self) << (pos * 8)));
    }

    /// @dev Pack 5 uint8 into a Uint8x5
    function pack(uint8 arg0, uint8 arg1, uint8 arg2, uint8 arg3, uint8 arg4) internal pure returns (Uint8x5) {
        return
            Uint8x5.wrap(
                (bytes5(bytes1(arg0)) << 32) |
                    (bytes5(bytes1(arg1)) << 24) |
                    (bytes5(bytes1(arg2)) << 16) |
                    (bytes5(bytes1(arg3)) << 8) |
                    bytes5(bytes1(arg4))
            );
    }

    /// @dev Split a Uint8x5 into 5 uint8
    function split(Uint8x5 self) internal pure returns (uint8, uint8, uint8, uint8, uint8) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3), at(self, 4));
    }

    type Uint16x2 is bytes4;

    /// @dev Cast a bytes4 into a Uint16x2
    function asUint16x2(bytes4 self) internal pure returns (Uint16x2) {
        return Uint16x2.wrap(self);
    }

    /// @dev Cast a Uint16x2 into a bytes4
    function asBytes4(Uint16x2 self) internal pure returns (bytes4) {
        return Uint16x2.unwrap(self);
    }

    function at(Uint16x2 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(Uint16x2.unwrap(self) << (pos * 16)));
    }

    /// @dev Pack 2 uint16 into a Uint16x2
    function pack(uint16 arg0, uint16 arg1) internal pure returns (Uint16x2) {
        return Uint16x2.wrap((bytes4(bytes2(arg0)) << 16) | bytes4(bytes2(arg1)));
    }

    /// @dev Split a Uint16x2 into 2 uint16
    function split(Uint16x2 self) internal pure returns (uint16, uint16) {
        return (at(self, 0), at(self, 1));
    }

    type Uint8x4 is bytes4;

    /// @dev Cast a bytes4 into a Uint8x4
    function asUint8x4(bytes4 self) internal pure returns (Uint8x4) {
        return Uint8x4.wrap(self);
    }

    /// @dev Cast a Uint8x4 into a bytes4
    function asBytes4(Uint8x4 self) internal pure returns (bytes4) {
        return Uint8x4.unwrap(self);
    }

    function at(Uint8x4 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x4.unwrap(self) << (pos * 8)));
    }

    /// @dev Pack 4 uint8 into a Uint8x4
    function pack(uint8 arg0, uint8 arg1, uint8 arg2, uint8 arg3) internal pure returns (Uint8x4) {
        return
            Uint8x4.wrap(
                (bytes4(bytes1(arg0)) << 24) |
                    (bytes4(bytes1(arg1)) << 16) |
                    (bytes4(bytes1(arg2)) << 8) |
                    bytes4(bytes1(arg3))
            );
    }

    /// @dev Split a Uint8x4 into 4 uint8
    function split(Uint8x4 self) internal pure returns (uint8, uint8, uint8, uint8) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }

    type Uint8x3 is bytes3;

    /// @dev Cast a bytes3 into a Uint8x3
    function asUint8x3(bytes3 self) internal pure returns (Uint8x3) {
        return Uint8x3.wrap(self);
    }

    /// @dev Cast a Uint8x3 into a bytes3
    function asBytes3(Uint8x3 self) internal pure returns (bytes3) {
        return Uint8x3.unwrap(self);
    }

    function at(Uint8x3 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x3.unwrap(self) << (pos * 8)));
    }

    /// @dev Pack 3 uint8 into a Uint8x3
    function pack(uint8 arg0, uint8 arg1, uint8 arg2) internal pure returns (Uint8x3) {
        return Uint8x3.wrap((bytes3(bytes1(arg0)) << 16) | (bytes3(bytes1(arg1)) << 8) | bytes3(bytes1(arg2)));
    }

    /// @dev Split a Uint8x3 into 3 uint8
    function split(Uint8x3 self) internal pure returns (uint8, uint8, uint8) {
        return (at(self, 0), at(self, 1), at(self, 2));
    }

    type Uint8x2 is bytes2;

    /// @dev Cast a bytes2 into a Uint8x2
    function asUint8x2(bytes2 self) internal pure returns (Uint8x2) {
        return Uint8x2.wrap(self);
    }

    /// @dev Cast a Uint8x2 into a bytes2
    function asBytes2(Uint8x2 self) internal pure returns (bytes2) {
        return Uint8x2.unwrap(self);
    }

    function at(Uint8x2 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(Uint8x2.unwrap(self) << (pos * 8)));
    }

    /// @dev Pack 2 uint8 into a Uint8x2
    function pack(uint8 arg0, uint8 arg1) internal pure returns (Uint8x2) {
        return Uint8x2.wrap((bytes2(bytes1(arg0)) << 8) | bytes2(bytes1(arg1)));
    }

    /// @dev Split a Uint8x2 into 2 uint8
    function split(Uint8x2 self) internal pure returns (uint8, uint8) {
        return (at(self, 0), at(self, 1));
    }
}
