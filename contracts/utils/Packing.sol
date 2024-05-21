// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Packing.js.

pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytes4.
 *
 * Example usage:
 *
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using PackingBytes4 for *;
 *
 *     function foo(bytes4 value) internal {
 *        // Convert any bytes4 into a packed uint16x2
 *        Packing.Uint16x2 myUint16x2 = value.asUint16x2();
 *
 *        // Access values through index
 *        uint16 b = myUint16x2.at(1);
 *
 *        // Convert back to bytes4
 *        bytes4 newValue = myUint16x2.asBytes32();
 *     }
 * }
 * ```
 */
library PackingBytes4 {
    type Uint16x2 is bytes4;

    /// @dev Cast a bytes4 into a Uint16x2
    function asUint16x2(bytes4 self) internal pure returns (Uint16x2) {
        return Uint16x2.wrap(self);
    }

    /// @dev Cast a Uint16x2 into a bytes4
    function asBytes4(Uint16x2 self) internal pure returns (bytes4) {
        return Uint16x2.unwrap(self);
    }

    /// @dev Get the Nth element of a Uint16x2 counting from higher to lower bytes
    ///
    /// NOTE: Returns 0 if pos is out of bounds.
    function at(Uint16x2 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(bytes32(Uint16x2.unwrap(self)) << (pos * 16)));
    }

    /// @dev Pack 2 uint16 into a Uint16x2
    function pack(uint16 arg0, uint16 arg1) internal pure returns (Uint16x2) {
        return Uint16x2.wrap((bytes4(uint32(arg0)) << 16) | bytes4(uint32(arg1)));
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

    /// @dev Get the Nth element of a Uint8x4 counting from higher to lower bytes
    ///
    /// NOTE: Returns 0 if pos is out of bounds.
    function at(Uint8x4 self, uint8 pos) internal pure returns (uint8) {
        return uint8(bytes1(bytes32(Uint8x4.unwrap(self)) << (pos * 8)));
    }

    /// @dev Pack 4 uint8 into a Uint8x4
    function pack(uint8 arg0, uint8 arg1, uint8 arg2, uint8 arg3) internal pure returns (Uint8x4) {
        return
            Uint8x4.wrap(
                (bytes4(uint32(arg0)) << 24) |
                    (bytes4(uint32(arg1)) << 16) |
                    (bytes4(uint32(arg2)) << 8) |
                    bytes4(uint32(arg3))
            );
    }

    /// @dev Split a Uint8x4 into 4 uint8
    function split(Uint8x4 self) internal pure returns (uint8, uint8, uint8, uint8) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }
}

/**
 * @dev Helper library packing and unpacking multiple values into bytes8.
 *
 * Example usage:
 *
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using PackingBytes8 for *;
 *
 *     function foo(bytes8 value) internal {
 *        // Convert any bytes8 into a packed uint32x2
 *        Packing.Uint32x2 myUint32x2 = value.asUint32x2();
 *
 *        // Access values through index
 *        uint32 b = myUint32x2.at(1);
 *
 *        // Convert back to bytes8
 *        bytes8 newValue = myUint32x2.asBytes32();
 *     }
 * }
 * ```
 */
library PackingBytes8 {
    type Uint32x2 is bytes8;

    /// @dev Cast a bytes8 into a Uint32x2
    function asUint32x2(bytes8 self) internal pure returns (Uint32x2) {
        return Uint32x2.wrap(self);
    }

    /// @dev Cast a Uint32x2 into a bytes8
    function asBytes8(Uint32x2 self) internal pure returns (bytes8) {
        return Uint32x2.unwrap(self);
    }

    /// @dev Get the Nth element of a Uint32x2 counting from higher to lower bytes
    ///
    /// NOTE: Returns 0 if pos is out of bounds.
    function at(Uint32x2 self, uint8 pos) internal pure returns (uint32) {
        return uint32(bytes4(bytes32(Uint32x2.unwrap(self)) << (pos * 32)));
    }

    /// @dev Pack 2 uint32 into a Uint32x2
    function pack(uint32 arg0, uint32 arg1) internal pure returns (Uint32x2) {
        return Uint32x2.wrap((bytes8(uint64(arg0)) << 32) | bytes8(uint64(arg1)));
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

    /// @dev Get the Nth element of a Uint16x4 counting from higher to lower bytes
    ///
    /// NOTE: Returns 0 if pos is out of bounds.
    function at(Uint16x4 self, uint8 pos) internal pure returns (uint16) {
        return uint16(bytes2(bytes32(Uint16x4.unwrap(self)) << (pos * 16)));
    }

    /// @dev Pack 4 uint16 into a Uint16x4
    function pack(uint16 arg0, uint16 arg1, uint16 arg2, uint16 arg3) internal pure returns (Uint16x4) {
        return
            Uint16x4.wrap(
                (bytes8(uint64(arg0)) << 48) |
                    (bytes8(uint64(arg1)) << 32) |
                    (bytes8(uint64(arg2)) << 16) |
                    bytes8(uint64(arg3))
            );
    }

    /// @dev Split a Uint16x4 into 4 uint16
    function split(Uint16x4 self) internal pure returns (uint16, uint16, uint16, uint16) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }
}

