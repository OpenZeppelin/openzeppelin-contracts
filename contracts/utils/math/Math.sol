// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (utils/math/Math.sol)

pragma solidity ^0.8.0;

/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library Math {
    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow.
        return (a & b) + (a ^ b) / 2;
    }

    /**
     * @dev Returns the ceiling of the division of two numbers.
     *
     * This differs from standard division with `/` in that it rounds up instead
     * of rounding down.
     */
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b - 1) / b can overflow on addition, so we distribute.
        return a / b + (a % b == 0 ? 0 : 1);
    }

    /**
     * @dev Returns the square root of a number.
     *
     * Inspired by Henry S. Warren, Jr.'s "Hacker's Delight" (Chapter 11).
     */
    function sqrt(uint256 a) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        // For our first guess, we use the log2 of the square root. We do that by shifting `a` and only counting half
        // of the bits. the partial result produced is a power of two that verifies `result <= sqrt(a) < 2 * result`
        uint256 result = 1;
        uint256 x = a;
        if (x > 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) {
            x >>= 128;
            result <<= 64;
        }
        if (x > 0xFFFFFFFFFFFFFFFF) {
            x >>= 64;
            result <<= 32;
        }
        if (x > 0xFFFFFFFF) {
            x >>= 32;
            result <<= 16;
        }
        if (x > 0xFFFF) {
            x >>= 16;
            result <<= 8;
        }
        if (x > 0xFF) {
            x >>= 8;
            result <<= 4;
        }
        if (x > 0xF) {
            x >>= 4;
            result <<= 2;
        }
        if (x > 0x3) {
            result <<= 1;
        }

        // At this point `result` is an estimation with one bit of precision. We know the true value is a uint128,
        // since it is the square root of a uint256. Newton's method converges quadratically (precision doubles at
        // every iterration). We thus need at most 7 iterration to turn our partial result with one bit of precision
        // into the expected uint128 result.
        unchecked {
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            return min(result, a / result);
        }
    }
}
