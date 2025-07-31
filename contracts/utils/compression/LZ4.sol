// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * @dev Library for decompressing data using LZ4.
 *
 * See https://lz4.org/
 */
library LZ4 {
    // Compression format parameters/constants.
    uint256 private constant MIN_MATCH = 4;
    // Frame constants
    uint32 private constant MAGIC_NUM = 0x04224d18; // reversed endianness (first 4 bytes of the frame)
    // Frame descriptor flags
    uint8 private constant FD_CONTENT_SIZE = 0x08;
    uint8 private constant FD_BLOCK_CHKSUM = 0x10;
    uint8 private constant FD_VERSION_MASK = 0xC0;
    uint8 private constant FD_VERSION = 0x40;
    // Block sizes
    uint32 private constant BS_UNCOMPRESSED = 0x80000000;
    uint8 private constant BS_SHIFT = 0x04;
    uint8 private constant BS_MASK = 0x07;

    error InvalidMagicNumber();
    error InvalidVersion();
    error DecodingFailure();

    /**
     * @dev Implementation of LZ4's decompress function.
     *
     * See https://github.com/Benzinga/lz4js/blob/master/lz4.js
     */
    function decompress(bytes memory input) internal pure returns (bytes memory output) {
        bytes4 invalidMagicNumberCode = InvalidMagicNumber.selector;
        bytes4 invalidVersionCode = InvalidVersion.selector;
        bytes4 decodingFailureCode = DecodingFailure.selector;

        assembly ("memory-safe") {
            function assert(b, e) {
                if iszero(b) {
                    mstore(0, e)
                    revert(0, 4)
                }
            }
            function adv(ptr, end, l, e) -> ptr_ {
                ptr_ := add(ptr, l)
                if gt(ptr_, end) {
                    mstore(0, e)
                    revert(0, 4)
                }
            }
            // input buffer
            let inputPtr := add(input, 0x20)
            let inputEnd := add(inputPtr, mload(input))
            // output buffer
            output := mload(0x40)
            let outputPtr := add(output, 0x20)
            // ========================================== decompress frame ===========================================
            // Get header (size must be at least 7 / 15 depending on useContentSize )
            // [ magic (4) ++ descriptor (1) ++ bsIds (1) ++ contentsize (0 or 8) ++ ??? (1) ]
            let header := mload(inputPtr)
            // read magic number (first 4 bytes, realigned right)
            assert(eq(shr(224, header), MAGIC_NUM), invalidMagicNumberCode)
            // read descriptor and check version
            let descriptor := byte(4, header)
            assert(eq(and(descriptor, FD_VERSION_MASK), FD_VERSION), invalidVersionCode)
            // read flags
            let useBlockSum := eq(and(descriptor, FD_BLOCK_CHKSUM), FD_BLOCK_CHKSUM)
            let useContentSize := eq(and(descriptor, FD_CONTENT_SIZE), FD_CONTENT_SIZE)
            // read block size
            let bsIdx := and(shr(BS_SHIFT, byte(5, header)), BS_MASK)
            assert(and(gt(bsIdx, 3), lt(bsIdx, 8)), decodingFailureCode)
            // move forward 7 or 15 bytes depending on "useContentSize"
            inputPtr := adv(inputPtr, inputEnd, add(7, mul(useContentSize, 8)), decodingFailureCode)
            // read blocks
            for {} 1 {} {
                let chunk := mload(inputPtr)
                // read block length (32 bits = 4 bytes reverse endianness)
                let blockLength := or(
                    or(byte(0, chunk), shl(8, byte(1, chunk))),
                    or(shl(16, byte(2, chunk)), shl(24, byte(3, chunk)))
                )
                inputPtr := adv(inputPtr, inputEnd, 4, decodingFailureCode)
                // empty block means we are done with decoding
                if iszero(blockLength) {
                    break
                }
                // read block checksum if "useBlockSum" (from chunk) ?
                if useBlockSum {
                    inputPtr := adv(inputPtr, inputEnd, 4, decodingFailureCode)
                }
                // check if block is compressed
                switch iszero(and(blockLength, BS_UNCOMPRESSED))
                // uncompressed block case
                case 0 {
                    // mask off the 'uncompressed' bit
                    blockLength := and(blockLength, not(BS_UNCOMPRESSED))
                    // copy uncompressed data to the output buffer
                    mcopy(outputPtr, inputPtr, blockLength)
                    inputPtr := adv(inputPtr, inputEnd, blockLength, decodingFailureCode)
                    outputPtr := add(outputPtr, blockLength)
                }
                // compressed block case
                case 1 {
                    let blockEnd := add(inputPtr, blockLength)
                    for {} lt(inputPtr, blockEnd) {} {
                        let token := byte(0, mload(inputPtr))
                        inputPtr := adv(inputPtr, blockEnd, 1, decodingFailureCode)
                        // literals to copy
                        let literalLength := shr(4, token)
                        if literalLength {
                            // Parse length.
                            if eq(literalLength, 0xf) {
                                for {} 1 {} {
                                    let count := byte(0, mload(inputPtr))
                                    inputPtr := adv(inputPtr, blockEnd, 1, decodingFailureCode)
                                    literalLength := add(literalLength, count)
                                    if lt(count, 0xff) {
                                        break
                                    }
                                }
                            }
                            mcopy(outputPtr, inputPtr, literalLength)
                            inputPtr := adv(inputPtr, blockEnd, literalLength, decodingFailureCode)
                            outputPtr := add(outputPtr, literalLength)
                        }
                        // if we are done reading the block, break the switch (continue the loop)
                        if iszero(lt(inputPtr, blockEnd)) {
                            break
                        }
                        // read offset (32 bits = 4 bytes reverse endianness)
                        chunk := mload(inputPtr)
                        let offset := or(byte(0, chunk), shl(8, byte(1, chunk)))
                        inputPtr := adv(inputPtr, blockEnd, 2, decodingFailureCode)
                        // parse length of the copy section
                        let copyLength := and(token, 0xf)
                        if eq(copyLength, 0xf) {
                            for {} 1 {} {
                                let count := byte(0, mload(inputPtr))
                                inputPtr := adv(inputPtr, blockEnd, 1, decodingFailureCode)
                                copyLength := add(copyLength, count)
                                if lt(count, 0xff) {
                                    break
                                }
                            }
                        }
                        copyLength := add(copyLength, MIN_MATCH)
                        // do the copy
                        for {
                            let ptr := outputPtr
                            let end := add(outputPtr, copyLength)
                            let step := xor(offset, mul(lt(copyLength, offset), xor(copyLength, offset))) // min(copyLength, offset)
                        } lt(ptr, end) {
                            ptr := add(ptr, step)
                        } {
                            mcopy(ptr, sub(ptr, offset), step)
                        }
                        outputPtr := add(outputPtr, copyLength)
                    }
                    assert(eq(inputPtr, blockEnd), decodingFailureCode)
                }
            }
            // reserve used memory
            mstore(output, sub(outputPtr, add(output, 0x20)))
            mstore(0x40, outputPtr)
        }
    }

    function decompressCalldata(bytes calldata input) internal pure returns (bytes memory output) {
        bytes4 invalidMagicNumberCode = InvalidMagicNumber.selector;
        bytes4 invalidVersionCode = InvalidVersion.selector;
        bytes4 decodingFailureCode = DecodingFailure.selector;

        assembly ("memory-safe") {
            function assert(b, e) {
                if iszero(b) {
                    mstore(0, e)
                    revert(0, 4)
                }
            }
            function adv(ptr, end, l, e) -> ptr_ {
                ptr_ := add(ptr, l)
                if gt(ptr_, end) {
                    mstore(0, e)
                    revert(0, 4)
                }
            }
            // input buffer
            let inputPtr := input.offset
            let inputEnd := add(inputPtr, input.length)
            // output buffer
            output := mload(0x40)
            let outputPtr := add(output, 0x20)
            // ========================================== decompress frame ===========================================
            // Get header (size must be at least 7 / 15 depending on useContentSize )
            // [ magic (4) ++ descriptor (1) ++ bsIds (1) ++ contentsize (0 or 8) ++ ??? (1) ]
            let header := calldataload(inputPtr)
            // read magic number (first 4 bytes, realigned right)
            assert(eq(shr(224, header), MAGIC_NUM), invalidMagicNumberCode)
            // read descriptor and check version
            let descriptor := byte(4, header)
            assert(eq(and(descriptor, FD_VERSION_MASK), FD_VERSION), invalidVersionCode)
            // read flags
            let useBlockSum := eq(and(descriptor, FD_BLOCK_CHKSUM), FD_BLOCK_CHKSUM)
            let useContentSize := eq(and(descriptor, FD_CONTENT_SIZE), FD_CONTENT_SIZE)
            // read block size
            let bsIdx := and(shr(BS_SHIFT, byte(5, header)), BS_MASK)
            assert(and(gt(bsIdx, 3), lt(bsIdx, 8)), decodingFailureCode)
            // move forward 7 or 15 bytes depending on "useContentSize"
            inputPtr := adv(inputPtr, inputEnd, add(7, mul(useContentSize, 8)), decodingFailureCode)
            // read blocks
            for {} 1 {} {
                let chunk := calldataload(inputPtr)
                // read block length (32 bits = 4 bytes reverse endianness)
                let blockLength := or(
                    or(byte(0, chunk), shl(8, byte(1, chunk))),
                    or(shl(16, byte(2, chunk)), shl(24, byte(3, chunk)))
                )
                inputPtr := adv(inputPtr, inputEnd, 4, decodingFailureCode)
                // empty block means we are done with decoding
                if iszero(blockLength) {
                    break
                }
                // read block checksum if "useBlockSum" (from chunk) ?
                if useBlockSum {
                    inputPtr := adv(inputPtr, inputEnd, 4, decodingFailureCode)
                }
                // check if block is compressed
                switch iszero(and(blockLength, BS_UNCOMPRESSED))
                // uncompressed block case
                case 0 {
                    // mask off the 'uncompressed' bit
                    blockLength := and(blockLength, not(BS_UNCOMPRESSED))
                    // copy uncompressed data to the output buffer
                    calldatacopy(outputPtr, inputPtr, blockLength)
                    inputPtr := adv(inputPtr, inputEnd, blockLength, decodingFailureCode)
                    outputPtr := add(outputPtr, blockLength)
                }
                // compressed block case
                case 1 {
                    let blockEnd := add(inputPtr, blockLength)
                    for {} lt(inputPtr, blockEnd) {} {
                        let token := byte(0, calldataload(inputPtr))
                        inputPtr := adv(inputPtr, blockEnd, 1, decodingFailureCode)
                        // literals to copy
                        let literalLength := shr(4, token)
                        if literalLength {
                            // Parse length.
                            if eq(literalLength, 0xf) {
                                for {} 1 {} {
                                    let count := byte(0, calldataload(inputPtr))
                                    inputPtr := adv(inputPtr, blockEnd, 1, decodingFailureCode)
                                    literalLength := add(literalLength, count)
                                    if lt(count, 0xff) {
                                        break
                                    }
                                }
                            }
                            calldatacopy(outputPtr, inputPtr, literalLength)
                            inputPtr := adv(inputPtr, blockEnd, literalLength, decodingFailureCode)
                            outputPtr := add(outputPtr, literalLength)
                        }
                        // if we are done reading the block, break the switch (continue the loop)
                        if iszero(lt(inputPtr, blockEnd)) {
                            break
                        }
                        // read offset (32 bits = 4 bytes reverse endianness)
                        chunk := calldataload(inputPtr)
                        let offset := or(byte(0, chunk), shl(8, byte(1, chunk)))
                        inputPtr := adv(inputPtr, blockEnd, 2, decodingFailureCode)
                        // parse length of the copy section
                        let copyLength := and(token, 0xf)
                        if eq(copyLength, 0xf) {
                            for {} 1 {} {
                                let count := byte(0, calldataload(inputPtr))
                                inputPtr := adv(inputPtr, blockEnd, 1, decodingFailureCode)
                                copyLength := add(copyLength, count)
                                if lt(count, 0xff) {
                                    break
                                }
                            }
                        }
                        copyLength := add(copyLength, MIN_MATCH)
                        // do the copy
                        for {
                            let ptr := outputPtr
                            let end := add(outputPtr, copyLength)
                            let step := xor(offset, mul(lt(copyLength, offset), xor(copyLength, offset))) // min(copyLength, offset)
                        } lt(ptr, end) {
                            ptr := add(ptr, step)
                        } {
                            mcopy(ptr, sub(ptr, offset), step)
                        }
                        outputPtr := add(outputPtr, copyLength)
                    }
                    assert(eq(inputPtr, blockEnd), decodingFailureCode)
                }
            }
            // reserve used memory
            mstore(output, sub(outputPtr, add(output, 0x20)))
            mstore(0x40, outputPtr)
        }
    }
}
