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

    type PackedBytes3 is bytes3;

    function asPackedBytes3(bytes3 self) internal pure returns (PackedBytes3) {
        return PackedBytes3.wrap(self);
    }

    function asPackedBytes3(uint24 self) internal pure returns (PackedBytes3) {
        return PackedBytes3.wrap(bytes3(self));
    }

    function asBytes3(PackedBytes3 self) internal pure returns (bytes3) {
        return PackedBytes3.unwrap(self);
    }

    function asUint24(PackedBytes3 self) internal pure returns (uint24) {
        return uint24(PackedBytes3.unwrap(self));
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

    type PackedBytes5 is bytes5;

    function asPackedBytes5(bytes5 self) internal pure returns (PackedBytes5) {
        return PackedBytes5.wrap(self);
    }

    function asPackedBytes5(uint40 self) internal pure returns (PackedBytes5) {
        return PackedBytes5.wrap(bytes5(self));
    }

    function asBytes5(PackedBytes5 self) internal pure returns (bytes5) {
        return PackedBytes5.unwrap(self);
    }

    function asUint40(PackedBytes5 self) internal pure returns (uint40) {
        return uint40(PackedBytes5.unwrap(self));
    }

    type PackedBytes6 is bytes6;

    function asPackedBytes6(bytes6 self) internal pure returns (PackedBytes6) {
        return PackedBytes6.wrap(self);
    }

    function asPackedBytes6(uint48 self) internal pure returns (PackedBytes6) {
        return PackedBytes6.wrap(bytes6(self));
    }

    function asBytes6(PackedBytes6 self) internal pure returns (bytes6) {
        return PackedBytes6.unwrap(self);
    }

    function asUint48(PackedBytes6 self) internal pure returns (uint48) {
        return uint48(PackedBytes6.unwrap(self));
    }

    type PackedBytes7 is bytes7;

    function asPackedBytes7(bytes7 self) internal pure returns (PackedBytes7) {
        return PackedBytes7.wrap(self);
    }

    function asPackedBytes7(uint56 self) internal pure returns (PackedBytes7) {
        return PackedBytes7.wrap(bytes7(self));
    }

    function asBytes7(PackedBytes7 self) internal pure returns (bytes7) {
        return PackedBytes7.unwrap(self);
    }

    function asUint56(PackedBytes7 self) internal pure returns (uint56) {
        return uint56(PackedBytes7.unwrap(self));
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

    type PackedBytes9 is bytes9;

    function asPackedBytes9(bytes9 self) internal pure returns (PackedBytes9) {
        return PackedBytes9.wrap(self);
    }

    function asPackedBytes9(uint72 self) internal pure returns (PackedBytes9) {
        return PackedBytes9.wrap(bytes9(self));
    }

    function asBytes9(PackedBytes9 self) internal pure returns (bytes9) {
        return PackedBytes9.unwrap(self);
    }

    function asUint72(PackedBytes9 self) internal pure returns (uint72) {
        return uint72(PackedBytes9.unwrap(self));
    }

    type PackedBytes10 is bytes10;

    function asPackedBytes10(bytes10 self) internal pure returns (PackedBytes10) {
        return PackedBytes10.wrap(self);
    }

    function asPackedBytes10(uint80 self) internal pure returns (PackedBytes10) {
        return PackedBytes10.wrap(bytes10(self));
    }

    function asBytes10(PackedBytes10 self) internal pure returns (bytes10) {
        return PackedBytes10.unwrap(self);
    }

    function asUint80(PackedBytes10 self) internal pure returns (uint80) {
        return uint80(PackedBytes10.unwrap(self));
    }

    type PackedBytes11 is bytes11;

    function asPackedBytes11(bytes11 self) internal pure returns (PackedBytes11) {
        return PackedBytes11.wrap(self);
    }

    function asPackedBytes11(uint88 self) internal pure returns (PackedBytes11) {
        return PackedBytes11.wrap(bytes11(self));
    }

    function asBytes11(PackedBytes11 self) internal pure returns (bytes11) {
        return PackedBytes11.unwrap(self);
    }

    function asUint88(PackedBytes11 self) internal pure returns (uint88) {
        return uint88(PackedBytes11.unwrap(self));
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

    type PackedBytes13 is bytes13;

    function asPackedBytes13(bytes13 self) internal pure returns (PackedBytes13) {
        return PackedBytes13.wrap(self);
    }

    function asPackedBytes13(uint104 self) internal pure returns (PackedBytes13) {
        return PackedBytes13.wrap(bytes13(self));
    }

    function asBytes13(PackedBytes13 self) internal pure returns (bytes13) {
        return PackedBytes13.unwrap(self);
    }

    function asUint104(PackedBytes13 self) internal pure returns (uint104) {
        return uint104(PackedBytes13.unwrap(self));
    }

    type PackedBytes14 is bytes14;

    function asPackedBytes14(bytes14 self) internal pure returns (PackedBytes14) {
        return PackedBytes14.wrap(self);
    }

    function asPackedBytes14(uint112 self) internal pure returns (PackedBytes14) {
        return PackedBytes14.wrap(bytes14(self));
    }

    function asBytes14(PackedBytes14 self) internal pure returns (bytes14) {
        return PackedBytes14.unwrap(self);
    }

    function asUint112(PackedBytes14 self) internal pure returns (uint112) {
        return uint112(PackedBytes14.unwrap(self));
    }

    type PackedBytes15 is bytes15;

    function asPackedBytes15(bytes15 self) internal pure returns (PackedBytes15) {
        return PackedBytes15.wrap(self);
    }

    function asPackedBytes15(uint120 self) internal pure returns (PackedBytes15) {
        return PackedBytes15.wrap(bytes15(self));
    }

    function asBytes15(PackedBytes15 self) internal pure returns (bytes15) {
        return PackedBytes15.unwrap(self);
    }

    function asUint120(PackedBytes15 self) internal pure returns (uint120) {
        return uint120(PackedBytes15.unwrap(self));
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

    type PackedBytes17 is bytes17;

    function asPackedBytes17(bytes17 self) internal pure returns (PackedBytes17) {
        return PackedBytes17.wrap(self);
    }

    function asPackedBytes17(uint136 self) internal pure returns (PackedBytes17) {
        return PackedBytes17.wrap(bytes17(self));
    }

    function asBytes17(PackedBytes17 self) internal pure returns (bytes17) {
        return PackedBytes17.unwrap(self);
    }

    function asUint136(PackedBytes17 self) internal pure returns (uint136) {
        return uint136(PackedBytes17.unwrap(self));
    }

    type PackedBytes18 is bytes18;

    function asPackedBytes18(bytes18 self) internal pure returns (PackedBytes18) {
        return PackedBytes18.wrap(self);
    }

    function asPackedBytes18(uint144 self) internal pure returns (PackedBytes18) {
        return PackedBytes18.wrap(bytes18(self));
    }

    function asBytes18(PackedBytes18 self) internal pure returns (bytes18) {
        return PackedBytes18.unwrap(self);
    }

    function asUint144(PackedBytes18 self) internal pure returns (uint144) {
        return uint144(PackedBytes18.unwrap(self));
    }

    type PackedBytes19 is bytes19;

    function asPackedBytes19(bytes19 self) internal pure returns (PackedBytes19) {
        return PackedBytes19.wrap(self);
    }

    function asPackedBytes19(uint152 self) internal pure returns (PackedBytes19) {
        return PackedBytes19.wrap(bytes19(self));
    }

    function asBytes19(PackedBytes19 self) internal pure returns (bytes19) {
        return PackedBytes19.unwrap(self);
    }

    function asUint152(PackedBytes19 self) internal pure returns (uint152) {
        return uint152(PackedBytes19.unwrap(self));
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

    type PackedBytes21 is bytes21;

    function asPackedBytes21(bytes21 self) internal pure returns (PackedBytes21) {
        return PackedBytes21.wrap(self);
    }

    function asPackedBytes21(uint168 self) internal pure returns (PackedBytes21) {
        return PackedBytes21.wrap(bytes21(self));
    }

    function asBytes21(PackedBytes21 self) internal pure returns (bytes21) {
        return PackedBytes21.unwrap(self);
    }

    function asUint168(PackedBytes21 self) internal pure returns (uint168) {
        return uint168(PackedBytes21.unwrap(self));
    }

    type PackedBytes22 is bytes22;

    function asPackedBytes22(bytes22 self) internal pure returns (PackedBytes22) {
        return PackedBytes22.wrap(self);
    }

    function asPackedBytes22(uint176 self) internal pure returns (PackedBytes22) {
        return PackedBytes22.wrap(bytes22(self));
    }

    function asBytes22(PackedBytes22 self) internal pure returns (bytes22) {
        return PackedBytes22.unwrap(self);
    }

    function asUint176(PackedBytes22 self) internal pure returns (uint176) {
        return uint176(PackedBytes22.unwrap(self));
    }

    type PackedBytes23 is bytes23;

    function asPackedBytes23(bytes23 self) internal pure returns (PackedBytes23) {
        return PackedBytes23.wrap(self);
    }

    function asPackedBytes23(uint184 self) internal pure returns (PackedBytes23) {
        return PackedBytes23.wrap(bytes23(self));
    }

    function asBytes23(PackedBytes23 self) internal pure returns (bytes23) {
        return PackedBytes23.unwrap(self);
    }

    function asUint184(PackedBytes23 self) internal pure returns (uint184) {
        return uint184(PackedBytes23.unwrap(self));
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

    type PackedBytes25 is bytes25;

    function asPackedBytes25(bytes25 self) internal pure returns (PackedBytes25) {
        return PackedBytes25.wrap(self);
    }

    function asPackedBytes25(uint200 self) internal pure returns (PackedBytes25) {
        return PackedBytes25.wrap(bytes25(self));
    }

    function asBytes25(PackedBytes25 self) internal pure returns (bytes25) {
        return PackedBytes25.unwrap(self);
    }

    function asUint200(PackedBytes25 self) internal pure returns (uint200) {
        return uint200(PackedBytes25.unwrap(self));
    }

    type PackedBytes26 is bytes26;

    function asPackedBytes26(bytes26 self) internal pure returns (PackedBytes26) {
        return PackedBytes26.wrap(self);
    }

    function asPackedBytes26(uint208 self) internal pure returns (PackedBytes26) {
        return PackedBytes26.wrap(bytes26(self));
    }

    function asBytes26(PackedBytes26 self) internal pure returns (bytes26) {
        return PackedBytes26.unwrap(self);
    }

    function asUint208(PackedBytes26 self) internal pure returns (uint208) {
        return uint208(PackedBytes26.unwrap(self));
    }

    type PackedBytes27 is bytes27;

    function asPackedBytes27(bytes27 self) internal pure returns (PackedBytes27) {
        return PackedBytes27.wrap(self);
    }

    function asPackedBytes27(uint216 self) internal pure returns (PackedBytes27) {
        return PackedBytes27.wrap(bytes27(self));
    }

    function asBytes27(PackedBytes27 self) internal pure returns (bytes27) {
        return PackedBytes27.unwrap(self);
    }

    function asUint216(PackedBytes27 self) internal pure returns (uint216) {
        return uint216(PackedBytes27.unwrap(self));
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

    type PackedBytes29 is bytes29;

    function asPackedBytes29(bytes29 self) internal pure returns (PackedBytes29) {
        return PackedBytes29.wrap(self);
    }

    function asPackedBytes29(uint232 self) internal pure returns (PackedBytes29) {
        return PackedBytes29.wrap(bytes29(self));
    }

    function asBytes29(PackedBytes29 self) internal pure returns (bytes29) {
        return PackedBytes29.unwrap(self);
    }

    function asUint232(PackedBytes29 self) internal pure returns (uint232) {
        return uint232(PackedBytes29.unwrap(self));
    }

    type PackedBytes30 is bytes30;

    function asPackedBytes30(bytes30 self) internal pure returns (PackedBytes30) {
        return PackedBytes30.wrap(self);
    }

    function asPackedBytes30(uint240 self) internal pure returns (PackedBytes30) {
        return PackedBytes30.wrap(bytes30(self));
    }

    function asBytes30(PackedBytes30 self) internal pure returns (bytes30) {
        return PackedBytes30.unwrap(self);
    }

    function asUint240(PackedBytes30 self) internal pure returns (uint240) {
        return uint240(PackedBytes30.unwrap(self));
    }

    type PackedBytes31 is bytes31;

    function asPackedBytes31(bytes31 self) internal pure returns (PackedBytes31) {
        return PackedBytes31.wrap(self);
    }

    function asPackedBytes31(uint248 self) internal pure returns (PackedBytes31) {
        return PackedBytes31.wrap(bytes31(self));
    }

    function asBytes31(PackedBytes31 self) internal pure returns (bytes31) {
        return PackedBytes31.unwrap(self);
    }

    function asUint248(PackedBytes31 self) internal pure returns (uint248) {
        return uint248(PackedBytes31.unwrap(self));
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

    function pack(PackedBytes1 left, PackedBytes1 right) internal pure returns (PackedBytes2 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes2 right) internal pure returns (PackedBytes3 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes3 right) internal pure returns (PackedBytes4 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes4 right) internal pure returns (PackedBytes5 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes5 right) internal pure returns (PackedBytes6 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes6 right) internal pure returns (PackedBytes7 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes7 right) internal pure returns (PackedBytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes8 right) internal pure returns (PackedBytes9 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes9 right) internal pure returns (PackedBytes10 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes10 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes11 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes12 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes13 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes14 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes15 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes16 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes17 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes18 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes19 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes20 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes21 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes22 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes23 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes24 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes25 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes26 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes27 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes28 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes29 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes30 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes1 left, PackedBytes31 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(8, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes1 right) internal pure returns (PackedBytes3 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes2 right) internal pure returns (PackedBytes4 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes3 right) internal pure returns (PackedBytes5 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes4 right) internal pure returns (PackedBytes6 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes5 right) internal pure returns (PackedBytes7 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes6 right) internal pure returns (PackedBytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes7 right) internal pure returns (PackedBytes9 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes8 right) internal pure returns (PackedBytes10 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes9 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes10 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes11 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes12 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes13 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes14 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes15 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes16 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes17 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes18 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes19 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes20 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes21 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes22 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes23 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes24 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes25 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes26 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes27 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes28 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes29 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes2 left, PackedBytes30 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(16, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes1 right) internal pure returns (PackedBytes4 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes2 right) internal pure returns (PackedBytes5 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes3 right) internal pure returns (PackedBytes6 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes4 right) internal pure returns (PackedBytes7 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes5 right) internal pure returns (PackedBytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes6 right) internal pure returns (PackedBytes9 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes7 right) internal pure returns (PackedBytes10 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes8 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes9 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes10 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes11 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes12 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes13 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes14 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes15 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes16 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes17 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes18 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes19 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes20 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes21 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes22 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes23 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes24 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes25 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes26 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes27 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes28 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes3 left, PackedBytes29 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(24, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes1 right) internal pure returns (PackedBytes5 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes2 right) internal pure returns (PackedBytes6 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes3 right) internal pure returns (PackedBytes7 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes4 right) internal pure returns (PackedBytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes5 right) internal pure returns (PackedBytes9 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes6 right) internal pure returns (PackedBytes10 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes7 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes8 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes9 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes10 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes11 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes12 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes13 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes14 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes15 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes16 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes17 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes18 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes19 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes20 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes21 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes22 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes23 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes24 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes25 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes26 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes27 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes4 left, PackedBytes28 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(32, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes1 right) internal pure returns (PackedBytes6 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes2 right) internal pure returns (PackedBytes7 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes3 right) internal pure returns (PackedBytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes4 right) internal pure returns (PackedBytes9 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes5 right) internal pure returns (PackedBytes10 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes6 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes7 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes8 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes9 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes10 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes11 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes12 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes13 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes14 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes15 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes16 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes17 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes18 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes19 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes20 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes21 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes22 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes23 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes24 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes25 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes26 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes5 left, PackedBytes27 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(40, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes1 right) internal pure returns (PackedBytes7 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes2 right) internal pure returns (PackedBytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes3 right) internal pure returns (PackedBytes9 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes4 right) internal pure returns (PackedBytes10 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes5 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes6 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes7 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes8 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes9 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes10 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes11 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes12 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes13 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes14 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes15 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes16 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes17 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes18 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes19 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes20 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes21 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes22 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes23 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes24 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes25 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes6 left, PackedBytes26 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(48, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes1 right) internal pure returns (PackedBytes8 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes2 right) internal pure returns (PackedBytes9 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes3 right) internal pure returns (PackedBytes10 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes4 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes5 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes6 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes7 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes8 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes9 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes10 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes11 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes12 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes13 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes14 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes15 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes16 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes17 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes18 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes19 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes20 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes21 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes22 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes23 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes24 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes7 left, PackedBytes25 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(56, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes1 right) internal pure returns (PackedBytes9 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes2 right) internal pure returns (PackedBytes10 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes3 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes4 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes5 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes6 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes7 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes8 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes9 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes10 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes11 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes12 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes13 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes14 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes15 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes16 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes17 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes18 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes19 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes20 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes21 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes22 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes23 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes8 left, PackedBytes24 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(64, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes1 right) internal pure returns (PackedBytes10 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes2 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes3 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes4 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes5 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes6 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes7 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes8 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes9 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes10 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes11 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes12 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes13 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes14 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes15 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes16 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes17 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes18 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes19 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes20 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes21 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes22 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes9 left, PackedBytes23 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(72, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes1 right) internal pure returns (PackedBytes11 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes2 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes3 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes4 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes5 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes6 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes7 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes8 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes9 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes10 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes11 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes12 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes13 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes14 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes15 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes16 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes17 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes18 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes19 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes20 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes21 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes10 left, PackedBytes22 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(80, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes1 right) internal pure returns (PackedBytes12 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes2 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes3 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes4 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes5 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes6 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes7 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes8 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes9 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes10 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes11 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes12 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes13 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes14 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes15 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes16 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes17 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes18 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes19 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes20 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes11 left, PackedBytes21 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(88, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes1 right) internal pure returns (PackedBytes13 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes2 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes3 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes4 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes5 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes6 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes7 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes8 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes9 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes10 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes11 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes12 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes13 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes14 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes15 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes16 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes17 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes18 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes19 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes12 left, PackedBytes20 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(96, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes1 right) internal pure returns (PackedBytes14 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes2 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes3 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes4 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes5 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes6 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes7 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes8 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes9 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes10 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes11 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes12 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes13 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes14 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes15 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes16 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes17 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes18 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes13 left, PackedBytes19 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(104, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes1 right) internal pure returns (PackedBytes15 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes2 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes3 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes4 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes5 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes6 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes7 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes8 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes9 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes10 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes11 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes12 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes13 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes14 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes15 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes16 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes17 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes14 left, PackedBytes18 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(112, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes1 right) internal pure returns (PackedBytes16 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes2 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes3 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes4 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes5 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes6 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes7 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes8 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes9 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes10 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes11 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes12 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes13 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes14 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes15 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes16 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes15 left, PackedBytes17 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(120, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes1 right) internal pure returns (PackedBytes17 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes2 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes3 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes4 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes5 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes6 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes7 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes8 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes9 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes10 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes11 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes12 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes13 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes14 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes15 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes16 left, PackedBytes16 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(128, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes1 right) internal pure returns (PackedBytes18 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes2 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes3 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes4 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes5 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes6 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes7 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes8 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes9 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes10 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes11 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes12 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes13 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes14 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes17 left, PackedBytes15 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(136, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes1 right) internal pure returns (PackedBytes19 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes2 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes3 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes4 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes5 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes6 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes7 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes8 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes9 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes10 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes11 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes12 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes13 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes18 left, PackedBytes14 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(144, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes1 right) internal pure returns (PackedBytes20 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes2 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes3 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes4 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes5 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes6 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes7 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes8 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes9 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes10 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes11 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes12 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes19 left, PackedBytes13 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(152, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes1 right) internal pure returns (PackedBytes21 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes2 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes3 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes4 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes5 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes6 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes7 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes8 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes9 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes10 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes11 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes20 left, PackedBytes12 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(160, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes1 right) internal pure returns (PackedBytes22 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes2 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes3 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes4 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes5 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes6 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes7 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes8 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes9 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes10 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes21 left, PackedBytes11 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(168, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes1 right) internal pure returns (PackedBytes23 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes2 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes3 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes4 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes5 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes6 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes7 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes8 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes9 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes22 left, PackedBytes10 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(176, right))
        }
    }

    function pack(PackedBytes23 left, PackedBytes1 right) internal pure returns (PackedBytes24 result) {
        assembly ("memory-safe") {
            result := or(left, shr(184, right))
        }
    }

    function pack(PackedBytes23 left, PackedBytes2 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(184, right))
        }
    }

    function pack(PackedBytes23 left, PackedBytes3 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(184, right))
        }
    }

    function pack(PackedBytes23 left, PackedBytes4 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(184, right))
        }
    }

    function pack(PackedBytes23 left, PackedBytes5 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(184, right))
        }
    }

    function pack(PackedBytes23 left, PackedBytes6 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(184, right))
        }
    }

    function pack(PackedBytes23 left, PackedBytes7 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(184, right))
        }
    }

    function pack(PackedBytes23 left, PackedBytes8 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(184, right))
        }
    }

    function pack(PackedBytes23 left, PackedBytes9 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(184, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes1 right) internal pure returns (PackedBytes25 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes2 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes3 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes4 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes5 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes6 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes7 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes24 left, PackedBytes8 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(192, right))
        }
    }

    function pack(PackedBytes25 left, PackedBytes1 right) internal pure returns (PackedBytes26 result) {
        assembly ("memory-safe") {
            result := or(left, shr(200, right))
        }
    }

    function pack(PackedBytes25 left, PackedBytes2 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(200, right))
        }
    }

    function pack(PackedBytes25 left, PackedBytes3 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(200, right))
        }
    }

    function pack(PackedBytes25 left, PackedBytes4 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(200, right))
        }
    }

    function pack(PackedBytes25 left, PackedBytes5 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(200, right))
        }
    }

    function pack(PackedBytes25 left, PackedBytes6 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(200, right))
        }
    }

    function pack(PackedBytes25 left, PackedBytes7 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(200, right))
        }
    }

    function pack(PackedBytes26 left, PackedBytes1 right) internal pure returns (PackedBytes27 result) {
        assembly ("memory-safe") {
            result := or(left, shr(208, right))
        }
    }

    function pack(PackedBytes26 left, PackedBytes2 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(208, right))
        }
    }

    function pack(PackedBytes26 left, PackedBytes3 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(208, right))
        }
    }

    function pack(PackedBytes26 left, PackedBytes4 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(208, right))
        }
    }

    function pack(PackedBytes26 left, PackedBytes5 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(208, right))
        }
    }

    function pack(PackedBytes26 left, PackedBytes6 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(208, right))
        }
    }

    function pack(PackedBytes27 left, PackedBytes1 right) internal pure returns (PackedBytes28 result) {
        assembly ("memory-safe") {
            result := or(left, shr(216, right))
        }
    }

    function pack(PackedBytes27 left, PackedBytes2 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(216, right))
        }
    }

    function pack(PackedBytes27 left, PackedBytes3 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(216, right))
        }
    }

    function pack(PackedBytes27 left, PackedBytes4 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(216, right))
        }
    }

    function pack(PackedBytes27 left, PackedBytes5 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(216, right))
        }
    }

    function pack(PackedBytes28 left, PackedBytes1 right) internal pure returns (PackedBytes29 result) {
        assembly ("memory-safe") {
            result := or(left, shr(224, right))
        }
    }

    function pack(PackedBytes28 left, PackedBytes2 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(224, right))
        }
    }

    function pack(PackedBytes28 left, PackedBytes3 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(224, right))
        }
    }

    function pack(PackedBytes28 left, PackedBytes4 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(224, right))
        }
    }

    function pack(PackedBytes29 left, PackedBytes1 right) internal pure returns (PackedBytes30 result) {
        assembly ("memory-safe") {
            result := or(left, shr(232, right))
        }
    }

    function pack(PackedBytes29 left, PackedBytes2 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(232, right))
        }
    }

    function pack(PackedBytes29 left, PackedBytes3 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(232, right))
        }
    }

    function pack(PackedBytes30 left, PackedBytes1 right) internal pure returns (PackedBytes31 result) {
        assembly ("memory-safe") {
            result := or(left, shr(240, right))
        }
    }

    function pack(PackedBytes30 left, PackedBytes2 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(240, right))
        }
    }

    function pack(PackedBytes31 left, PackedBytes1 right) internal pure returns (PackedBytes32 result) {
        assembly ("memory-safe") {
            result := or(left, shr(248, right))
        }
    }

    function extract1(PackedBytes2 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract1(PackedBytes3 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes3 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract1(PackedBytes4 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes4 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes4 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract1(PackedBytes5 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes5 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes5 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes5 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract1(PackedBytes6 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes6 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes6 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes6 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes6 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract1(PackedBytes7 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes7 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes7 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes7 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes7 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes7 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract1(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes8 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract1(PackedBytes9 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes9 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes9 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes9 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes9 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes9 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes9 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes9 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract1(PackedBytes10 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes10 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes10 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes10 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes10 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes10 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes10 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes10 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes10 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract1(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes11 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract1(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes12 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract1(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes13 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract1(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes14 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract1(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes15 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract1(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes16 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract1(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes17 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract1(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes18 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract1(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes19 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract1(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes20 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract1(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes21 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract1(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes22 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract1(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes23 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract1(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract23(PackedBytes24 self, uint8 offset) internal pure returns (PackedBytes23 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(72, not(0)))
        }
    }

    function extract1(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract23(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes23 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(72, not(0)))
        }
    }

    function extract24(PackedBytes25 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function extract1(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 25) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract23(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes23 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(72, not(0)))
        }
    }

    function extract24(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function extract25(PackedBytes26 self, uint8 offset) internal pure returns (PackedBytes25 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(56, not(0)))
        }
    }

    function extract1(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 26) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 25) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract23(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes23 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(72, not(0)))
        }
    }

    function extract24(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function extract25(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes25 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(56, not(0)))
        }
    }

    function extract26(PackedBytes27 self, uint8 offset) internal pure returns (PackedBytes26 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(48, not(0)))
        }
    }

    function extract1(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 27) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 26) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 25) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract23(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes23 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(72, not(0)))
        }
    }

    function extract24(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function extract25(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes25 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(56, not(0)))
        }
    }

    function extract26(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes26 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(48, not(0)))
        }
    }

    function extract27(PackedBytes28 self, uint8 offset) internal pure returns (PackedBytes27 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(40, not(0)))
        }
    }

    function extract1(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 28) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 27) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 26) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 25) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract23(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes23 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(72, not(0)))
        }
    }

    function extract24(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function extract25(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes25 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(56, not(0)))
        }
    }

    function extract26(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes26 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(48, not(0)))
        }
    }

    function extract27(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes27 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(40, not(0)))
        }
    }

    function extract28(PackedBytes29 self, uint8 offset) internal pure returns (PackedBytes28 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(32, not(0)))
        }
    }

    function extract1(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 29) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 28) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 27) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 26) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 25) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract23(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes23 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(72, not(0)))
        }
    }

    function extract24(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function extract25(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes25 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(56, not(0)))
        }
    }

    function extract26(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes26 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(48, not(0)))
        }
    }

    function extract27(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes27 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(40, not(0)))
        }
    }

    function extract28(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes28 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(32, not(0)))
        }
    }

    function extract29(PackedBytes30 self, uint8 offset) internal pure returns (PackedBytes29 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(24, not(0)))
        }
    }

    function extract1(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 30) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 29) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 28) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 27) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 26) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 25) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract23(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes23 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(72, not(0)))
        }
    }

    function extract24(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function extract25(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes25 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(56, not(0)))
        }
    }

    function extract26(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes26 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(48, not(0)))
        }
    }

    function extract27(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes27 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(40, not(0)))
        }
    }

    function extract28(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes28 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(32, not(0)))
        }
    }

    function extract29(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes29 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(24, not(0)))
        }
    }

    function extract30(PackedBytes31 self, uint8 offset) internal pure returns (PackedBytes30 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(16, not(0)))
        }
    }

    function extract1(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes1 result) {
        if (offset > 31) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(248, not(0)))
        }
    }

    function extract2(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes2 result) {
        if (offset > 30) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(240, not(0)))
        }
    }

    function extract3(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes3 result) {
        if (offset > 29) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(232, not(0)))
        }
    }

    function extract4(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes4 result) {
        if (offset > 28) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(224, not(0)))
        }
    }

    function extract5(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes5 result) {
        if (offset > 27) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(216, not(0)))
        }
    }

    function extract6(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes6 result) {
        if (offset > 26) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(208, not(0)))
        }
    }

    function extract7(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes7 result) {
        if (offset > 25) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(200, not(0)))
        }
    }

    function extract8(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes8 result) {
        if (offset > 24) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(192, not(0)))
        }
    }

    function extract9(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes9 result) {
        if (offset > 23) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(184, not(0)))
        }
    }

    function extract10(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes10 result) {
        if (offset > 22) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(176, not(0)))
        }
    }

    function extract11(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes11 result) {
        if (offset > 21) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(168, not(0)))
        }
    }

    function extract12(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes12 result) {
        if (offset > 20) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(160, not(0)))
        }
    }

    function extract13(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes13 result) {
        if (offset > 19) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(152, not(0)))
        }
    }

    function extract14(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes14 result) {
        if (offset > 18) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(144, not(0)))
        }
    }

    function extract15(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes15 result) {
        if (offset > 17) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(136, not(0)))
        }
    }

    function extract16(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes16 result) {
        if (offset > 16) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(128, not(0)))
        }
    }

    function extract17(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes17 result) {
        if (offset > 15) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(120, not(0)))
        }
    }

    function extract18(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes18 result) {
        if (offset > 14) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(112, not(0)))
        }
    }

    function extract19(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes19 result) {
        if (offset > 13) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(104, not(0)))
        }
    }

    function extract20(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes20 result) {
        if (offset > 12) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(96, not(0)))
        }
    }

    function extract21(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes21 result) {
        if (offset > 11) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(88, not(0)))
        }
    }

    function extract22(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes22 result) {
        if (offset > 10) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(80, not(0)))
        }
    }

    function extract23(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes23 result) {
        if (offset > 9) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(72, not(0)))
        }
    }

    function extract24(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes24 result) {
        if (offset > 8) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(64, not(0)))
        }
    }

    function extract25(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes25 result) {
        if (offset > 7) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(56, not(0)))
        }
    }

    function extract26(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes26 result) {
        if (offset > 6) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(48, not(0)))
        }
    }

    function extract27(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes27 result) {
        if (offset > 5) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(40, not(0)))
        }
    }

    function extract28(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes28 result) {
        if (offset > 4) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(32, not(0)))
        }
    }

    function extract29(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes29 result) {
        if (offset > 3) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(24, not(0)))
        }
    }

    function extract30(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes30 result) {
        if (offset > 2) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(16, not(0)))
        }
    }

    function extract31(PackedBytes32 self, uint8 offset) internal pure returns (PackedBytes31 result) {
        if (offset > 1) revert OutOfRangeAccess();
        assembly ("memory-safe") {
            result := and(shl(mul(8, offset), self), shl(8, not(0)))
        }
    }
}
