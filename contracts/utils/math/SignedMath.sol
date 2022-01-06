// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Standard signed math utilities missing in the Solidity language.
 */
library SignedMath {
    /**
     * @dev Returns the largest of two signed numbers.
     */
    function max(int256 a, int256 b) internal pure returns (int256) {
        return a >= b ? a : b;
    }

    /**
     * @dev Returns the smallest of two signed numbers.
     */
    function min(int256 a, int256 b) internal pure returns (int256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two signed numbers. The result is rounded
     * towards zero.
     */
    function average(int256 a, int256 b) internal pure returns (int256) {
        // (a + b) / 2 can overflow, and the unsigned formula doesn't simply translate to signed integers
        int256 base = (a & b) + (a ^ b) / 2;
        if ((a < 0 && b < 0) || ((a < 0 || b < 0) && (a + b > 0))) {
            return base + (a ^ b) % 2;
        } else {
            return base;
        }
    }

    /**
     * @dev Returns the ceiling of the division of two signed numbers.
     *
     * This differs from standard division with `/` in that it rounds up instead
     * of rounding down.
     */
    function ceilDiv(int256 a, int256 b) internal pure returns (int256) {
        int256 z = a / b;
        int256 r = a % b == 0 ? int256(0) : int256(1);
        return z < 0 ? z - r : z + r;
    }
}