/**
 * @dev Helper library packing and unpacking multiple values into bytes16.
 *
 * Example usage:
 *
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using PackingBytes16 for *;
 *
 *     function foo(bytes16 value) internal {
 *        // Convert any bytes16 into a packed uint64x2
 *        Packing.Uint64x2 myUint64x2 = value.asUint64x2();
 *
 *        // Access values through index
 *        uint64 b = myUint64x2.at(1);
 *
 *        // Convert back to bytes16
 *        bytes16 newValue = myUint64x2.asBytes32();
 *     }
 * }
 * ```
 */
library PackingBytes16 {
    type Uint64x2 is bytes16;

    /// @dev Cast a bytes16 into a Uint64x2
    function asUint64x2(bytes16 self) internal pure returns (Uint64x2) {
        return Uint64x2.wrap(self);
    }

    /// @dev Cast a Uint64x2 into a bytes16
    function asBytes16(Uint64x2 self) internal pure returns (bytes16) {
        return Uint64x2.unwrap(self);
    }

    /// @dev Get the Nth element of a Uint64x2 counting from higher to lower bytes
    ///
    /// NOTE: Returns 0 if pos is out of bounds.
    function at(Uint64x2 self, uint8 pos) internal pure returns (uint64) {
        return uint64(bytes8(bytes32(Uint64x2.unwrap(self)) << (pos * 64)));
    }

    /// @dev Pack 2 uint64 into a Uint64x2
    function pack(uint64 arg0, uint64 arg1) internal pure returns (Uint64x2) {
        return Uint64x2.wrap((bytes16(uint128(arg0)) << 64) | bytes16(uint128(arg1)));
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

    /// @dev Get the Nth element of a Uint32x4 counting from higher to lower bytes
    ///
    /// NOTE: Returns 0 if pos is out of bounds.
    function at(Uint32x4 self, uint8 pos) internal pure returns (uint32) {
        return uint32(bytes4(bytes32(Uint32x4.unwrap(self)) << (pos * 32)));
    }

    /// @dev Pack 4 uint32 into a Uint32x4
    function pack(uint32 arg0, uint32 arg1, uint32 arg2, uint32 arg3) internal pure returns (Uint32x4) {
        return
            Uint32x4.wrap(
                (bytes16(uint128(arg0)) << 96) |
                    (bytes16(uint128(arg1)) << 64) |
                    (bytes16(uint128(arg2)) << 32) |
                    bytes16(uint128(arg3))
            );
    }

    /// @dev Split a Uint32x4 into 4 uint32
    function split(Uint32x4 self) internal pure returns (uint32, uint32, uint32, uint32) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }
}

/**
 * @dev Helper library packing and unpacking multiple values into bytes32.
 *
 * Example usage:
 *
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using PackingBytes32 for *;
 *
 *     function foo(bytes32 value) internal {
 *        // Convert any bytes32 into a packed uint128x2
 *        Packing.Uint128x2 myUint128x2 = value.asUint128x2();
 *
 *        // Access values through index
 *        uint128 b = myUint128x2.at(1);
 *
 *        // Convert back to bytes32
 *        bytes32 newValue = myUint128x2.asBytes32();
 *     }
 * }
 * ```
 */
library PackingBytes32 {
    type Uint128x2 is bytes32;

    /// @dev Cast a bytes32 into a Uint128x2
    function asUint128x2(bytes32 self) internal pure returns (Uint128x2) {
        return Uint128x2.wrap(self);
    }

    /// @dev Cast a Uint128x2 into a bytes32
    function asBytes32(Uint128x2 self) internal pure returns (bytes32) {
        return Uint128x2.unwrap(self);
    }

    /// @dev Get the Nth element of a Uint128x2 counting from higher to lower bytes
    ///
    /// NOTE: Returns 0 if pos is out of bounds.
    function at(Uint128x2 self, uint8 pos) internal pure returns (uint128) {
        return uint128(bytes16(bytes32(Uint128x2.unwrap(self)) << (pos * 128)));
    }

    /// @dev Pack 2 uint128 into a Uint128x2
    function pack(uint128 arg0, uint128 arg1) internal pure returns (Uint128x2) {
        return Uint128x2.wrap((bytes32(uint256(arg0)) << 128) | bytes32(uint256(arg1)));
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

    /// @dev Get the Nth element of a Uint64x4 counting from higher to lower bytes
    ///
    /// NOTE: Returns 0 if pos is out of bounds.
    function at(Uint64x4 self, uint8 pos) internal pure returns (uint64) {
        return uint64(bytes8(bytes32(Uint64x4.unwrap(self)) << (pos * 64)));
    }

    /// @dev Pack 4 uint64 into a Uint64x4
    function pack(uint64 arg0, uint64 arg1, uint64 arg2, uint64 arg3) internal pure returns (Uint64x4) {
        return
            Uint64x4.wrap(
                (bytes32(uint256(arg0)) << 192) |
                    (bytes32(uint256(arg1)) << 128) |
                    (bytes32(uint256(arg2)) << 64) |
                    bytes32(uint256(arg3))
            );
    }

    /// @dev Split a Uint64x4 into 4 uint64
    function split(Uint64x4 self) internal pure returns (uint64, uint64, uint64, uint64) {
        return (at(self, 0), at(self, 1), at(self, 2), at(self, 3));
    }
}
