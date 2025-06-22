// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {SafeCast} from "./math/SafeCast.sol";
import {Bytes} from "./Bytes.sol";

/**
 * @dev Provides a set of functions to operate with Base58 strings.
 *
 * Based on the original https://github.com/storyicon/base58-solidity/commit/807428e5174e61867e4c606bdb26cba58a8c5cb1[implementation of storyicon] (MIT).
 */
library Base58 {
    using SafeCast for bool;
    using Bytes for bytes;

    error InvalidBase56Digit(uint8);

    /**
     * @dev Base58 encoding and decoding tables
     */
    bytes internal constant _TABLE = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    bytes internal constant _LOOKUP_TABLE =
        hex"000102030405060708ffffffffffffff090a0b0c0d0e0f10ff1112131415ff161718191a1b1c1d1e1f20ffffffffffff2122232425262728292a2bff2c2d2e2f30313233343536373839";

    /**
     * @dev Encode a `bytes` buffer as a Base58 `string`.
     */
    function encode(bytes memory data) internal pure returns (string memory) {
        return string(_encode(data));
    }

    /**
     * @dev Decode a Base58 `string` into a `bytes` buffer.
     */
    function decode(string memory data) internal pure returns (bytes memory) {
        return _decode(bytes(data));
    }

    function _encode(bytes memory data) private pure returns (bytes memory encoded) {
        // For reference, solidity implementation
        // unchecked {
        //     uint256 dataCLZ = data.countLeading(0x00);
        //     uint256 length = dataCLZ + ((data.length - dataCLZ) * 8351) / 6115 + 1;
        //     encoded = new bytes(length);
        //     uint256 end = length;
        //     for (uint256 i = 0; i < data.length; ++i) {
        //         uint256 ptr = length;
        //         for (uint256 carry = uint8(data[i]); ptr > end || carry != 0; --ptr) {
        //             carry += 256 * uint8(encoded[ptr - 1]);
        //             encoded[ptr - 1] = bytes1(uint8(carry % 58));
        //             carry /= 58;
        //         }
        //         end = ptr;
        //     }
        //     uint256 encodedCLZ = encoded.countLeading(0x00);
        //     length -= encodedCLZ - dataCLZ;
        //     encoded.splice(encodedCLZ - dataCLZ);
        //     for (uint256 i = 0; i < length; ++i) {
        //         encoded[i] = _TABLE[uint8(encoded[i])];
        //     }
        // }

        // Assembly is ~50% cheaper for buffers of size 32.
        assembly ("memory-safe") {
            function clzBytes(ptr, length) -> i {
                let chunk
                for {
                    i := 0
                } lt(i, length) {
                    i := add(i, 1)
                } {
                    // Every 32 bytes, load a new chunk
                    if iszero(mod(i, 0x20)) {
                        chunk := mload(add(ptr, i))
                    }
                    // If the first byte of the chunk is not zero, break
                    if shr(248, chunk) {
                        break
                    }
                    // Shift chunk
                    chunk := shl(8, chunk)
                }
            }

            encoded := mload(0x40)
            let dataLength := mload(data)

            // Count number of zero bytes at the beginning of `data`
            let dataCLZ := clzBytes(add(data, 0x20), dataLength)

            // Initial encoding
            let slotLength := add(add(dataCLZ, div(mul(sub(dataLength, dataCLZ), 8351), 6115)), 1)

            // Zero the encoded buffer
            for {
                let i := 0
            } lt(i, slotLength) {
                i := add(i, 0x20)
            } {
                mstore(add(add(encoded, 0x20), i), 0)
            }

            // Build the "slots"
            for {
                let i := 0
                let end := slotLength
            } lt(i, dataLength) {
                i := add(i, 1)
            } {
                let ptr := slotLength
                for {
                    let carry := shr(248, mload(add(add(data, 0x20), i)))
                } or(carry, lt(end, ptr)) {
                    ptr := sub(ptr, 1)
                    carry := div(carry, 58)
                } {
                    carry := add(carry, mul(256, shr(248, mload(add(add(encoded, 0x1f), ptr)))))
                    mstore8(add(add(encoded, 0x1f), ptr), mod(carry, 58))
                }
                end := ptr
            }

            // Count number of zero bytes at the beginning of slots
            let slotCLZ := clzBytes(add(encoded, 0x20), slotLength)

            // Update length
            let offset := sub(slotCLZ, dataCLZ)
            let encodedLength := sub(slotLength, offset)

            // Store the encoding table. This overlaps with the FMP that we are going to reset later anyway.
            mstore(0x1f, "123456789ABCDEFGHJKLMNPQRSTUVWXY")
            mstore(0x3f, "Zabcdefghijkmnopqrstuvwxyz")

            for {
                let i := 0
            } lt(i, encodedLength) {
                i := add(i, 1)
            } {
                mstore8(add(add(encoded, 0x20), i), mload(shr(248, mload(add(add(encoded, 0x20), add(offset, i))))))
            }

            // Store length and allocate memory
            mstore(encoded, encodedLength)
            mstore(0x40, add(add(encoded, 0x20), encodedLength))
        }
    }

    function _decode(bytes memory data) private pure returns (bytes memory) {
        unchecked {
            uint256 b58Length = data.length;

            uint256 size = 2 * ((b58Length * 8351) / 6115 + 1);
            bytes memory binu = new bytes(size);

            bytes memory cache = _LOOKUP_TABLE;
            uint256 outiLength = (b58Length + 3) / 4;
            // Note: allocating uint32[] would be enough, but solidity doesn't pack memory.
            uint256[] memory outi = new uint256[](outiLength);
            for (uint256 i = 0; i < data.length; ++i) {
                // get b58 char
                uint8 chr = _mload8i(data, i);
                require(chr > 48 && chr < 123, InvalidBase56Digit(chr));

                // decode b58 char
                uint256 carry = _mload8i(cache, chr - 49);
                require(carry < 58, InvalidBase56Digit(chr));

                for (uint256 j = outiLength; j > 0; --j) {
                    uint256 value = carry + 58 * outi[j - 1];
                    carry = value >> 32;
                    outi[j - 1] = value & 0xffffffff;
                }
            }

            uint256 ptr = 0;
            uint256 mask = ((b58Length - 1) % 4) + 1;
            for (uint256 j = 0; j < outiLength; ++j) {
                while (mask > 0) {
                    --mask;
                    _mstore8(binu, ptr, bytes1(uint8(outi[j] >> (8 * mask))));
                    ptr++;
                }
                mask = 4;
            }

            uint256 dataCLZ = data.countLeading(0x31);
            uint256 msb = binu.countConsecutive(dataCLZ, 0x00);
            return binu.splice(msb * (dataCLZ + msb < binu.length).toUint(), ptr);
        }
    }

    function _mload8(bytes memory buffer, uint256 offset) private pure returns (bytes1 value) {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            value := mload(add(add(buffer, 0x20), offset))
        }
    }

    function _mload8i(bytes memory buffer, uint256 offset) private pure returns (uint8 value) {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            value := shr(248, mload(add(add(buffer, 0x20), offset)))
        }
    }

    function _mstore8(bytes memory buffer, uint256 offset, bytes1 value) private pure {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            mstore8(add(add(buffer, 0x20), offset), shr(248, value))
        }
    }

    function _mstore8i(bytes memory buffer, uint256 offset, uint8 value) private pure {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            mstore8(add(add(buffer, 0x20), offset), value)
        }
    }
}
