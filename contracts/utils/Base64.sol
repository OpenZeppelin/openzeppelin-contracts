// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/Base64.sol)

pragma solidity ^0.8.20;

import {SafeCast} from "./math/SafeCast.sol";

/**
 * @dev Provides a set of functions to operate with Base64 strings.
 */
library Base64 {
    using SafeCast for bool;

    /**
     * @dev Base64 Encoding/Decoding Table
     * See sections 4 and 5 of https://datatracker.ietf.org/doc/html/rfc4648
     */
    bytes internal constant _TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    bytes internal constant _TABLE_URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

    /**
     * @dev Converts a `bytes` to its Bytes64 `string` representation.
     */
    function encode(bytes memory data) internal pure returns (string memory) {
        return string(_encode(data, _TABLE, true));
    }

    /**
     * @dev Converts a `bytes` to its Bytes64Url `string` representation.
     * Output is not padded with `=` as specified in https://www.rfc-editor.org/rfc/rfc4648[rfc4648].
     */
    function encodeURL(bytes memory data) internal pure returns (string memory) {
        return string(_encode(data, _TABLE_URL, false));
    }

    /**
     * @dev Converts a Base64 `string` to the `bytes` it represents.
     *
     * * Supports padded an unpadded inputs.
     * * Supports both encoding ({encode} and {encodeURL}) seamlessly.
     * * Does NOT revert if the input is not a valid Base64 string.
     */
    function decode(string memory data) internal pure returns (bytes memory) {
        return _decode(bytes(data));
    }

    /**
     * @dev Internal table-agnostic conversion
     */
    function _encode(bytes memory data, bytes memory table, bool withPadding) private pure returns (bytes memory) {
        /**
         * Inspired by Brecht Devos (Brechtpd) implementation - MIT licence
         * https://github.com/Brechtpd/base64/blob/e78d9fd951e7b0977ddca77d92dc85183770daf4/base64.sol
         */
        if (data.length == 0) return "";

        // If padding is enabled, the final length should be `bytes` data length divided by 3 rounded up and then
        // multiplied by 4 so that it leaves room for padding the last chunk
        // - `data.length + 2`  -> Prepare for division rounding up
        // - `/ 3`              -> Number of 3-bytes chunks (rounded up)
        // - `4 *`              -> 4 characters for each chunk
        // This is equivalent to: 4 * Math.ceil(data.length / 3)
        //
        // If padding is disabled, the final length should be `bytes` data length multiplied by 4/3 rounded up as
        // opposed to when padding is required to fill the last chunk.
        // - `4 * data.length`  -> 4 characters for each chunk
        // - ` + 2`             -> Prepare for division rounding up
        // - `/ 3`              -> Number of 3-bytes chunks (rounded up)
        // This is equivalent to: Math.ceil((4 * data.length) / 3)
        uint256 resultLength = withPadding ? 4 * ((data.length + 2) / 3) : (4 * data.length + 2) / 3;

        bytes memory result = new bytes(resultLength);

        assembly ("memory-safe") {
            // Prepare the lookup table (skip the first "length" byte)
            let tablePtr := add(table, 1)

            // Prepare result pointer, jump over length
            let resultPtr := add(result, 0x20)
            let dataPtr := data
            let endPtr := add(data, mload(data))

            // In some cases, the last iteration will read bytes after the end of the data. We cache the value, and
            // set it to zero to make sure no dirty bytes are read in that section.
            let afterPtr := add(endPtr, 0x20)
            let afterCache := mload(afterPtr)
            mstore(afterPtr, 0x00)

            // Run over the input, 3 bytes at a time
            for {} lt(dataPtr, endPtr) {} {
                // Advance 3 bytes
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                // To write each character, shift the 3 byte (24 bits) chunk
                // 4 times in blocks of 6 bits for each character (18, 12, 6, 0)
                // and apply logical AND with 0x3F to bitmask the least significant 6 bits.
                // Use this as an index into the lookup table, mload an entire word
                // so the desired character is in the least significant byte, and
                // mstore8 this least significant byte into the result and continue.

                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1) // Advance

                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1) // Advance

                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1) // Advance

                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1) // Advance
            }

            // Reset the value that was cached
            mstore(afterPtr, afterCache)

            if withPadding {
                // When data `bytes` is not exactly 3 bytes long
                // it is padded with `=` characters at the end
                switch mod(mload(data), 3)
                case 1 {
                    mstore8(sub(resultPtr, 1), 0x3d)
                    mstore8(sub(resultPtr, 2), 0x3d)
                }
                case 2 {
                    mstore8(sub(resultPtr, 1), 0x3d)
                }
            }
        }

        return result;
    }

    function _decode(bytes memory data) private pure returns (bytes memory) {
        if (data.length == 0) return "";

        uint256 resultLength = (data.length / 4) * 3;
        if (data.length % 4 == 0) {
            resultLength -= (data[data.length - 1] == "=").toUint() + (data[data.length - 2] == "=").toUint();
        } else {
            resultLength += (data.length % 4) - 1;
        }

        bytes memory result = new bytes(resultLength);

        assembly ("memory-safe") {
            // Magic values. This writes over FMP (0x40) and zero slot (0x60) that will have to be reset.
            let m := 0xfc000000fc00686c7074787c8084888c9094989ca0a4a8acb0b4b8bcc0c4c8cc
            mstore(0x5b, m)
            mstore(0x3b, 0x04080c1014181c2024282c3034383c4044484c5054585c6064)
            mstore(0x1a, 0xf8fcf800fcd0d4d8dce0e4e8ecf0f4)

            // Prepare result pointer, jump over length
            let dataPtr := data
            let resultPtr := add(result, 0x20)
            let endPtr := add(resultPtr, resultLength)

            for {} lt(resultPtr, endPtr) {} {
                // Advance 4 bytes
                dataPtr := add(dataPtr, 4)
                let input := mload(dataPtr)

                mstore(
                    resultPtr,
                    or(
                        and(m, mload(byte(28, input))),
                        shr(
                            6,
                            or(
                                and(m, mload(byte(29, input))),
                                shr(6, or(and(m, mload(byte(30, input))), shr(6, and(m, mload(byte(31, input))))))
                            )
                        )
                    )
                )

                resultPtr := add(resultPtr, 3)
            }

            // Restore FMP and zero slot.
            mstore(0x40, endPtr)
            mstore(0x60, 0)
        }

        return result;
    }
}
