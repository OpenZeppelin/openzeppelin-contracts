// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

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
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
     */
    function indexOf(bytes memory buffer, bytes1 s) internal pure returns (uint256) {
        return indexOf(buffer, s, 0);
    }

    /**
     * @dev Forward search for `s` in `buffer` starting at position `pos`
     * * If `s` is present in the buffer (at or after `pos`), returns the index of the next instance
     * * If `s` is not present in the buffer (at or after `pos`), returns the length of the buffer
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
     */
    function indexOf(bytes memory buffer, bytes1 s, uint256 pos) internal pure returns (uint256) {
        unchecked {
            uint256 length = buffer.length;
            for (uint256 i = pos; i < length; ++i) {
                if (buffer[i] == s) {
                    return i;
                }
            }
            return type(uint256).max;
        }
    }

    /**
     * @dev Backward search for `s` in `buffer`
     * * If `s` is present in the buffer, returns the index of the last instance
     * * If `s` is not present in the buffer, returns type(uint256).max
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf
     */
    function lastIndexOf(bytes memory buffer, bytes1 s) internal pure returns (uint256) {
        return lastIndexOf(buffer, s, type(uint256).max);
    }

    /**
     * @dev Backward search for `s` in `buffer` starting at position `pos`
     * * If `s` is present in the buffer (at or before `pos`), returns the index of the previous instance
     * * If `s` is not present in the buffer (at or before `pos`), returns the length of the buffer
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf
     */
    function lastIndexOf(bytes memory buffer, bytes1 s, uint256 pos) internal pure returns (uint256) {
        unchecked {
            uint256 length = buffer.length;
            // NOTE here we cannot do `i = Math.min(pos + 1, length)` because `pos + 1` could overflow
            for (uint256 i = Math.min(pos, length - 1) + 1; i > 0; --i) {
                if (buffer[i - 1] == s) {
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
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
     */
    function slice(bytes memory buffer, uint256 start) internal pure returns (bytes memory) {
        return slice(buffer, start, buffer.length);
    }

    /**
     * @dev Copies the content of `buffer`, from `start` (included) to `end` (excluded) into a new bytes object in
     * memory.
     *
     * NOTE: replicates the behavior of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
     */
    function slice(bytes memory buffer, uint256 start, uint256 end) internal pure returns (bytes memory) {
        // sanitize
        uint256 length = buffer.length;
        end = Math.min(end, length);
        start = Math.min(start, end);

        // allocate and copy
        bytes memory result = new bytes(end - start);
        assembly ("memory-safe") {
            mcopy(add(result, 0x20), add(buffer, add(start, 0x20)), sub(end, start))
        }

        return result;
    }

    /// @dev Reads a bytes32 from a bytes array without bounds checking.
    function unsafeReadBytesOffset(bytes memory buffer, uint256 offset) internal pure returns (bytes32 value) {
        // This is not memory safe in the general case
        assembly {
            value := mload(add(buffer, add(0x20, offset)))
        }
    }
}
