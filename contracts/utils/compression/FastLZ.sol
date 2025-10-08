// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * @dev Library for decompressing data using FastLZ.
 *
 * See https://ariya.github.io/FastLZ/
 */
library FastLZ {
    /**
     * @dev FastLZ level 1 decompression.
     *
     * Based on the reference implementation available here:
     * https://github.com/ariya/FastLZ?tab=readme-ov-file#decompressor-reference-implementation
     */
    function decompress(bytes memory input) internal pure returns (bytes memory output) {
        assembly ("memory-safe") {
            let inputPtr := add(input, 0x20)
            let inputEnd := add(add(input, 0x20), mload(input))

            // Use new memory allocate at the FMP
            output := mload(0x40)
            let outputPtr := add(output, 0x20)

            for {} lt(inputPtr, inputEnd) {} {
                let chunk := mload(inputPtr)
                let first := byte(0, chunk)
                let type_ := shr(5, first)

                switch type_
                case 0 {
                    mstore(outputPtr, mload(add(inputPtr, 1)))
                    inputPtr := add(inputPtr, add(2, first))
                    outputPtr := add(outputPtr, add(1, first))
                }
                case 7 {
                    let len := add(9, byte(1, chunk))
                    for {
                        let i := 0
                        let ofs := add(add(shl(8, and(first, 31)), byte(2, chunk)), 1)
                        let ref := sub(outputPtr, ofs)
                        let step := xor(len, mul(lt(ofs, len), xor(ofs, len)))
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mcopy(add(outputPtr, i), add(ref, i), step)
                    }
                    inputPtr := add(inputPtr, 3)
                    outputPtr := add(outputPtr, len)
                }
                default {
                    let len := add(2, type_)
                    for {
                        let i := 0
                        let ofs := add(add(shl(8, and(first, 31)), byte(1, chunk)), 1)
                        let ref := sub(outputPtr, ofs)
                        let step := xor(len, mul(lt(ofs, len), xor(ofs, len)))
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mcopy(add(outputPtr, i), add(ref, i), step)
                    }
                    inputPtr := add(inputPtr, 2)
                    outputPtr := add(outputPtr, len)
                }
            }
            if iszero(eq(inputPtr, inputEnd)) {
                revert(0, 0)
            }

            mstore(output, sub(outputPtr, add(output, 0x20)))
            mstore(0x40, outputPtr)
        }
    }

    function decompressCalldata(bytes calldata input) internal pure returns (bytes memory output) {
        assembly ("memory-safe") {
            let inputPtr := input.offset
            let inputEnd := add(input.offset, input.length)

            // Use new memory allocate at the FMP
            output := mload(0x40)
            let outputPtr := add(output, 0x20)

            for {} lt(inputPtr, inputEnd) {} {
                let chunk := calldataload(inputPtr)
                let first := byte(0, chunk)
                let type_ := shr(5, first)

                switch type_
                case 0 {
                    mstore(outputPtr, calldataload(add(inputPtr, 1)))
                    inputPtr := add(inputPtr, add(2, first))
                    outputPtr := add(outputPtr, add(1, first))
                }
                case 7 {
                    let len := add(9, byte(1, chunk))
                    for {
                        let i := 0
                        let ofs := add(add(shl(8, and(first, 31)), byte(2, chunk)), 1)
                        let ref := sub(outputPtr, ofs)
                        let step := xor(len, mul(lt(ofs, len), xor(ofs, len)))
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mcopy(add(outputPtr, i), add(ref, i), step)
                    }
                    inputPtr := add(inputPtr, 3)
                    outputPtr := add(outputPtr, len)
                }
                default {
                    let len := add(2, type_)
                    for {
                        let i := 0
                        let ofs := add(add(shl(8, and(first, 31)), byte(1, chunk)), 1)
                        let ref := sub(outputPtr, ofs)
                        let step := xor(len, mul(lt(ofs, len), xor(ofs, len)))
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mcopy(add(outputPtr, i), add(ref, i), step)
                    }
                    inputPtr := add(inputPtr, 2)
                    outputPtr := add(outputPtr, len)
                }
            }
            if iszero(eq(inputPtr, inputEnd)) {
                revert(0, 0)
            }

            mstore(output, sub(outputPtr, add(output, 0x20)))
            mstore(0x40, outputPtr)
        }
    }
}
