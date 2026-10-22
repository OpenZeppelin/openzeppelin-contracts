// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Calldata.sol)
// This file was procedurally generated from scripts/generate/templates/Calldata.sol.eta.

pragma solidity ^0.8.20;

/**
 * @dev Helper library for manipulating objects in calldata.
 */
library Calldata {
    /// @dev Returns an empty `string calldata`.
    // slither-disable-next-line write-after-write
    function emptyString() internal pure returns (string calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    /// @dev Returns an empty `bytes calldata`.
    // slither-disable-next-line write-after-write
    function emptyBytes() internal pure returns (bytes calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    /// @dev Returns an empty `address[] calldata`.
    // slither-disable-next-line write-after-write
    function emptyAddressArray() internal pure returns (address[] calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    /// @dev Returns an empty `bool[] calldata`.
    // slither-disable-next-line write-after-write
    function emptyBooleanArray() internal pure returns (bool[] calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    /// @dev Returns an empty `bytes32[] calldata`.
    // slither-disable-next-line write-after-write
    function emptyBytes32Array() internal pure returns (bytes32[] calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    /// @dev Returns an empty `uint256[] calldata`.
    // slither-disable-next-line write-after-write
    function emptyUint256Array() internal pure returns (uint256[] calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    /// @dev Returns an empty `int256[] calldata`.
    // slither-disable-next-line write-after-write
    function emptyInt256Array() internal pure returns (int256[] calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    /// @dev Returns an empty `string[] calldata`.
    // slither-disable-next-line write-after-write
    function emptyStringArray() internal pure returns (string[] calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }

    /// @dev Returns an empty `bytes[] calldata`.
    // slither-disable-next-line write-after-write
    function emptyBytesArray() internal pure returns (bytes[] calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }
}
