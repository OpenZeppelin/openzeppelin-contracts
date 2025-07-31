// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * @dev Library for decompressing data using Snappy.
 *
 * See https://github.com/google/snappy
 */
library Snappy {
    error DecodingFailure();

    /**
     * @dev Implementation of Snappy's uncompress function.
     *
     * Based on https://github.com/zhipeng-jia/snappyjs/blob/v0.7.0/snappy_decompressor.js[snappyjs javascript implementation].
     */
    function uncompress(bytes memory input) internal pure returns (bytes memory output) {
        assembly ("memory-safe") {
            // input buffer bounds
            let inputBegin := add(input, 0x20)
            let inputEnd := add(inputBegin, mload(input))
            // input traversal pointer
            let inputPtr := inputBegin
            // read length of the decompressed buffer
            let outputLength := 0
            for {} lt(inputPtr, inputEnd) {
                inputPtr := add(inputPtr, 1)
            } {
                let c := byte(0, mload(inputPtr))
                outputLength := add(outputLength, shl(mul(7, sub(inputPtr, inputBegin)), and(c, 0x7f)))
                if iszero(and(c, 0x80)) {
                    break
                }
            }
            inputPtr := add(inputPtr, 1)
            // allocated output buffer
            output := mload(0x40)
            let outputPtr := add(output, 0x20)
            mstore(output, outputLength)
            mstore(0x40, add(outputPtr, outputLength))
            // decompress input buffer into output buffer
            for {
                let len, offset
            } lt(inputPtr, inputEnd) {} {
                // get next (compressed) word -- used as a cache for further reads
                let w := mload(inputPtr)
                inputPtr := add(inputPtr, 1)
                let c := byte(0, w)
                // consider different cases based on the lower 2 bits of c
                // - 0: literal
                // - 1,2,3: offset copy
                switch and(c, 0x3)
                case 0 {
                    len := add(shr(2, c), 1)
                    if gt(len, 60) {
                        let smallLen := sub(len, 60)
                        len := or(or(byte(1, w), shl(8, byte(2, w))), or(shl(16, byte(3, w)), shl(24, byte(4, w))))
                        len := add(and(len, shr(sub(256, mul(8, smallLen)), not(0))), 1)
                        inputPtr := add(inputPtr, smallLen)
                    }
                    mcopy(outputPtr, inputPtr, len)
                    inputPtr := add(inputPtr, len)
                    outputPtr := add(outputPtr, len)
                    // continue to skip the offset copy logic that is shared by the other 3 cases
                    continue
                }
                case 1 {
                    len := add(and(shr(2, c), 0x7), 4)
                    offset := add(byte(1, w), shl(8, shr(5, c)))
                    inputPtr := add(inputPtr, 1)
                }
                case 2 {
                    len := add(shr(2, c), 1)
                    offset := add(byte(1, w), shl(8, byte(2, w)))
                    inputPtr := add(inputPtr, 2)
                }
                case 3 {
                    len := add(shr(2, c), 1)
                    offset := add(add(byte(1, w), shl(8, byte(2, w))), add(shl(16, byte(3, w)), shl(24, byte(4, w))))
                    inputPtr := add(inputPtr, 4)
                }
                // copying in will not work if the offset is larger than the len being copied, so we compute
                // `step = Math.min(len, offset)` and use it for the memory copy in chunks
                for {
                    let ptr := outputPtr
                    let end := add(outputPtr, len)
                    let step := xor(offset, mul(lt(len, offset), xor(len, offset))) // min(len, offset)
                } lt(ptr, end) {
                    ptr := add(ptr, step)
                } {
                    mcopy(ptr, sub(ptr, offset), step)
                }
                outputPtr := add(outputPtr, len)
            }
            // sanity check, we did not read more than the input and FMP is at the right location
            if iszero(and(eq(inputPtr, inputEnd), eq(outputPtr, mload(0x40)))) {
                revert(0, 0)
            }
        }
    }

    /// @dev Variant of {uncompress} that takes a buffer from calldata.
    function uncompressCalldata(bytes calldata input) internal pure returns (bytes memory output) {
        assembly ("memory-safe") {
            // input buffer bounds
            let inputBegin := input.offset
            let inputEnd := add(inputBegin, input.length)
            // input traversal pointer
            let inputPtr := inputBegin
            // read length of the decompressed buffer
            let outputLength := 0
            for {} lt(inputPtr, inputEnd) {
                inputPtr := add(inputPtr, 1)
            } {
                let c := byte(0, calldataload(inputPtr))
                outputLength := add(outputLength, shl(mul(7, sub(inputPtr, inputBegin)), and(c, 0x7f)))
                if iszero(and(c, 0x80)) {
                    break
                }
            }
            inputPtr := add(inputPtr, 1)
            // allocated output buffer
            output := mload(0x40)
            let outputPtr := add(output, 0x20)
            mstore(output, outputLength)
            mstore(0x40, add(outputPtr, outputLength))
            // decompress input buffer into output buffer
            for {
                let len, offset
            } lt(inputPtr, inputEnd) {} {
                // get next (compressed) word -- used as a cache for further reads
                let w := calldataload(inputPtr)
                inputPtr := add(inputPtr, 1)
                let c := byte(0, w)
                // consider different cases based on the lower 2 bits of c
                // - 0: literal
                // - 1, 2, 3: offset copy
                switch and(c, 0x3)
                case 0 {
                    len := add(shr(2, c), 1)
                    if gt(len, 60) {
                        let smallLen := sub(len, 60)
                        len := or(or(byte(1, w), shl(8, byte(2, w))), or(shl(16, byte(3, w)), shl(24, byte(4, w))))
                        len := add(and(len, shr(sub(256, mul(8, smallLen)), not(0))), 1)
                        inputPtr := add(inputPtr, smallLen)
                    }
                    // copy len bytes from input to output in chunks of 32 bytes
                    calldatacopy(outputPtr, inputPtr, len)
                    inputPtr := add(inputPtr, len)
                    outputPtr := add(outputPtr, len)
                    // continue to skip the offset copy logic that is shared by the other 3 cases
                    continue
                }
                case 1 {
                    len := add(and(shr(2, c), 0x7), 4)
                    offset := add(byte(1, w), shl(8, shr(5, c)))
                    inputPtr := add(inputPtr, 1)
                }
                case 2 {
                    len := add(shr(2, c), 1)
                    offset := add(byte(1, w), shl(8, byte(2, w)))
                    inputPtr := add(inputPtr, 2)
                }
                case 3 {
                    len := add(shr(2, c), 1)
                    len := add(shr(2, c), 1)
                    offset := add(add(byte(1, w), shl(8, byte(2, w))), add(shl(16, byte(3, w)), shl(24, byte(4, w))))
                    inputPtr := add(inputPtr, 4)
                }
                // copying in will not work if the offset is larger than the len being copied, so we compute
                // `step = Math.min(len, offset)` and use it for the memory copy in chunks
                for {
                    let ptr := outputPtr
                    let end := add(outputPtr, len)
                    let step := xor(offset, mul(lt(len, offset), xor(len, offset))) // min(len, offset)
                } lt(ptr, end) {
                    ptr := add(ptr, step)
                } {
                    mcopy(ptr, sub(ptr, offset), step)
                }
                outputPtr := add(outputPtr, len)
            }
            // sanity check, we did not read more than the input and FMP is at the right location
            if iszero(and(eq(inputPtr, inputEnd), eq(outputPtr, mload(0x40)))) {
                revert(0, 0)
            }
        }
    }
}
