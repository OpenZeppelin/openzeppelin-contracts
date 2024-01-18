// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Math} from "../../../contracts/utils/math/Math.sol";
import {SignedMath} from "../../../contracts/utils/math/SignedMath.sol";

contract SignedMathTest is Test {
    // MIN
    function testMin(int256 a, int256 b) public {
        int256 result = SignedMath.min(a, b);

        assertLe(result, a);
        assertLe(result, b);
        assertTrue(result == a || result == b);
    }

    // MAX
    function testMax(int256 a, int256 b) public {
        int256 result = SignedMath.max(a, b);

        assertGe(result, a);
        assertGe(result, b);
        assertTrue(result == a || result == b);
    }

    // AVERAGE
    // 1. simple test, not full int256 range
    function testAverage1(int256 a, int256 b) public {
        a = bound(a, type(int256).min / 2, type(int256).max / 2);
        b = bound(b, type(int256).min / 2, type(int256).max / 2);

        int256 result = SignedMath.average(a, b);

        assertEq(result, (a + b) / 2);
    }

    // 2. more complex test, full int256 range
    function testAverage2(int256 a, int256 b) public {
        (int256 result, int256 min, int256 max) = (
            SignedMath.average(a, b),
            SignedMath.min(a, b),
            SignedMath.max(a, b)
        );

        // average must be between `a` and `b`
        assertGe(result, min);
        assertLe(result, max);

        unchecked {
            // must be unchecked in order to support `a = type(int256).min, b = type(int256).max`
            uint256 deltaLower = uint256(result - min);
            uint256 deltaUpper = uint256(max - result);
            uint256 remainder = uint256((a & 1) ^ (b & 1));
            assertEq(remainder, Math.max(deltaLower, deltaUpper) - Math.min(deltaLower, deltaUpper));
        }
    }

    // ABS
    function testAbs(int256 a) public {
        uint256 result = SignedMath.abs(a);

        unchecked {
            // must be unchecked in order to support `n = type(int256).min`
            assertEq(result, a < 0 ? uint256(-a) : uint256(a));
        }
    }
}
