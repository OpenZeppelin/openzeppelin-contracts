// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../contracts/utils/math/Math.sol";
import "../../../contracts/utils/math/SafeMath.sol";

contract MathTest is Test {
    // CEILDIV
    function testCeilDiv(uint256 a, uint256 b) public {
        vm.assume(b > 0);

        uint256 result = Math.ceilDiv(a, b);

        if (result == 0) {
            assertEq(a, 0);
        } else {
            uint256 maxdiv = UINT256_MAX / b;
            bool overflow = maxdiv * b < a;
            assertTrue(a > b * (result - 1));
            assertTrue(overflow ? result == maxdiv + 1 : a <= b * result);
        }
    }

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
        // input is perfect square
        else {
            assertEq(result * result, input);
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
        } else {
            assertEq(2 ** result, input);
        }
    }

    function _powerOf2Bigger(uint256 value, uint256 ref) private pure returns (bool) {
        return value >= 256 || 2 ** value > ref; // 2**256 overflows uint256
    }

    function _powerOf2Smaller(uint256 value, uint256 ref) private pure returns (bool) {
        return 2 ** value < ref;
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
        } else {
            assertEq(10 ** result, input);
        }
    }

    function _powerOf10Bigger(uint256 value, uint256 ref) private pure returns (bool) {
        return value >= 78 || 10 ** value > ref; // 10**78 overflows uint256
    }

    function _powerOf10Smaller(uint256 value, uint256 ref) private pure returns (bool) {
        return 10 ** value < ref;
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
        } else {
            assertEq(256 ** result, input);
        }
    }

    function _powerOf256Bigger(uint256 value, uint256 ref) private pure returns (bool) {
        return value >= 32 || 256 ** value > ref; // 256**32 overflows uint256
    }

    function _powerOf256Smaller(uint256 value, uint256 ref) private pure returns (bool) {
        return 256 ** value < ref;
    }

    // MULDIV
    function testMulDiv(uint256 x, uint256 y, uint256 d) public {
        // Full precision for x * y
        (uint256 xyHi, uint256 xyLo) = _mulHighLow(x, y);

        // Assume result won't overflow (see {testMulDivDomain})
        // This also checks that `d` is positive
        vm.assume(xyHi < d);

        // Perform muldiv
        uint256 q = Math.mulDiv(x, y, d);

        // Full precision for q * d
        (uint256 qdHi, uint256 qdLo) = _mulHighLow(q, d);
        // Add remainder of x * y / d (computed as rem = (x * y % d))
        (uint256 qdRemLo, uint256 c) = _addCarry(qdLo, _mulmod(x, y, d));
        uint256 qdRemHi = qdHi + c;

        // Full precision check that x * y = q * d + rem
        assertEq(xyHi, qdRemHi);
        assertEq(xyLo, qdRemLo);
    }

    function testMulDivDomain(uint256 x, uint256 y, uint256 d) public {
        (uint256 xyHi, ) = _mulHighLow(x, y);

        // Violate {testMulDiv} assumption (covers d is 0 and result overflow)
        vm.assume(xyHi >= d);

        // we are outside the scope of {testMulDiv}, we expect muldiv to revert
        try this.muldiv(x, y, d) returns (uint256) {
            fail();
        } catch {}
    }

    // External call
    function muldiv(uint256 x, uint256 y, uint256 d) external pure returns (uint256) {
        return Math.mulDiv(x, y, d);
    }

    // Helpers
    function _asRounding(uint8 r) private pure returns (Math.Rounding) {
        vm.assume(r < uint8(type(Math.Rounding).max));
        return Math.Rounding(r);
    }

    function _mulmod(uint256 x, uint256 y, uint256 z) private pure returns (uint256 r) {
        assembly {
            r := mulmod(x, y, z)
        }
    }

    function _mulHighLow(uint256 x, uint256 y) private pure returns (uint256 high, uint256 low) {
        (uint256 x0, uint256 x1) = (x & type(uint128).max, x >> 128);
        (uint256 y0, uint256 y1) = (y & type(uint128).max, y >> 128);

        // Karatsuba algorithm
        // https://en.wikipedia.org/wiki/Karatsuba_algorithm
        uint256 z2 = x1 * y1;
        uint256 z1a = x1 * y0;
        uint256 z1b = x0 * y1;
        uint256 z0 = x0 * y0;

        uint256 carry = ((z1a & type(uint128).max) + (z1b & type(uint128).max) + (z0 >> 128)) >> 128;

        high = z2 + (z1a >> 128) + (z1b >> 128) + carry;

        unchecked {
            low = x * y;
        }
    }

    function _addCarry(uint256 x, uint256 y) private pure returns (uint256 res, uint256 carry) {
        unchecked {
            res = x + y;
        }
        carry = res < x ? 1 : 0;
    }
}
