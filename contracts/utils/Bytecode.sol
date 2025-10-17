// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Library for generating creation code and reading bytecode from addresses.
 */
library Bytecode {
    /**
     * @dev Error thrown when attempting to read code at an invalid range.
     */
    error InvalidCodeAtRange(uint256 size, uint256 start, uint256 end);

    /**
     * @dev Generate a creation code that results in a contract with `code` as bytecode.
     * @param code The returning value of the resulting `creationCode`
     * @return creationCode Constructor code for new contract
     */
    function creationCodeFor(bytes memory code) internal pure returns (bytes memory) {
        /*
            0x00    0x63         0x63XXXXXX  PUSH4 _code.length  size
            0x01    0x80         0x80        DUP1                size size
            0x02    0x60         0x600e      PUSH1 14            14 size size
            0x03    0x60         0x6000      PUSH1 00            0 14 size size
            0x04    0x39         0x39        CODECOPY            size
            0x05    0x60         0x6000      PUSH1 00            0 size
            0x06    0xf3         0xf3        RETURN
            <CODE>
        */

        return abi.encodePacked(hex"63", uint32(code.length), hex"80600E6000396000F3", code);
    }

    /**
     * @dev Returns the size of the code on a given address.
     * @param addr Address that may or may not contain code
     * @return size Size of the code on the given `addr`
     */
    function codeSize(address addr) internal view returns (uint256 size) {
        assembly {
            size := extcodesize(addr)
        }
    }

    /**
     * @dev Returns the code of a given address.
     *
     * Requirements:
     * - `end` must be greater than or equal to `start`
     *
     * @param addr Address that may or may not contain code
     * @param start Number of bytes of code to skip on read
     * @param end Index before which to end extraction
     * @return oCode Code read from `addr` deployed bytecode
     *
     * Forked from: https://gist.github.com/KardanovIR/fe98661df9338c842b4a30306d507fbd
     */
    function codeAt(address addr, uint256 start, uint256 end) internal view returns (bytes memory oCode) {
        uint256 csize = codeSize(addr);
        if (csize == 0) return bytes("");

        if (start > csize) return bytes("");
        if (end < start) revert InvalidCodeAtRange(csize, start, end);

        unchecked {
            uint256 reqSize = end - start;
            uint256 maxSize = csize - start;

            uint256 size = maxSize < reqSize ? maxSize : reqSize;

            assembly {
                // allocate output byte array - this could also be done without assembly
                // by using o_code = new bytes(size)
                oCode := mload(0x40)
                // new "memory end" including padding
                mstore(0x40, add(oCode, and(add(add(size, 0x20), 0x1f), not(0x1f))))
                // store length in memory
                mstore(oCode, size)
                // actually retrieve the code, this needs assembly
                extcodecopy(addr, add(oCode, 0x20), start, size)
            }
        }
    }
}
