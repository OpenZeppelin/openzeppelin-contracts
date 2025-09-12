// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Provides a set of functions to operate with Base58 strings.
 *
 * Initially based on https://github.com/storyicon/base58-solidity/commit/807428e5174e61867e4c606bdb26cba58a8c5cb1[storyicon's implementation] (MIT).
 * Based on the updated and improved https://github.com/Vectorized/solady/blob/main/src/utils/Base58.sol[Vectorized version] (MIT).
 */
library Base58 {
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
            // This is an (over) estimation of the length ratio between bytes (base 256) and base58
            // 8351 / 6115 = 1.365658217497956 > 1.365658237309761 = Math.log(256) / Math.log(58)
            let outputLengthEstim := add(inputLeadingZeros, div(mul(sub(inputLength, inputLeadingZeros), 8351), 6115))

            // This is going to be our "scratch" workspace. We leave enough room after FMP to later store length + encoded output.
            let scratch := add(mload(0x40), add(outputLengthEstim, 0x21))

            // Cut the input buffer in section (limbs) of 31 bytes (248 bits). Store in scratch.
            let ptr := scratch
            for {
                // first section is possibly smaller than 31 bytes
                let i := mod(inputLength, 31)
                // unfold first loop, with a different shift.
                if i {
                    mstore(ptr, shr(mul(sub(32, i), 8), mload(add(input, 0x20))))
                    ptr := add(ptr, 0x20)
                }
            } lt(i, inputLength) {
                ptr := add(ptr, 0x20) // next limb
                i := add(i, 31) // move in buffer
            } {
                // Load 31 bytes from the input buffer and store then in scratch (at ptr) in a dedicated 32 bytes space.
                mstore(ptr, shr(8, mload(add(add(input, 0x20), i))))
            }

            // Store the encoding table. This overlaps with the FMP that we are going to reset later anyway.
            // See sections 2 of https://inputtracker.ietf.org/doc/html/draft-msporny-base58-03
            mstore(0x1f, "123456789ABCDEFGHJKLMNPQRSTUVWXY")
            mstore(0x3f, "Zabcdefghijkmnopqrstuvwxyz")

            // Encoding the "input" part of the result.
            // - `data` points to the first (highest) non-empty limb. As limb get nullified by the successive
            //   divisions by 58, we don't need to reprocess the highest ones. Algorithm ends when all limbs are zeroed
            //   i.e. when the `data` pointer reaches the `ptr` pointer that correspond to the last limb.
            // - `output` point the the left part of the encoded string. We start from scratch, which means we have
            //   outputLengthEstim bytes to work with before hitting the FMP
            for {
                let data := scratch
                output := scratch
            } 1 {} {
                // move past the first (highest) zero limbs.
                for {} and(iszero(mload(data)), lt(data, ptr)) {
                    data := add(data, 0x20)
                } {}
                // if all limbs are zeroed, we are done with this part of encoding
                if eq(data, ptr) {
                    break
                }

                // base 58 arithmetic on the 248bits limbs
                let carry := 0
                for {
                    let i := data
                } lt(i, ptr) {
                    i := add(i, 0x20)
                } {
                    let acc := add(shl(248, carry), mload(i))
                    mstore(i, div(acc, 58))
                    carry := mod(acc, 58)
                }

                // encode carry using base58 table, and add it to the output
                output := sub(output, 1)
                mstore8(output, mload(carry))
            }

            // Write the input leading zeros at the left of the encoded.
            // This will spill to the left into the "length" of the buffer.
            for {
                let i := 0
            } lt(i, inputLeadingZeros) {} {
                i := add(i, 0x20)
                mstore(sub(output, i), "11111111111111111111111111111111")
            }

            // Move output pointer to account for inputLeadingZeros
            output := sub(output, add(inputLeadingZeros, 0x20))

            // Store length and allocate (reserve) memory up to scratch.
            mstore(output, sub(scratch, add(output, 0x20)))
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

            // Start the output offset by an over-estimate of the length.
            let outputLengthEstim := add(inputLeadingZeros, div(mul(sub(inputLength, inputLeadingZeros), 6115), 8351))

            // This is going to be our "scratch" workspace. Be leave enough room on the left to store length + encoded input.
            let scratch := add(mload(0x40), add(outputLengthEstim, 0x21))

            // Store the decoding table. This overlaps with the FMP that we are going to reset later anyway.
            mstore(0x2a, 0x30313233343536373839)
            mstore(0x20, 0x1718191a1b1c1d1e1f20ffffffffffff2122232425262728292a2bff2c2d2e2f)
            mstore(0x00, 0x000102030405060708ffffffffffffff090a0b0c0d0e0f10ff1112131415ff16)

            // Decode each char of the input string, and store it in sections (limbs) of 31 bytes. Store in scratch.
            let ptr := scratch
            let mask := shr(8, not(0))
            for {
                let j := 0
            } lt(j, inputLength) {
                j := add(j, 1)
            } {
                // for each char, decode it ...
                let c := sub(byte(0, mload(add(add(input, 0x20), j))), 49)
                // slither-disable-next-line incorrect-shift
                if iszero(and(shl(c, 1), 0x3fff7ff03ffbeff01ff)) {
                    mstore(0, errorSelector)
                    mstore(4, shl(248, add(c, 49)))
                    revert(0, 0x24)
                }
                let carry := byte(0, mload(c))

                // ... and add it to the limbs starting a `scratch`
                for {
                    let i := scratch
                } lt(i, ptr) {
                    i := add(i, 0x20)
                } {
                    let acc := add(carry, mul(58, mload(i)))
                    mstore(i, and(mask, acc))
                    carry := shr(248, acc)
                }
                // If the char just read result in a leftover carry, extend the limbs with the new value
                if carry {
                    mstore(ptr, carry)
                    ptr := add(ptr, 0x20)
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
