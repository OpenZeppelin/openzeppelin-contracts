// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/Bytes.sol)

pragma solidity ^0.8.24;

import {Math} from "./math/Math.sol";

/**
 * @dev Bytes operations.
 */
library Bytes {
    /**
     * @dev Forward search for `s` in `buffer`
     * * If `s` is present in the buffer, returns the index of the first instance
     * * If `s` is not present in the buffer, returns type(uint256).max
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf[Javascript's `Array.indexOf`]
     */
    function indexOf(bytes memory buffer, bytes1 s) internal pure returns (uint256) {
        return indexOf(buffer, s, 0);
    }

    /**
     * @dev Forward search for `s` in `buffer` starting at position `pos`
     * * If `s` is present in the buffer (at or after `pos`), returns the index of the next instance
     * * If `s` is not present in the buffer (at or after `pos`), returns type(uint256).max
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf[Javascript's `Array.indexOf`]
     */
    function indexOf(bytes memory buffer, bytes1 s, uint256 pos) internal pure returns (uint256) {
        uint256 length = buffer.length;
        for (uint256 i = pos; i < length; ++i) {
            if (bytes1(_unsafeReadBytesOffset(buffer, i)) == s) {
                return i;
            }
        }
        return type(uint256).max;
    }

    /**
     * @dev Backward search for `s` in `buffer`
     * * If `s` is present in the buffer, returns the index of the last instance
     * * If `s` is not present in the buffer, returns type(uint256).max
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf[Javascript's `Array.lastIndexOf`]
     */
    function lastIndexOf(bytes memory buffer, bytes1 s) internal pure returns (uint256) {
        return lastIndexOf(buffer, s, type(uint256).max);
    }

    /**
     * @dev Backward search for `s` in `buffer` starting at position `pos`
     * * If `s` is present in the buffer (at or before `pos`), returns the index of the previous instance
     * * If `s` is not present in the buffer (at or before `pos`), returns type(uint256).max
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf[Javascript's `Array.lastIndexOf`]
     */
    function lastIndexOf(bytes memory buffer, bytes1 s, uint256 pos) internal pure returns (uint256) {
        unchecked {
            uint256 length = buffer.length;
            for (uint256 i = Math.min(Math.saturatingAdd(pos, 1), length); i > 0; --i) {
                if (bytes1(_unsafeReadBytesOffset(buffer, i - 1)) == s) {
                    return i - 1;
                }
            }
            return type(uint256).max;
        }
    }

    /**
     * @dev Copies the content of `buffer`, from `start` (included) to the end of `buffer` into a new bytes object in
     * memory.
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice[Javascript's `Array.slice`]
     */
    function slice(bytes memory buffer, uint256 start) internal pure returns (bytes memory) {
        return slice(buffer, start, buffer.length);
    }

    /**
     * @dev Copies the content of `buffer`, from `start` (included) to `end` (excluded) into a new bytes object in
     * memory. The `end` argument is truncated to the length of the `buffer`.
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice[Javascript's `Array.slice`]
     */
    function slice(bytes memory buffer, uint256 start, uint256 end) internal pure returns (bytes memory) {
        // sanitize
        uint256 length = buffer.length;
        end = Math.min(end, length);
        start = Math.min(start, end);

        // allocate and copy
        bytes memory result = new bytes(end - start);
        assembly ("memory-safe") {
            mcopy(add(result, 0x20), add(add(buffer, 0x20), start), sub(end, start))
        }

        return result;
    }

    /**
     * @dev Moves the content of `buffer`, from `start` (included) to the end of `buffer` to the start of that buffer.
     *
     * NOTE: This function modifies the provided buffer in place. If you need to preserve the original buffer, use {slice} instead
     */
    function splice(bytes memory buffer, uint256 start) internal pure returns (bytes memory) {
        return splice(buffer, start, buffer.length);
    }

    /**
     * @dev Moves the content of `buffer`, from `start` (included) to end (excluded) to the start of that buffer. The
     * `end` argument is truncated to the length of the `buffer`.
     *
     * NOTE: This function modifies the provided buffer in place. If you need to preserve the original buffer, use {slice} instead
     */
    function splice(bytes memory buffer, uint256 start, uint256 end) internal pure returns (bytes memory) {
        // sanitize
        uint256 length = buffer.length;
        end = Math.min(end, length);
        start = Math.min(start, end);

        // allocate and copy
        assembly ("memory-safe") {
            mcopy(add(buffer, 0x20), add(add(buffer, 0x20), start), sub(end, start))
            mstore(buffer, sub(end, start))
        }

        return buffer;
    }

    /**
     * @dev Concatenate an array of bytes into a single bytes object.
     *
     * For fixed bytes types, we recommend using the solidity built-in `bytes.concat` or (equivalent)
     * `abi.encodePacked`.
     *
     * NOTE: this could be done in assembly with a single loop that expands starting at the FMP, but that would be
     * significantly less readable. It might be worth benchmarking the savings of the full-assembly approach.
     */
    function concat(bytes[] memory buffers) internal pure returns (bytes memory) {
        uint256 length = 0;
        for (uint256 i = 0; i < buffers.length; ++i) {
            length += buffers[i].length;
        }

        bytes memory result = new bytes(length);

        uint256 offset = 0x20;
        for (uint256 i = 0; i < buffers.length; ++i) {
            bytes memory input = buffers[i];
            assembly ("memory-safe") {
                mcopy(add(result, offset), add(input, 0x20), mload(input))
            }
            unchecked {
                offset += input.length;
            }
        }

        return result;
    }

    /**
     * @dev Returns true if the two byte buffers are equal.
     */
    function equal(bytes memory a, bytes memory b) internal pure returns (bool) {
        return a.length == b.length && keccak256(a) == keccak256(b);
    }

    /**
     * @dev Reverses the byte order of a bytes32 value, converting between little-endian and big-endian.
     * Inspired by https://graphics.stanford.edu/~seander/bithacks.html#ReverseParallel[Reverse Parallel]
     */
    function reverseBytes32(bytes32 value) internal pure returns (bytes32) {
        value = // swap bytes
            ((value >> 8) & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) |
            ((value & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) << 8);
        value = // swap 2-byte long pairs
            ((value >> 16) & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) |
            ((value & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) << 16);
        value = // swap 4-byte long pairs
            ((value >> 32) & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) |
            ((value & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) << 32);
        value = // swap 8-byte long pairs
            ((value >> 64) & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) |
            ((value & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) << 64);
        return (value >> 128) | (value << 128); // swap 16-byte long pairs
    }

    /// @dev Same as {reverseBytes32} but optimized for 128-bit values.
    function reverseBytes16(bytes16 value) internal pure returns (bytes16) {
        value = // swap bytes
            ((value & 0xFF00FF00FF00FF00FF00FF00FF00FF00) >> 8) |
            ((value & 0x00FF00FF00FF00FF00FF00FF00FF00FF) << 8);
        value = // swap 2-byte long pairs
            ((value & 0xFFFF0000FFFF0000FFFF0000FFFF0000) >> 16) |
            ((value & 0x0000FFFF0000FFFF0000FFFF0000FFFF) << 16);
        value = // swap 4-byte long pairs
            ((value & 0xFFFFFFFF00000000FFFFFFFF00000000) >> 32) |
            ((value & 0x00000000FFFFFFFF00000000FFFFFFFF) << 32);
        return (value >> 64) | (value << 64); // swap 8-byte long pairs
    }

    /// @dev Same as {reverseBytes32} but optimized for 64-bit values.
    function reverseBytes8(bytes8 value) internal pure returns (bytes8) {
        value = ((value & 0xFF00FF00FF00FF00) >> 8) | ((value & 0x00FF00FF00FF00FF) << 8); // swap bytes
        value = ((value & 0xFFFF0000FFFF0000) >> 16) | ((value & 0x0000FFFF0000FFFF) << 16); // swap 2-byte long pairs
        return (value >> 32) | (value << 32); // swap 4-byte long pairs
    }

    /// @dev Same as {reverseBytes32} but optimized for 32-bit values.
    function reverseBytes4(bytes4 value) internal pure returns (bytes4) {
        value = ((value & 0xFF00FF00) >> 8) | ((value & 0x00FF00FF) << 8); // swap bytes
        return (value >> 16) | (value << 16); // swap 2-byte long pairs
    }

    /// @dev Same as {reverseBytes32} but optimized for 16-bit values.
    function reverseBytes2(bytes2 value) internal pure returns (bytes2) {
        return (value >> 8) | (value << 8);
    }

    /**
     * @dev Counts the number of leading zero bits a bytes array. Returns `8 * buffer.length`
     * if the buffer is all zeros.
     */
    function clz(bytes memory buffer) internal pure returns (uint256) {
        for (uint256 i = 0; i < buffer.length; i += 0x20) {
            bytes32 chunk = _unsafeReadBytesOffset(buffer, i);
            if (chunk != bytes32(0)) {
                return Math.min(8 * i + Math.clz(uint256(chunk)), 8 * buffer.length);
            }
        }
        return 8 * buffer.length;
    }

    /**
     * @dev Reads a bytes32 from a bytes array without bounds checking.
     *
     * NOTE: making this function internal would mean it could be used with memory unsafe offset, and marking the
     * assembly block as such would prevent some optimizations.
     */
    function _unsafeReadBytesOffset(bytes memory buffer, uint256 offset) private pure returns (bytes32 value) {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            value := mload(add(add(buffer, 0x20), offset))
        }
    }
}
