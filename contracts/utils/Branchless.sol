// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Branchless.sol.eta.

pragma solidity ^0.8.20;

/**
 * @dev Library of branchless ternary evaluations (i.e. `condition ? a : b`). Gas costs are constant.
 *
 * The `ternary` function is only implemented for `address`, `bool`, `bytes32`, `uint256` and `int256`. Smaller types
 * (e.g. `uint8`, `int64` or `bytes4`) implicitly convert to the largest type of their family, so they can be passed
 * directly. The result must then be explicitly downcast (e.g. `uint8(Branchless.ternary(condition, a, b))`).
 *
 * IMPORTANT: These functions may reduce bytecode size and consume less gas when used standalone. However, the
 * compiler may optimize Solidity ternary operations (i.e. `condition ? a : b`) to only compute one branch when
 * needed, making these functions more expensive.
 */
library Branchless {
    /// @dev Branchless ternary evaluation for `condition ? a : b` on `address` values.
    function ternary(bool condition, address a, address b) internal pure returns (address r) {
        // branchless ternary works because:
        // b ^ (a ^ b) == a
        // b ^ 0 == b
        assembly ("memory-safe") {
            r := xor(b, mul(xor(a, b), iszero(iszero(condition))))
        }
    }

    /// @dev Branchless ternary evaluation for `condition ? a : b` on `bool` values.
    function ternary(bool condition, bool a, bool b) internal pure returns (bool r) {
        // branchless ternary works because:
        // b ^ (a ^ b) == a
        // b ^ 0 == b
        assembly ("memory-safe") {
            r := xor(b, mul(xor(a, b), iszero(iszero(condition))))
        }
    }

    /// @dev Branchless ternary evaluation for `condition ? a : b` on `bytes32` values.
    function ternary(bool condition, bytes32 a, bytes32 b) internal pure returns (bytes32 r) {
        // branchless ternary works because:
        // b ^ (a ^ b) == a
        // b ^ 0 == b
        assembly ("memory-safe") {
            r := xor(b, mul(xor(a, b), iszero(iszero(condition))))
        }
    }

    /// @dev Branchless ternary evaluation for `condition ? a : b` on `uint256` values.
    function ternary(bool condition, uint256 a, uint256 b) internal pure returns (uint256 r) {
        // branchless ternary works because:
        // b ^ (a ^ b) == a
        // b ^ 0 == b
        assembly ("memory-safe") {
            r := xor(b, mul(xor(a, b), iszero(iszero(condition))))
        }
    }

    /// @dev Branchless ternary evaluation for `condition ? a : b` on `int256` values.
    function ternary(bool condition, int256 a, int256 b) internal pure returns (int256 r) {
        // branchless ternary works because:
        // b ^ (a ^ b) == a
        // b ^ 0 == b
        assembly ("memory-safe") {
            r := xor(b, mul(xor(a, b), iszero(iszero(condition))))
        }
    }
}
