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
}
