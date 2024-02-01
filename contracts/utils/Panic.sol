// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Helper library for emitting standardized panic codes.
 */
library Panic {
    uint256 constant ASSERTION_ERROR = 0x1;
    uint256 constant ARITHMETIC_UNDER_OR_OVERFLOW = 0x11;
    uint256 constant DIVISION_BY_ZERO = 0x12;
    uint256 constant ENUM_CONVERSION_OUT_OF_BOUNDS = 0x21;
    uint256 constant INCORRECTLY_ENCODED_STORAGE_BYTE_ARRAY = 0x22;
    uint256 constant POP_ON_EMPTY_ARRAY = 0x31;
    uint256 constant ARRAY_ACCESS_OUT_OF_BOUNDS = 0x32;
    uint256 constant TOO_MUCH_MEMORY_ALLOCATED = 0x41;
    uint256 constant ZERO_INITIALIZED_VARIABLE = 0x51;

    function panic(uint256 code) internal pure {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, shl(0xe0, 0x4e487b71))
            mstore(0x04, code)
            revert(0x00, 0x24)
        }
    }
}
