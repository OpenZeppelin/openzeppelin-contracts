// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {SafeCast} from "./math/SafeCast.sol";
import {Bytes} from "./Bytes.sol";

/**
 * @dev Provides a set of functions to operate with Base58 strings.
 *
 * Based on https://github.com/storyicon/base58-solidity/commit/807428e5174e61867e4c606bdb26cba58a8c5cb1[storyicon's implementation] (MIT).
 */
library Base58 {
    using SafeCast for bool;
    using Bytes for bytes;

    error InvalidBase56Digit(uint8);

    /**
     * @dev Base58 encoding & decoding tables
     * See sections 2 of https://datatracker.ietf.org/doc/html/draft-msporny-base58-03
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
        //     uint256 dataLeadingZeros = data.countLeading(0x00);
        //     uint256 length = dataLeadingZeros + ((data.length - dataLeadingZeros) * 8351) / 6115 + 1;
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
        //     length -= encodedCLZ - dataLeadingZeros;
        //     encoded.splice(encodedCLZ - dataLeadingZeros);
        //     for (uint256 i = 0; i < length; ++i) {
        //         encoded[i] = _TABLE[uint8(encoded[i])];
        //     }
        // }

        // Assembly is ~50% cheaper for buffers of size 32.
        assembly ("memory-safe") {
            function clzBytes(ptr, length) -> i {
                // for continues while `i < length` = 1 (true) and the byte at `ptr+1` to be 0
                for {
                    i := 0
                } lt(byte(0, mload(add(ptr, i))), lt(i, length)) {
                    i := add(i, 1)
                } {}
            }

            encoded := mload(0x40)
            let dataLength := mload(data)

            // Count number of zero bytes at the beginning of `data`. These are encoded using the same number of '1's
            // at then beginning of the encoded string.
            let dataLeadingZeros := clzBytes(add(data, 0x20), dataLength)

            // Initial encoding length: 100% of zero bytes (zero prefix) + ~137% of non zero bytes + 1
            let slotLength := add(add(div(mul(sub(dataLength, dataLeadingZeros), 8351), 6115), dataLeadingZeros), 32)

            // Zero the encoded buffer
            calldatacopy(add(encoded, 0x20), calldatasize(), slotLength)

            // Build the "slots"
            for {
                let i := 0
                let end := slotLength
            } lt(i, dataLength) {
                i := add(i, 1)
            } {
                let ptr := slotLength
                for {
                    let carry := byte(0, mload(add(add(data, 0x20), i)))
                } or(carry, lt(end, ptr)) {
                    ptr := sub(ptr, 1)
                    carry := div(carry, 58)
                } {
                    carry := add(carry, mul(256, byte(0, mload(add(add(encoded, 0x1f), ptr)))))
                    mstore8(add(add(encoded, 0x1f), ptr), mod(carry, 58))
                }
                end := ptr
            }

            // Count number of zero bytes at the beginning of slots. This is a pointer to the first non zero slot that
            // contains the base58 data. This base58 data span over `slotLength-slotLeadingZeros` bytes.
            let slotLeadingZeros := clzBytes(add(encoded, 0x20), slotLength)

            // Update length: `slotLength-slotLeadingZeros` of non-zero data plus `dataLeadingZeros` of zero prefix.
            let offset := sub(slotLeadingZeros, dataLeadingZeros)
            let encodedLength := sub(slotLength, offset)

            // Store the encoding table. This overlaps with the FMP that we are going to reset later anyway.
            mstore(0x1f, "123456789ABCDEFGHJKLMNPQRSTUVWXY")
            mstore(0x3f, "Zabcdefghijkmnopqrstuvwxyz")

            // For each slot, use the table to obtain the corresponding base58 "digit".
            for {
                let i := 0
            } lt(i, dataLeadingZeros) {
                i := add(i, 32)
            } {
                mstore(add(add(encoded, 0x20), i), "11111111111111111111111111111111")
            }
            for {
                let i := dataLeadingZeros
            } lt(i, encodedLength) {
                i := add(i, 1)
            } {
                mstore8(add(add(encoded, 0x20), i), mload(byte(0, mload(add(add(encoded, 0x20), add(offset, i))))))
            }

            // Store length and allocate (reserve) memory
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
                uint8 chr = uint8(data[i]);
                require(chr > 48 && chr < 123, InvalidBase56Digit(chr));

                // decode b58 char
                uint256 carry = uint8(cache[chr - 49]);
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
                    binu[ptr] = bytes1(uint8(outi[j] >> (8 * mask)));
                    ++ptr;
                }
                mask = 4;
            }

            uint256 dataLeadingZeros = data.countLeading(0x31);
            uint256 msb = binu.countConsecutive(dataLeadingZeros, 0x00);
            return binu.splice(msb * (dataLeadingZeros + msb < binu.length).toUint(), ptr);
        }
    }
}
