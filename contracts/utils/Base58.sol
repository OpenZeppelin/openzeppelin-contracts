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
        uint256 dataLength = data.length;
        if (dataLength == 0) return "";

        assembly ("memory-safe") {
            // Count number of zero bytes at the beginning of `data`. These are encoded using the same number of '1's
            // at then beginning of the encoded string.
            let dataLeadingZeros := 0
            for {} lt(byte(0, mload(add(add(data, 0x20), dataLeadingZeros))), lt(dataLeadingZeros, dataLength)) {} {
                dataLeadingZeros := add(dataLeadingZeros, 1)
            }

            // Start the output offset by an over-estimate of the length.
            let overEstimatedSlotLength := add(
                dataLeadingZeros,
                div(mul(sub(dataLength, dataLeadingZeros), 8351), 6115)
            )
            // This is going to be our "scratch" workspace. Be leave enough room on the left to store length + encoded data.
            let scratch := add(mload(0x40), add(overEstimatedSlotLength, 0x21))

            // Cut the input buffer in section (limbs) of 31 bytes (248 bits). Store in scratch.
            let ptr := scratch
            for {
                // first section is possibly smaller than 31 bytes
                let i := mod(dataLength, 31)
                // unfold first loop, with a different shift.
                if i {
                    mstore(ptr, shr(mul(sub(32, i), 8), mload(add(data, 0x20))))
                    ptr := add(ptr, 0x20)
                }
            } lt(i, dataLength) {
                ptr := add(ptr, 0x20) // next limb
                i := add(i, 31) // move in buffer
            } {
                // Load 32 bytes from the input buffer and shift to only keep the 31 leftmost.
                mstore(ptr, shr(8, mload(add(add(data, 0x20), i))))
            }

            // Store the encoding table. This overlaps with the FMP that we are going to reset later anyway.
            // See sections 2 of https://datatracker.ietf.org/doc/html/draft-msporny-base58-03
            mstore(0x1f, "123456789ABCDEFGHJKLMNPQRSTUVWXY")
            mstore(0x3f, "Zabcdefghijkmnopqrstuvwxyz")

            // Encoding the "data" part of the result.
            // `encoded` point the the left part of the encoded string. we start from scratch, which means we have
            // overEstimatedSlotLength bytes to work with before hitting the FMP
            for {
                encoded := scratch
            } 1 {} {
                // check if there are non-zero limbs remaining
                let i := scratch
                for {} and(iszero(mload(i)), lt(i, ptr)) {
                    i := add(i, 0x20)
                } {}
                if eq(i, ptr) {
                    break
                }

                // base 58 arithmetic on the 248bits limbs
                let carry := 0
                for {
                    i := scratch
                } lt(i, ptr) {
                    i := add(i, 0x20)
                } {
                    let acc := add(shl(248, carry), mload(i))
                    mstore(i, div(acc, 58))
                    carry := mod(acc, 58)
                }

                // encoded carry using base58 table, and add it to the output
                encoded := sub(encoded, 1)
                mstore8(encoded, mload(carry))
            }

            // Write the data leading zeros at the left of the encoded.
            // This will spill to the left into the "length" of the buffer.
            for {
                let j := 0
            } lt(j, dataLeadingZeros) {} {
                j := add(j, 0x20)
                mstore(sub(encoded, j), "11111111111111111111111111111111")
            }

            // Move encoded pointer to account for dataLeadingZeros
            encoded := sub(encoded, add(dataLeadingZeros, 0x20))

            // Store length and allocate (reserve) memory up to scratch.
            mstore(encoded, sub(scratch, add(encoded, 0x20)))
            mstore(0x40, scratch)
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
