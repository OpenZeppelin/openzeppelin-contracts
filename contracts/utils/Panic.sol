// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Helper library for emitting standardized panic codes.
 *
 * Follows the list from libsolutil: https://github.com/ethereum/solidity/blob/v0.8.24/libsolutil/ErrorCodes.h
 */
// slither-disable-next-line unused-state
library Panic {
    /// @dev generic / unspecified error
    uint256 internal constant Generic = 0x00;
    /// @dev used by the assert() builtin
    uint256 internal constant Assert = 0x01;
    /// @dev arithmetic underflow or overflow
    uint256 internal constant UnderOverflow = 0x11;
    /// @dev division or modulo by zero
    uint256 internal constant DivisionByZero = 0x12;
    /// @dev enum conversion error
    uint256 internal constant EnumConversionError = 0x21;
    /// @dev invalid encoding in storage
    uint256 internal constant StorageEncodingError = 0x22;
    /// @dev empty array pop
    uint256 internal constant EmptyArrayPop = 0x31;
    /// @dev array out of bounds access
    uint256 internal constant ArrayOutOfBounds = 0x32;
    /// @dev resource error (too large allocation or too large array)
    uint256 internal constant ResourceError = 0x41;
    /// @dev calling invalid internal function
    uint256 internal constant InvalidInternalFunction = 0x51;

    function panic(uint256 code) internal pure {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, shl(0xe0, 0x4e487b71))
            mstore(0x04, code)
            revert(0x00, 0x24)
        }
    }
}
