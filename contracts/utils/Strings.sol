// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

/**
 * @dev String operations.
 */
library Strings {
    /**
     * @dev Converts a `uint256` to its ASCII `string` representation.
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
        uint256 index = digits - 1;
        temp = value;
        while (temp != 0) {
            buffer[index--] = byte(uint8(48 + temp % 10));
            temp /= 10;
        }
        return string(buffer);
    }

    function toHex(bool flag) internal pure returns(string memory) {
        return toHex(abi.encodePacked(flag));
    }

    function toHex(address account) internal pure returns(string memory) {
        return toHex(abi.encodePacked(account));
    }

    function toHex(uint256 value) internal pure returns(string memory) {
        return toHex(abi.encodePacked(value));
    }

    function toHex(bytes32 value) internal pure returns(string memory) {
        return toHex(abi.encodePacked(value));
    }

    function toHex(bytes memory data) internal pure returns(string memory) {
        bytes16 alphabet = 0x30313233343536373839616263646566;

        bytes memory str = new bytes(data.length * 2);
        for (uint i = 0; i < data.length; i++) {
            str[i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[i*2 + 1] = alphabet[uint(uint8(data[i] & 0x0f))];
        }

        return string(str);
    }
}
