// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (utils/Strings.sol)

pragma solidity ^0.8.0;

/**
 * @dev String operations.
 */
library Strings {
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0x00";
        }
        uint256 temp = value;
        uint256 length = 0;
        while (temp != 0) {
            length++;
            temp >>= 8;
        }
        return toHexString(value, length);
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

    /**
     * @dev Convert each lower-case character ('a' to 'z') of a basic-ASCII `string` to it's
     * upper-case form ('A' to 'Z') and returns an upper-case normalized, basic-ASCII string.
     */
    function normalizeUpperASCII(string calldata value) internal pure returns (string memory) {
        // get the string's bytes so we can enumerate with .length.
        bytes memory buffer = bytes(value);
        for (uint256 i = 0; i < buffer.length; i++) {
            // require basic-ASCII input. 0x80 is a mask that signals non-basic-ASCII characters.
            require(buffer[i] & 0x80 == 0, "Basic ASCII string required.");
            // only work on lower-case characters.
            if (buffer[i] >= "a" && buffer[i] <= "z") {
                // remove the lower-case bit. 0xDF is the bit-wise complement ('~') of
                // the lower-case bit mask (0x20).
                buffer[i] &= ~bytes1(0x20);
            }
        }
        // return the upper-case normalized, basic-ASCII string result.
        return string(buffer);
    }

    /**
     * @dev Converts each upper-case character ('A' to 'Z') of a basic-ASCII `string` to it's
     * lower-case form ('a' to 'z') and returns a lower-case normalized, basic-ASCII string.
     */
    function normalizeLowerASCII(string calldata value) internal pure returns (string memory) {
        // get the string's bytes so we can enumerate with .length.
        bytes memory buffer = bytes(value);
        for (uint256 i = 0; i < buffer.length; i++) {
            // require basic-ASCII input. 0x80 is a mask that signals non-basic-ASCII characters.
            require((buffer[i] & 0x80) == 0, "Basic ASCII string required.");
            // only work on upper-case characters.
            if (buffer[i] >= "A" && buffer[i] <= "Z") {
                // set the lower-case bit (0x20).
                buffer[i] |= 0x20;
            }
        }
        // return the lower-case normalized, basic-ASCII string result.
        return string(buffer);
    }
}
