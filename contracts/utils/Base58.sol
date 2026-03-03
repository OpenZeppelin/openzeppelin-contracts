// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/Base58.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides a set of functions to operate with Base58 strings.
 *
 * Base58 is an encoding scheme that converts binary data into a human-readable text format.
 * Similar to {Base64} but specifically designed for better human usability.
 *
 * 1. Human-friendly alphabet: Excludes visually similar characters to reduce human error:
 *    * No 0 (zero) vs O (capital o) confusion
 *    * No I (capital i) vs l (lowercase L) confusion
 *    * No non-alphanumeric characters like + or =
 * 2. URL-safe: Contains only alphanumeric characters, making it safe for URLs without encoding.
 *
 * Initially based on https://github.com/storyicon/base58-solidity/commit/807428e5174e61867e4c606bdb26cba58a8c5cb1[storyicon's implementation] (MIT).
 * Based on the updated and improved https://github.com/Vectorized/solady/blob/208e4f31cfae26e4983eb95c3488a14fdc497ad7/src/utils/Base58.sol[Vectorized version] (MIT).
 */
library Base58 {
    /// @dev Unrecognized Base58 character on decoding.
    error InvalidBase58Char(bytes1);

    /**
     * @dev Encode a `bytes` buffer as a Base58 `string`.
     */
    function encode(bytes memory input) internal pure returns (string memory) {
        return string(_encode(input));
    }

    /**
     * @dev Decode a Base58 `string` into a `bytes` buffer.
     */
    function decode(string memory input) internal pure returns (bytes memory) {
        return _decode(bytes(input));
    }

    function _encode(bytes memory input) private pure returns (bytes memory output) {
        uint256 inputLength = input.length;
        if (inputLength == 0) return "";

        assembly ("memory-safe") {
            // Count number of zero bytes at the beginning of `input`. These are encoded using the same number of '1's
            // at the beginning of the encoded string.
            let inputLeadingZeros := 0
            for {} lt(byte(0, mload(add(add(input, 0x20), inputLeadingZeros))), lt(inputLeadingZeros, inputLength)) {} {
                inputLeadingZeros := add(inputLeadingZeros, 1)
            }

            // Start the output offset by an over-estimate of the length.
            // When converting from base-256 (bytes) to base-58, the theoretical length ratio is log(256)/log(58).
            // We use 9886/7239 ≈ 1.3657 as a rational approximation that slightly over-estimates to ensure
            // sufficient memory allocation.
            let outputLengthEstim := add(inputLeadingZeros, div(mul(sub(inputLength, inputLeadingZeros), 9886), 7239))

            // This is going to be our "scratch" workspace. We leave enough room so that we can store length + encoded output at the FMP location.
            // 0x21 = 0x20 (32 bytes for result length prefix) + 0x1 (safety buffer for division truncation)
            let scratch := add(mload(0x40), add(outputLengthEstim, 0x21))

            // Chunk input into 31-byte limbs (248 bits) for efficient batch processing.
            // Each limb fits safely in a 256-bit word with 8-bit overflow protection.
            // Memory layout: [output chars] [limb₁(248 bits)][limb₂(248 bits)][limb₃(248 bits)]...
            //                               ↑ scratch
            //                               ↑ ptr (moves right)
            let ptr := scratch
            for {
                // Handle partial first limb if input length isn't divisible by 31
                let i := mod(inputLength, 31)
                if i {
                    // Right-shift to align partial limb in high bits of 256-bit word
                    mstore(ptr, shr(mul(sub(32, i), 8), mload(add(input, 0x20))))
                    ptr := add(ptr, 0x20) // next limb
                }
            } lt(i, inputLength) {
                ptr := add(ptr, 0x20) // next limb
                i := add(i, 31) // move in buffer
            } {
                // Load 31 bytes from input, right-shift by 8 bits to leave 1 zero byte on the left.
                mstore(ptr, shr(8, mload(add(add(input, 0x20), i))))
            }

            // Store the encoding table. This overlaps with the FMP that we are going to reset later anyway.
            // See https://datatracker.ietf.org/doc/html/draft-msporny-base58-03#section-2
            mstore(0x1f, "123456789ABCDEFGHJKLMNPQRSTUVWXY")
            mstore(0x3f, "Zabcdefghijkmnopqrstuvwxyz")

            // Core Base58 encoding: repeated division by 58 on input limbs
            // Memory layout: [output chars] [limb₁(248 bits)][limb₂(248 bits)][limb₃(248 bits)]...
            //                               ↑ scratch                          ↑ ptr
            //                               ↑ output (moves left)
            //                               ↑ data (moves right)
            for {
                let data := scratch // Points to first non-zero limb
                output := scratch // Builds result right-to-left from scratch
            } 1 {} {
                // Skip zero limbs at the beginning (limbs become 0 after repeated divisions)
                for {} and(iszero(mload(data)), lt(data, ptr)) {
                    data := add(data, 0x20)
                } {}
                // Exit when all limbs are zero (conversion complete)
                if eq(data, ptr) {
                    break
                }

                // Division by 58 across all remaining limbs
                let carry := 0
                for {
                    let i := data
                } lt(i, ptr) {
                    i := add(i, 0x20)
                } {
                    let acc := add(shl(248, carry), mload(i)) // Combine carry from previous limb with current limb
                    mstore(i, div(acc, 58)) // Store quotient back in limb
                    carry := mod(acc, 58) // Remainder becomes next carry
                }

                // Convert remainder (0-57) to Base58 character and store right-to-left in the output space
                output := sub(output, 1)
                mstore8(output, mload(carry))
            }

            // Write the input leading zeros at the left of the encoded.
            // This may spill to the left into the "length" of the buffer.
            for {
                let i := 0
            } lt(i, inputLeadingZeros) {} {
                i := add(i, 0x20)
                mstore(sub(output, i), "11111111111111111111111111111111")
            }

            // Move output pointer to account for inputLeadingZeros
            output := sub(output, add(inputLeadingZeros, 0x20))

            // Store length and allocate (reserve) memory up to scratch.
            mstore(output, sub(scratch, add(output, 0x20))) // Overwrite spilled bytes
            mstore(0x40, scratch)
        }
    }

    function _decode(bytes memory input) private pure returns (bytes memory output) {
        bytes4 errorSelector = InvalidBase58Char.selector;

        uint256 inputLength = input.length;
        if (inputLength == 0) return "";

        assembly ("memory-safe") {
            let inputLeadingZeros := 0 // Number of leading '1' in `input`.
            // Count leading zeros. In base58, zeros are represented using '1' (chr(49)).
            for {} and(
                eq(byte(0, mload(add(add(input, 0x20), inputLeadingZeros))), 49),
                lt(inputLeadingZeros, inputLength)
            ) {} {
                inputLeadingZeros := add(inputLeadingZeros, 1)
            }

            // Estimate the output length using the base conversion ratio.
            // When converting from base-58 to base-256 (bytes), the theoretical length ratio is log(58)/log(256).
            // We use 6115/8351 ≈ 0.7322 as a rational approximation that slightly over-estimates to ensure
            // sufficient memory allocation.
            let outputLengthEstim := add(inputLeadingZeros, div(mul(sub(inputLength, inputLeadingZeros), 6115), 8351))

            // This is going to be our "scratch" workspace. We leave enough room so that we can store length + decoded output at the FMP location.
            // 0x21 = 0x20 (32 bytes for result length prefix) + 0x1 (safety buffer for division truncation)
            let scratch := add(mload(0x40), add(outputLengthEstim, 0x21))

            // Store the decoding table for character-to-value lookup. This overlaps with the FMP that we are going to reset later anyway.
            // Maps ASCII characters (minus 49) to their Base58 numeric values (0-57), with 0xff for invalid characters
            mstore(0x2a, 0x30313233343536373839)
            mstore(0x20, 0x1718191a1b1c1d1e1f20ffffffffffff2122232425262728292a2bff2c2d2e2f)
            mstore(0x00, 0x000102030405060708ffffffffffffff090a0b0c0d0e0f10ff1112131415ff16)

            // Core Base58 decoding: process each character and accumulate into 31-byte limbs
            // Memory layout: [output bytes] [limb₁(248 bits)][limb₂(248 bits)][limb₃(248 bits)]...
            //                               ↑ scratch
            //                               ↑ ptr (moves right as limbs are added)
            let ptr := scratch
            let mask := shr(8, not(0))
            for {
                let j := 0
            } lt(j, inputLength) {
                j := add(j, 1)
            } {
                // Decode each character: convert from ASCII to Base58 numeric value (0-57)
                let c := sub(byte(0, mload(add(add(input, 0x20), j))), 49) // Offset from '1' (ASCII 49)

                // Validate character using bit manipulation: each bit in the bitmask represents a valid character offset
                // 0x3fff7ff03ffbeff01ff has bits set for all valid Base58 characters (excludes 0, O, I, l)
                // shl(c, 1) creates a single bit at position c, AND with bitmask checks if character is valid
                // slither-disable-next-line incorrect-shift
                if iszero(and(shl(c, 1), 0x3fff7ff03ffbeff01ff)) {
                    mstore(0, errorSelector)
                    mstore(4, shl(248, add(c, 49)))
                    revert(0, 0x24)
                }
                let carry := byte(0, mload(c)) // Look up Base58 numeric value from decoding table

                // Multiplication by 58 and addition across all existing limbs
                for {
                    let i := scratch
                } lt(i, ptr) {
                    i := add(i, 0x20)
                } {
                    let acc := add(carry, mul(58, mload(i))) // Multiply limb by 58 and add carry
                    mstore(i, and(mask, acc)) // Store lower 248 bits back in limb
                    carry := shr(248, acc) // Upper bits become carry for next limb
                }
                // If carry remains, we need a new limb to store the overflow
                if carry {
                    mstore(ptr, carry)
                    ptr := add(ptr, 0x20) // Extend limbs array
                }
            }

            // Copy and compact the uint248 limbs + remove any zeros at the beginning.
            output := scratch
            for {
                let i := scratch
            } lt(i, ptr) {
                i := add(i, 0x20)
            } {
                output := sub(output, 31)
                mstore(sub(output, 1), mload(i))
            }
            for {} lt(byte(0, mload(output)), lt(output, scratch)) {} {
                output := add(output, 1)
            }

            // Add the zeros that were encoded in the input (prefix '1's)
            calldatacopy(sub(output, inputLeadingZeros), calldatasize(), inputLeadingZeros)

            // Move output pointer to account for inputLeadingZeros
            output := sub(output, add(inputLeadingZeros, 0x20))

            // Store length and allocate (reserve) memory up to scratch.
            mstore(output, sub(scratch, add(output, 0x20)))
            mstore(0x40, scratch)
        }
    }
}
