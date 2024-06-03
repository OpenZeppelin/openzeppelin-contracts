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
    bytes16 private constant HEX_DIGITS_CAPITAL = "0123456789ABCDEF";
    uint8 private constant ADDRESS_LENGTH = 20;

    /**
     * @dev The `value` string doesn't fit in the specified `length`.
     */
    error StringsInsufficientHexLength(uint256 value, uint256 length);

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
        if (length < Math.log256(value) + 1) {
            revert StringsInsufficientHexLength(value, length);
        }

        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        _setHexString(buffer, 2, value);

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
        bytes memory lowercase = new bytes(40);
        uint160 addrValue = uint160(address)
        _setHexString(lowercase, 0, addrValue);
        bytes32 hashedAddr = keccak256(abi.encodePacked(lowercase));

        bytes memory buffer = new bytes(42);
        buffer[0] = "0";
        buffer[1] = "x";
        uint160 addrValue = uint160(addr);
        uint160 hashValue = uint160(bytes20(hashedAddr));
        for (uint256 i = 41; i > 1; --i) {
            if (hashValue & 0xf > 7) {
                buffer[i] = HEX_DIGITS_CAPITAL[addrValue & 0xf];
            } else {
                buffer[i] = HEX_DIGITS[addrValue & 0xf];
            }
            addrValue >>= 4;
            hashValue >>= 4;
        }
        return string(abi.encodePacked(buffer));
    }

    /**
     * @dev Returns true if the two strings are equal.
     */
    function equal(string memory a, string memory b) internal pure returns (bool) {
        return bytes(a).length == bytes(b).length && keccak256(bytes(a)) == keccak256(bytes(b));
    }

    /**
     * @dev Sets the hexadecimal representation of a value in the specified buffer starting from the given offset.
     */
    function _setHexString(bytes memory buffer, uint256 offset, uint256 value) private pure {
        for (uint256 i = buffer.length; i > offset; --i) {
            buffer[i - 1] = HEX_DIGITS[value & 0xf];
            value >>= 4;
        }
    }
}
