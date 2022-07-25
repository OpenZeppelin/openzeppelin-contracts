// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (utils/Strings.sol)

pragma solidity ^0.8.0;

/**
 * @dev String operations.
 */
library Strings {
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";
    uint8 private constant _ADDRESS_LENGTH = 20;

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory result) {
        unchecked {
            if (value < 10) {
                return string(abi.encodePacked(uint8(value + 48)));
            }
            uint256 length = 0;
            uint256 valueCopy = value;
            if (valueCopy >= 10**63) {
                valueCopy /= 10**64;
                length += 64;
            }
            if (valueCopy >= 10**31) {
                valueCopy /= 10**32;
                length += 32;
            }
            if (valueCopy >= 10**15) {
                valueCopy /= 10**16;
                length += 16;
            }
            if (valueCopy >= 10**7) {
                valueCopy /= 10**8;
                length += 8;
            }
            if (valueCopy >= 10**3) {
                valueCopy /= 10**4;
                length += 4;
            }
            if (valueCopy >= 10**1) {
                valueCopy /= 10**2;
                length += 2;
            }
            if (valueCopy >= 1) {
                length += 1;
            }
            result = new string(length);
            /// @solidity memory-safe-assembly
            assembly {
                let ptr := add(result, add(length, 32))
                for {

                } gt(value, 0) {

                } {
                    ptr := sub(ptr, 1)
                    mstore8(ptr, add(48, mod(value, 10)))
                    value := div(value, 10)
                }
            }
        }
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
     * @dev Converts an `address` with fixed length of 20 bytes to its not checksummed ASCII `string` hexadecimal representation.
     */
    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), _ADDRESS_LENGTH);
    }
}
