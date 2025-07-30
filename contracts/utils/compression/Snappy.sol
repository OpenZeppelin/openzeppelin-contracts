// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Library for compressing and decompressing buffers using Snappy.
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
        bytes4 errorSelector = DecodingFailure.selector;

        assembly ("memory-safe") {
            // helper: revert with custom error (without args) if boolean isn't true
            function assert(b, e) {
                if iszero(b) {
                    mstore(0, e)
                    revert(0, 0x04)
                }
            }

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
                        assert(lt(add(inputPtr, 3), inputEnd), errorSelector)
                        let smallLen := sub(len, 60)
                        len := or(or(byte(1, w), shl(8, byte(2, w))), or(shl(16, byte(3, w)), shl(24, byte(4, w))))
                        len := add(and(len, shr(sub(256, mul(8, smallLen)), not(0))), 1)
                        inputPtr := add(inputPtr, smallLen)
                    }
                    assert(not(gt(add(inputPtr, len), inputEnd)), errorSelector)
                    // copy len bytes from input to output in chunks of 32 bytes
                    for {
                        let i := 0
                    } lt(i, len) {
                        i := add(i, 0x20)
                    } {
                        mstore(add(outputPtr, i), mload(add(inputPtr, i)))
                    }
                    inputPtr := add(inputPtr, len)
                    outputPtr := add(outputPtr, len)

                    // continue to skip the offset copy logic that is shared by the other 3 cases
                    continue
                }
                case 1 {
                    assert(lt(inputPtr, inputEnd), errorSelector)
                    len := add(and(shr(2, c), 0x7), 4)
                    offset := add(byte(1, w), shl(8, shr(5, c)))
                    inputPtr := add(inputPtr, 1)
                }
                case 2 {
                    assert(lt(add(inputPtr, 1), inputEnd), errorSelector)
                    len := add(shr(2, c), 1)
                    offset := add(byte(1, w), shl(8, byte(2, w)))
                    inputPtr := add(inputPtr, 2)
                }
                case 3 {
                    assert(lt(add(inputPtr, 3), inputEnd), errorSelector)
                    len := add(shr(2, c), 1)
                    offset := add(add(byte(1, w), shl(8, byte(2, w))), add(shl(16, byte(3, w)), shl(24, byte(4, w))))
                    inputPtr := add(inputPtr, 4)
                }
                assert(and(iszero(iszero(offset)), not(gt(offset, sub(outputPtr, add(output, 0x20))))), errorSelector)

                // copying in chunks will not work if the offset is larger than the chunk length, so we compute
                // `step = Math.min(0x20, offset)` and use it for the memory copy
                let step := xor(0x20, mul(lt(offset, 0x20), xor(0x20, offset)))

                // copy len bytes from output to itself.
                for {
                    let i := 0
                } lt(i, len) {
                    i := add(i, step)
                } {
                    mstore(add(outputPtr, i), mload(sub(add(outputPtr, i), offset)))
                }
                outputPtr := add(outputPtr, len)
            }

            // sanity check, FMP is at the right location
            assert(eq(outputPtr, mload(0x40)), errorSelector)
        }
    }

    /// @dev Variant of {uncompress} that takes a buffer from calldata.
    function uncompressCalldata(bytes calldata input) internal pure returns (bytes memory output) {
        bytes4 errorSelector = DecodingFailure.selector;

        assembly ("memory-safe") {
            // helper: revert with custom error (without args) if boolean isn't true
            function assert(b, e) {
                if iszero(b) {
                    mstore(0, e)
                    revert(0, 0x04)
                }
            }

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
                // - 1,2,3: offset copy
                switch and(c, 0x3)
                case 0 {
                    len := add(shr(2, c), 1)
                    if gt(len, 60) {
                        assert(lt(add(inputPtr, 3), inputEnd), errorSelector)
                        let smallLen := sub(len, 60)
                        len := or(or(byte(1, w), shl(8, byte(2, w))), or(shl(16, byte(3, w)), shl(24, byte(4, w))))
                        len := add(and(len, shr(sub(256, mul(8, smallLen)), not(0))), 1)
                        inputPtr := add(inputPtr, smallLen)
                    }
                    assert(not(gt(add(inputPtr, len), inputEnd)), errorSelector)
                    // copy len bytes from input to output in chunks of 32 bytes
                    calldatacopy(outputPtr, inputPtr, len)
                    inputPtr := add(inputPtr, len)
                    outputPtr := add(outputPtr, len)

                    // continue to skip the offset copy logic that is shared by the other 3 cases
                    continue
                }
                case 1 {
                    assert(lt(inputPtr, inputEnd), errorSelector)
                    len := add(and(shr(2, c), 0x7), 4)
                    offset := add(byte(1, w), shl(8, shr(5, c)))
                    inputPtr := add(inputPtr, 1)
                }
                case 2 {
                    assert(lt(add(inputPtr, 1), inputEnd), errorSelector)
                    len := add(shr(2, c), 1)
                    offset := add(byte(1, w), shl(8, byte(2, w)))
                    inputPtr := add(inputPtr, 2)
                }
                case 3 {
                    assert(lt(add(inputPtr, 3), inputEnd), errorSelector)
                    len := add(shr(2, c), 1)
                    offset := add(add(byte(1, w), shl(8, byte(2, w))), add(shl(16, byte(3, w)), shl(24, byte(4, w))))
                    inputPtr := add(inputPtr, 4)
                }
                assert(and(iszero(iszero(offset)), not(gt(offset, sub(outputPtr, add(output, 0x20))))), errorSelector)

                // copying in chunks will not work if the offset is larger than the chunk length, so we compute
                // `step = Math.min(0x20, offset)` and use it for the memory copy
                let step := xor(0x20, mul(lt(offset, 0x20), xor(0x20, offset)))

                // copy len bytes from output to itself.
                for {
                    let i := 0
                } lt(i, len) {
                    i := add(i, step)
                } {
                    mstore(add(outputPtr, i), mload(sub(add(outputPtr, i), offset)))
                }
                outputPtr := add(outputPtr, len)
            }

            // sanity check, FMP is at the right location
            assert(eq(outputPtr, mload(0x40)), errorSelector)
        }
    }
}
