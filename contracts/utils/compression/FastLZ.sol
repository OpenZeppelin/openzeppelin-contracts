// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

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
            // Use new memory allocate at the FMP
            output := mload(0x40)

            // Decrypted inputPtr location
            let outputPtr := add(output, 0x20)

            // end of the input inputPtr (input.length after the beginning of the inputPtr)
            let end := add(add(input, 0x20), mload(input))

            for {
                let inputPtr := add(input, 0x20)
            } lt(inputPtr, end) {} {
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
                    let ofs := add(shl(8, and(first, 31)), byte(2, chunk))
                    let len := add(9, byte(1, chunk))
                    let ref := sub(sub(outputPtr, ofs), 1)
                    let step := sub(0x20, mul(lt(ofs, 0x20), sub(0x1f, ofs))) // min(ofs+1, 0x20)
                    for {
                        let i := 0
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mstore(add(outputPtr, i), mload(add(ref, i)))
                    }
                    inputPtr := add(inputPtr, 3)
                    outputPtr := add(outputPtr, len)
                }
                default {
                    let ofs := add(shl(8, and(first, 31)), byte(1, chunk))
                    let len := add(2, type_)
                    let ref := sub(sub(outputPtr, ofs), 1)
                    let step := sub(0x20, mul(lt(ofs, 0x20), sub(0x1f, ofs))) // min(ofs+1, 0x20)
                    for {
                        let i := 0
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mstore(add(outputPtr, i), mload(add(ref, i)))
                    }
                    inputPtr := add(inputPtr, 2)
                    outputPtr := add(outputPtr, len)
                }
            }
            mstore(output, sub(outputPtr, add(output, 0x20)))
            mstore(0x40, outputPtr)
        }
    }

    function decompressCalldata(bytes calldata input) internal pure returns (bytes memory output) {
        assembly ("memory-safe") {
            // Use new memory allocate at the FMP
            output := mload(0x40)

            // Decrypted inputPtr location
            let outputPtr := add(output, 0x20)

            // end of the input inputPtr (input.length after the beginning of the inputPtr)
            let end := add(input.offset, input.length)

            for {
                let inputPtr := input.offset
            } lt(inputPtr, end) {} {
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
                    let ofs := add(shl(8, and(first, 31)), byte(2, chunk))
                    let len := add(9, byte(1, chunk))
                    let ref := sub(sub(outputPtr, ofs), 1)
                    let step := sub(0x20, mul(lt(ofs, 0x20), sub(0x1f, ofs))) // min(ofs+1, 0x20)
                    for {
                        let i := 0
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mstore(add(outputPtr, i), mload(add(ref, i)))
                    }
                    inputPtr := add(inputPtr, 3)
                    outputPtr := add(outputPtr, len)
                }
                default {
                    let ofs := add(shl(8, and(first, 31)), byte(1, chunk))
                    let len := add(2, type_)
                    let ref := sub(sub(outputPtr, ofs), 1)
                    let step := sub(0x20, mul(lt(ofs, 0x20), sub(0x1f, ofs))) // min(ofs+1, 0x20)
                    for {
                        let i := 0
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mstore(add(outputPtr, i), mload(add(ref, i)))
                    }
                    inputPtr := add(inputPtr, 2)
                    outputPtr := add(outputPtr, len)
                }
            }
            mstore(output, sub(outputPtr, add(output, 0x20)))
            mstore(0x40, outputPtr)
        }
    }
}
