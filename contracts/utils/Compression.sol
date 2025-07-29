// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Library for compressing and decompressing buffers. Supported compression algorithm:
 * * FastLZ (level1): (WIP) Do we want this? We should have an NodeJS implementation.
 * * Other LZ77/LZSS/LZ4: Do we want this?
 * * Deflate: Do we want this? The Huffman part is probably going to be a pain, and not worth it for "small" inputs.
 * * Brotli, bzip, gzip: Same as Deflate?
 * * Calldata optimized: Do we want this?
 */
library Compression {
    /**
     * @dev FastLZ level 1 decompression.
     *
     * Based on the reference implementation available here:
     * https://github.com/ariya/FastLZ?tab=readme-ov-file#decompressor-reference-implementation
     */
    function flzDecompress(bytes memory input) internal pure returns (bytes memory output) {
        assembly ("memory-safe") {
            // Use new memory allocate at the FMP
            output := mload(0x40)

            // Decrypted data location
            let ptr := add(output, 0x20)

            // end of the input data (input.length after the beginning of the data)
            let end := add(add(input, 0x20), mload(input))

            for {
                let data := add(input, 0x20)
            } lt(data, end) {} {
                let chunk := mload(data)
                let first := byte(0, chunk)
                let type_ := shr(5, first)

                switch type_
                case 0 {
                    mstore(ptr, mload(add(data, 1)))
                    data := add(data, add(2, first))
                    ptr := add(ptr, add(1, first))
                }
                case 7 {
                    let ofs := add(shl(8, and(first, 31)), byte(2, chunk))
                    let len := add(9, byte(1, chunk))
                    let ref := sub(sub(ptr, ofs), 1)
                    let step := sub(0x20, mul(lt(ofs, 0x20), sub(0x1f, ofs))) // min(ofs+1, 0x20)
                    for {
                        let i := 0
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mstore(add(ptr, i), mload(add(ref, i)))
                    }
                    data := add(data, 3)
                    ptr := add(ptr, len)
                }
                default {
                    let ofs := add(shl(8, and(first, 31)), byte(1, chunk))
                    let len := add(2, type_)
                    let ref := sub(sub(ptr, ofs), 1)
                    let step := sub(0x20, mul(lt(ofs, 0x20), sub(0x1f, ofs))) // min(ofs+1, 0x20)
                    for {
                        let i := 0
                    } lt(i, len) {
                        i := add(i, step)
                    } {
                        mstore(add(ptr, i), mload(add(ref, i)))
                    }
                    data := add(data, 2)
                    ptr := add(ptr, len)
                }
            }
            mstore(output, sub(ptr, add(output, 0x20)))
            mstore(0x40, ptr)
        }
    }
}
