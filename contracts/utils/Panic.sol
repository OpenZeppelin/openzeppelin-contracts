// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Helper library for emitting standardized panic codes.
 */
library Panic {
    // slither-disable-start unused-state-variable
    uint256 internal constant ASSERTION_ERROR = 0x1;
    uint256 internal constant ARITHMETIC_UNDER_OR_OVERFLOW = 0x11;
    uint256 internal constant DIVISION_BY_ZERO = 0x12;
    uint256 internal constant ENUM_CONVERSION_OUT_OF_BOUNDS = 0x21;
    uint256 internal constant INCORRECTLY_ENCODED_STORAGE_BYTE_ARRAY = 0x22;
    uint256 internal constant POP_ON_EMPTY_ARRAY = 0x31;
    uint256 internal constant ARRAY_ACCESS_OUT_OF_BOUNDS = 0x32;
    uint256 internal constant TOO_MUCH_MEMORY_ALLOCATED = 0x41;
    uint256 internal constant ZERO_INITIALIZED_VARIABLE = 0x51;

    // slither-disable-end unused-state-variable

    function panic(uint256 code) internal pure {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, shl(0xe0, 0x4e487b71))
            mstore(0x04, code)
            revert(0x00, 0x24)
        }
    }
}
