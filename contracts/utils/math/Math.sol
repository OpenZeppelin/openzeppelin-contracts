// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (utils/math/Math.sol)

pragma solidity ^0.8.0;

/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library Math {
    enum Rounding {
        Down, // Toward negative infinity
        Up, // Toward infinity
        Zero // Toward zero
    }

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
     * @dev Returns the result of the muldiv operation with support for rounding directions.
     *
     * In order to do so, we return:
     * - `(a * b - 1) / denominator + 1` if rounding up
     * - `(a * b) / denominator` otherwize
     *
     * See inline comments for details about the overflow protection.
     */
    function mulDiv(
        uint256 a,
        uint256 b,
        uint256 denominator,
        Rounding direction
    ) internal pure returns (uint256 result) {
        // 512-bit multiply [prod1 prod0] = a * b
        // Compute the product mod 2**256 and mod 2**256 - 1
        // then use the Chinese Remainder Theorem to reconstruct
        // the 512 bit result. The result is stored in two 256
        // variables such that product = prod1 * 2**256 + prod0
        uint256 prod0; // Least significant 256 bits of the product
        uint256 prod1; // Most significant 256 bits of the product
        assembly {
            let mm := mulmod(a, b, not(0))
            prod0 := mul(a, b)
            prod1 := sub(sub(mm, prod0), lt(mm, prod0))
        }

        // Handle non-overflow cases, 256 by 256 division
        if (prod1 == 0) {
            require(denominator > 0);

            assembly {
                switch direction
                case 1 { // Rounding.Up
                    result := mul(iszero(iszero(prod0)), add(div(sub(prod0, 1), denominator), 1))
                }
                default {
                    result := div(prod0, denominator)
                }
            }
            return result;

        // Handle overflow cases, 512 by 256 division
        } else {
            // Make sure the result is less than 2**256.
            // Also prevents denominator == 0
            require(denominator > prod1);

            // If rounding up, prepare the product
            if (direction == Rounding.Up) {
                assembly {
                    switch prod0
                    case 0 {
                        prod1 := sub(prod1, 1)
                        prod0 := not(0)
                    }
                    default {
                        prod0 := sub(prod0, 1)
                    }
                }
            }

            ///////////////////////////////////////////////
            // 512 by 256 division.
            ///////////////////////////////////////////////

            // Make division exact by subtracting the remainder from [prod1 prod0]
            // Compute remainder using mulmod
            uint256 remainder;
            assembly {
                remainder := mulmod(a, b, denominator)
            }
            // Subtract 256 bit number from 512 bit number
            assembly {
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }

            // Factor powers of two out of denominator
            // Compute largest power of two divisor of denominator.
            // Always >= 1.
            uint256 twos = (~denominator + 1) & denominator;
            // Divide denominator by power of two
            assembly {
                denominator := div(denominator, twos)
            }

            // Divide [prod1 prod0] by the factors of two
            assembly {
                prod0 := div(prod0, twos)
            }
            // Shift in bits from prod1 into prod0. For this we need
            // to flip `twos` such that it is 2**256 / twos.
            // If twos is zero, then it becomes one
            assembly {
                twos := add(div(sub(0, twos), twos), 1)
            }
            prod0 |= prod1 * twos;

            // Invert denominator mod 2**256
            // Now that denominator is an odd number, it has an inverse
            // modulo 2**256 such that denominator * inv = 1 mod 2**256.
            // Compute the inverse by starting with a seed that is correct
            // correct for four bits. That is, denominator * inv = 1 mod 2**4
            unchecked {
                uint256 inv = denominator ** 3;
                // Now use Newton-Raphson iteration to improve the precision.
                // Thanks to Hensel's lifting lemma, this also works in modular
                // arithmetic, doubling the correct bits in each step.
                inv *= 2 - denominator * inv; // inverse mod 2**8
                inv *= 2 - denominator * inv; // inverse mod 2**16
                inv *= 2 - denominator * inv; // inverse mod 2**32
                inv *= 2 - denominator * inv; // inverse mod 2**64
                inv *= 2 - denominator * inv; // inverse mod 2**128
                inv *= 2 - denominator * inv; // inverse mod 2**256

                // Because the division is now exact we can divide by multiplying
                // with the modular inverse of denominator. This will give us the
                // correct result modulo 2**256. Since the precoditions guarantee
                // that the outcome is less than 2**256, this is the final result.
                // We don't need to compute the high bits of the result and prod1
                // is no longer required.
                result = prod0 * inv;
            }

            if (direction == Rounding.Up) {
                result += 1;
            }

            return result;
        }
    }
}
