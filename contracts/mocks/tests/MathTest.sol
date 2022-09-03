// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../utils/math/Math.sol";
import "../utils/math/SafeMath.sol";

contract MathTest is Test {
    function testSquareRoot(uint256 input) public {
        uint256 result = Math.sqrt(input);
        uint256 square = result * result;

        // `sqrt` should return a rounded-down value, so `square` is either less or equal to `input`.
        if (square < input) {
            // We know `result` is less than the true value for the square root, but we want to check that the error is
            // minimal - in this case, less than 1.
            // This should only happen if `input` is not a perfect square. We can then check that any result larger than
            // the one we got would result in a square larger than `input`, meaning we got the smallest value for which
            // the square is less than `input`.

            (bool noOverflow, uint256 nextSquare) = SafeMath.tryMul(result + 1, result + 1);

            // The only case in which this doesn't work if is `nextSquare` doesn't fit in 256 bits - but since `input`
            // does fit in 256 bits, this still means that `nextSquare` is larger than `input`.
            vm.assume(noOverflow);

            assertTrue(input < nextSquare);
        } else {
            // If `square` is not less than input, then it must be a perfect match (because `input` is a perfect
            // square).
            assertEq(square, input);
        }
    }
}
