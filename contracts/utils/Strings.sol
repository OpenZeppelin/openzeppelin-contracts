// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/Strings.sol)

pragma solidity ^0.8.20;

import {Math} from "./math/Math.sol";
import {SignedMath} from "./math/SignedMath.sol";

/**
 * @dev String operations.
 */
library Strings {
    bytes16 private constant HEX_DIGITS = "0123456789abcdef";
    uint8 private constant ADDRESS_LENGTH = 20;

    /**
     * @dev The `value` string doesn't fit in the specified `length`.
     */
    error StringsInsufficientHexLength(uint256 value, uint256 length);

    /**
     * @dev The string being parsed contains characters that are not in scope of the given base.
     */
    error StringsInvalidChar(bytes1 chr, uint8 base);

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = Math.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            /// @solidity memory-safe-assembly
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                /// @solidity memory-safe-assembly
                assembly {
                    mstore8(ptr, byte(mod(value, 10), HEX_DIGITS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    /**
     * @dev Converts a `int256` to its ASCII `string` decimal representation.
     */
    function toStringSigned(int256 value) internal pure returns (string memory) {
        return string.concat(value < 0 ? "-" : "", toString(SignedMath.abs(value)));
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        unchecked {
            return toHexString(value, Math.log256(value) + 1);
        }
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        uint256 localValue = value;
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = HEX_DIGITS[localValue & 0xf];
            localValue >>= 4;
        }
        if (localValue != 0) {
            revert StringsInsufficientHexLength(value, length);
        }
        return string(buffer);
    }

    /**
     * @dev Converts an `address` with fixed length of 20 bytes to its not checksummed ASCII `string` hexadecimal
     * representation.
     */
    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), ADDRESS_LENGTH);
    }

    /**
     * @dev Converts an `address` with fixed length of 20 bytes to its checksummed ASCII `string` hexadecimal
     * representation, according to EIP-55.
     */
    function toChecksumHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = bytes(toHexString(addr));

        // hash the hex part of buffer (skip length + 2 bytes, length 40)
        uint256 hashValue;
        assembly ("memory-safe") {
            hashValue := shr(96, keccak256(add(buffer, 0x22), 40))
        }

        for (uint256 i = 41; i > 1; --i) {
            // possible values for buffer[i] are 48 (0) to 57 (9) and 97 (a) to 102 (f)
            if (hashValue & 0xf > 7 && uint8(buffer[i]) > 96) {
                // case shift by xoring with 0x20
                buffer[i] ^= 0x20;
            }
            hashValue >>= 4;
        }
        return string(buffer);
    }

    /**
     * @dev Returns true if the two strings are equal.
     */
    function equal(string memory a, string memory b) internal pure returns (bool) {
        return bytes(a).length == bytes(b).length && keccak256(bytes(a)) == keccak256(bytes(b));
    }

    /**
     * @dev Parse a decimal string and returns the value as a `uint256`.
     *
     * This function will revert if:
     * - the string contains any character that is not in [0-9].
     * - the result does not fit in a `uint256`.
     */
    function toUint(string memory input) internal pure returns (uint256) {
        bytes memory buffer = bytes(input);

        uint256 result = 0;
        uint256 bufferLength = buffer.length;
        for (uint256 i = 0; i < bufferLength; ++i) {
            result *= 10; // will revert if overflow
            result += _parseChr(buffer[i], 10);
        }
        return result;
    }

    /**
     * @dev Parse a decimal string and returns the value as a `int256`.
     *
     * This function will revert if:
     * - the string contains any character (outside the prefix) that is not in [0-9].
     * - the result does not fit in a `int256`.
     */
    function toInt(string memory input) internal pure returns (int256) {
        bytes memory buffer = bytes(input);

        // check presence of a negative sign.
        bool isNegative = bytes1(buffer) == 0x2d;
        int8 factor = isNegative ? int8(-1) : int8(1);

        int256 result = 0;
        uint256 bufferLength = buffer.length;
        for (uint256 i = isNegative ? 1 : 0; i < bufferLength; ++i) {
            result *= 10; // will revert if overflow
            result += factor * int8(_parseChr(buffer[i], 10)); // parseChr is at most 9, it fits into an int8
        }
        return result;
    }

    /**
     * @dev Parse a hexadecimal string (with or without "0x" prefix), and returns the value as a `uint256`.
     *
     * This function will revert if:
     * - the string contains any character (outside the prefix) that is not in [0-9a-fA-F].
     * - the result does not fit in a `uint256`.
     */
    function hexToUint(string memory input) internal pure returns (uint256) {
        bytes memory buffer = bytes(input);

        // skip 0x prefix if present. Length check doesn't appear to be critical
        uint256 offset = bytes2(buffer) == 0x3078 ? 2 : 0;

        uint256 result = 0;
        uint256 bufferLength = buffer.length;
        for (uint256 i = offset; i < bufferLength; ++i) {
            result *= 16; // will revert if overflow
            result += _parseChr(buffer[i], 16);
        }
        return result;
    }

    function _parseChr(bytes1 chr, uint8 base) private pure returns (uint8) {
        uint8 value = uint8(chr);

        // Try to parse `chr`:
        // - Case 1: [0-9]
        // - Case 2: [a-z]
        // - Case 2: [A-Z]
        // - otherwise not supported
        unchecked {
            if (value > 47 && value < 58) value -= 48;
            else if (value > 96 && value < 123) value -= 87;
            else if (value > 64 && value < 91) value -= 55;
            else revert StringsInvalidChar(chr, base);
        }

        // check base
        if (value >= base) revert StringsInvalidChar(chr, base);

        return value;
    }
}
