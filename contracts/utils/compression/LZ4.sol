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

    /**
     * @dev Implementation of LZ4's decompress function.
     *
     * See https://github.com/Benzinga/lz4js/blob/master/lz4.js
     */
    function decompress(bytes memory input) internal pure returns (bytes memory output) {
        assembly ("memory-safe") {
            function assert(b, e) {
                if iszero(b) {
                    mstore(0, e)
                    revert(0, 0x04)
                }
            }
            // load 16 bytes from a given location in memory, right aligned and in reverse order
            function readU16(ptr) -> value {
                value := mload(ptr)
                value := or(byte(0, value), shl(8, byte(1, value)))
            }
            // load 32 bytes from a given location in memory, right aligned and in reverse order
            function readU32(ptr) -> value {
                value := mload(ptr)
                value := or(
                    or(byte(0, value), shl(8, byte(1, value))),
                    or(shl(16, byte(2, value)), shl(24, byte(3, value)))
                )
            }

            // input buffer
            let inputPtr := add(input, 0x20)
            // let inputEnd := add(inputPtr, mload(input)) // TODO: use to check bounds

            // output buffer
            output := mload(0x40)
            let outputPtr := add(output, 0x20)

            // ========================================== decompress frame ===========================================
            // TODO CHECK LENGTH BEFORE

            // Get header (size must be at least 7 / 15 depending on useContentSize )
            // [ magic (4) ++ descriptor (1) ++ bsIds (1) ++ contentsize (0 or 8) ++ ??? (1) ]
            let header := mload(inputPtr)

            // read magic number (first 4 bytes, realigned right)
            assert(eq(shr(224, header), MAGIC_NUM), 0x00000001) // TODO: error code

            // read descriptor and check version
            let descriptor := byte(4, header)
            assert(eq(and(descriptor, FD_VERSION_MASK), FD_VERSION), 0x00000002) // TODO: error code

            // read flags
            let useBlockSum := eq(and(descriptor, FD_BLOCK_CHKSUM), FD_BLOCK_CHKSUM)
            let useContentSize := eq(and(descriptor, FD_CONTENT_SIZE), FD_CONTENT_SIZE)

            // read block size
            // let bsIdx := and(shr(BS_SHIFT, byte(5, header)), BS_MASK)
            // TODO: check bsMap? value should probably be in [4, 7], otherwise unused

            // move forward 7 bytes
            inputPtr := add(inputPtr, add(7, mul(useContentSize, 8)))

            // read blocks
            for {} 1 {} {
                let compSize := readU32(inputPtr)

                if iszero(compSize) {
                    break
                }

                // read block checksum if "useBlockSum" is true?
                inputPtr := add(inputPtr, add(4, mul(useBlockSum, 4)))

                // check if block is compressed
                switch iszero(and(compSize, BS_UNCOMPRESSED))
                case 0 {
                    // mask off the 'uncompressed' bit
                    compSize := and(compSize, not(BS_UNCOMPRESSED))
                    // copy uncompressed chunk
                    mcopy(outputPtr, inputPtr, compSize)
                    inputPtr := add(inputPtr, compSize)
                    outputPtr := add(outputPtr, compSize)
                }
                case 1 {
                    for {
                        let blockEnd := add(inputPtr, compSize)
                    } lt(inputPtr, blockEnd) {} {
                        let token := byte(0, mload(inputPtr))
                        inputPtr := add(inputPtr, 1)

                        // copy literals.
                        let literalCount := shr(4, token)
                        if literalCount {
                            // Parse length.
                            if eq(literalCount, 0xf) {
                                for {} 1 {} {
                                    let count := byte(0, mload(inputPtr))
                                    inputPtr := add(inputPtr, 1)
                                    literalCount := add(literalCount, count)
                                    if lt(count, 0xff) {
                                        break
                                    }
                                }
                            }
                            mcopy(outputPtr, inputPtr, literalCount)
                            inputPtr := add(inputPtr, literalCount)
                            outputPtr := add(outputPtr, literalCount)
                        }

                        if lt(inputPtr, blockEnd) {
                            // Copy match.
                            let mLength := and(token, 0xf)

                            // Parse offset.
                            let mOffset := readU16(inputPtr)
                            inputPtr := add(inputPtr, 2)

                            // Parse length.
                            if eq(mLength, 0xf) {
                                for {} 1 {} {
                                    let count := byte(0, mload(inputPtr))
                                    inputPtr := add(inputPtr, 1)
                                    mLength := add(mLength, count)
                                    if lt(count, 0xff) {
                                        break
                                    }
                                }
                            }
                            mLength := add(mLength, MIN_MATCH)

                            for {
                                let ptr := outputPtr
                                let end := add(outputPtr, mLength)
                                let step := xor(mOffset, mul(lt(mLength, mOffset), xor(mLength, mOffset))) // min(mLength, mOffset)
                            } lt(ptr, end) {
                                ptr := add(ptr, step)
                            } {
                                mcopy(ptr, sub(ptr, mOffset), step)
                            }
                            outputPtr := add(outputPtr, mLength)
                        }
                    }
                }
            }

            // reserve used memory
            mstore(output, sub(outputPtr, add(output, 0x20)))
            mstore(0x40, outputPtr)
        }
    }
}
