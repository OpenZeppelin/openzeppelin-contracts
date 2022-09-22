// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../contracts/utils/math/Math.sol";
import "../../../contracts/utils/math/SafeMath.sol";

contract MathTest is Test {
    // SQRT
    function testSqrt(uint256 input, uint8 r) public {
        Math.Rounding rounding = _asRounding(r);

        uint256 result = Math.sqrt(input, rounding);

        // square of result is bigger than input
        if (_squareBigger(result, input)) {
            assertTrue(rounding == Math.Rounding.Up);
            assertTrue(_squareSmaller(result - 1, input));
        }
        // square of result is smaller than input
        else if (_squareSmaller(result, input)) {
            assertFalse(rounding == Math.Rounding.Up);
            assertTrue(_squareBigger(result + 1, input));
        }
    }

    function _squareBigger(uint256 value, uint256 ref) private pure returns (bool) {
        (bool noOverflow, uint256 square) = SafeMath.tryMul(value, value);
        return !noOverflow || square > ref;
    }

    function _squareSmaller(uint256 value, uint256 ref) private pure returns (bool) {
        return value * value < ref;
    }

    // LOG2
    function testLog2(uint256 input, uint8 r) public {
        Math.Rounding rounding = _asRounding(r);

        uint256 result = Math.log2(input, rounding);

        if (input == 0) {
            assertEq(result, 0);
        } else if (_powerOf2Bigger(result, input)) {
            assertTrue(rounding == Math.Rounding.Up);
            assertTrue(_powerOf2Smaller(result - 1, input));
        } else if (_powerOf2Smaller(result, input)) {
            assertFalse(rounding == Math.Rounding.Up);
            assertTrue(_powerOf2Bigger(result + 1, input));
        }
    }

    function _powerOf2Bigger(uint256 value, uint256 ref) private pure returns (bool) {
        return value >= 256 || 2**value > ref; // 2**256 overflows uint256
    }

    function _powerOf2Smaller(uint256 value, uint256 ref) private pure returns (bool) {
        return 2**value < ref;
    }

    // LOG10
    function testLog10(uint256 input, uint8 r) public {
        Math.Rounding rounding = _asRounding(r);

        uint256 result = Math.log10(input, rounding);

        if (input == 0) {
            assertEq(result, 0);
        } else if (_powerOf10Bigger(result, input)) {
            assertTrue(rounding == Math.Rounding.Up);
            assertTrue(_powerOf10Smaller(result - 1, input));
        } else if (_powerOf10Smaller(result, input)) {
            assertFalse(rounding == Math.Rounding.Up);
            assertTrue(_powerOf10Bigger(result + 1, input));
        }
    }

    function _powerOf10Bigger(uint256 value, uint256 ref) private pure returns (bool) {
        return value >= 78 || 10**value > ref; // 10**78 overflows uint256
    }

    function _powerOf10Smaller(uint256 value, uint256 ref) private pure returns (bool) {
        return 10**value < ref;
    }

    // LOG256
    function testLog256(uint256 input, uint8 r) public {
        Math.Rounding rounding = _asRounding(r);

        uint256 result = Math.log256(input, rounding);

        if (input == 0) {
            assertEq(result, 0);
        } else if (_powerOf256Bigger(result, input)) {
            assertTrue(rounding == Math.Rounding.Up);
            assertTrue(_powerOf256Smaller(result - 1, input));
        } else if (_powerOf256Smaller(result, input)) {
            assertFalse(rounding == Math.Rounding.Up);
            assertTrue(_powerOf256Bigger(result + 1, input));
        }
    }

    function _powerOf256Bigger(uint256 value, uint256 ref) private pure returns (bool) {
        return value >= 32 || 256**value > ref; // 256**32 overflows uint256
    }

    function _powerOf256Smaller(uint256 value, uint256 ref) private pure returns (bool) {
        return 256**value < ref;
    }

    // Helpers
    function _asRounding(uint8 r) private returns (Math.Rounding) {
        vm.assume(r < uint8(type(Math.Rounding).max));
        return Math.Rounding(r);
    }

    function testMulDiv(uint256 x, uint256 y, uint256 d) public {
        vm.assume(d != 0);

        // assume no overflow
        // TODO: make this condition weaker
        uint256 M = type(uint256).max;
        vm.assume(y == 0 || x / d <= M / y);
        vm.assume(x == 0 || y / d <= M / x);

        uint256 res = Math.mulDiv(x, y, d);

        (uint256 res_times_d_hi, uint256 res_times_d_lo) = _mulHighLow(res, d);

        uint256 rem;
        assembly {
            rem := mulmod(x, y, d)
        }

        (uint256 res_times_d_plus_rem_lo, uint256 c) = _addCarry(res_times_d_lo, rem);
        uint256 res_times_d_plus_rem_hi = res_times_d_hi + c;

        (uint256 xy_hi, uint256 xy_lo) = _mulHighLow(x, y);

        assertEq(xy_hi, res_times_d_plus_rem_hi);
        assertEq(xy_lo, res_times_d_plus_rem_lo);
    }

    function _addCarry(uint256 a, uint256 b) private pure returns (uint256 res, uint256 carry) {
        unchecked {
            res = a + b;
        }
        carry = res < a ? 1 : 0;
    }

    // https://stackoverflow.com/a/28904636/667959
    function _mulHighLow(uint256 a, uint256 b) private view returns (uint256 high, uint256 low) {
        uint256 a_lo = uint128(a);
        uint256 a_hi = a >> 128;
        uint256 b_lo = uint128(b);
        uint256 b_hi = b >> 128;

        uint256 a_x_b_hi =  a_hi * b_hi;
        uint256 a_x_b_mid = a_hi * b_lo;
        uint256 b_x_a_mid = b_hi * a_lo;
        uint256 a_x_b_lo =  a_lo * b_lo;

        uint256 carry_bit = (uint256(uint128(a_x_b_mid)) + uint256(uint128(b_x_a_mid)) + (a_x_b_lo >> 128)) >> 128;

        high = a_x_b_hi + (a_x_b_mid >> 128) + (b_x_a_mid >> 128) + carry_bit;

        unchecked {
            low = a * b;
        }
    }
}
