SafeMath
=============================================

Provides functions of mathematical operations with safety checks.

assert(bool assertion) internal
"""""""""""""""""""""""""""""""""""""""""""""""""

Throws an error if the passed result is false. Used in this contract by checking mathematical expressions.

mul(uint256 a, uint256 b) internal returns (uint256)
"""""""""""""""""""""""""""""""""""""""""""""""""

Multiplies two unisgned integers. Asserts that dividing the product by the non-zero multiplicand results in the multiplier.

sub(uint256 a, uint256 b) internal returns (uint256)
"""""""""""""""""""""""""""""""""""""""""""""""""

Checks that b is not greater than a before subtracting.

add(uint256 a, uint256 b) internal returns (uint256)
"""""""""""""""""""""""""""""""""""""""""""""""""

Checks that the result is greater than both a and b.