SafeMath
=============================================

Provides functions of mathematical operations with safety checks.

assert(bool assertion) internal
"""""""""""""""""""""""""""""""""""""""""""""""""

Throws an error if the passed result is false. Used in this contract by checking mathematical expressions.

safeMul(uint a, uint b) internal returns (uint)
"""""""""""""""""""""""""""""""""""""""""""""""""

Multiplies two unisgned integers. Asserts that dividing the product by the non-zero multiplicand results in the multiplier.

safeSub(uint a, uint b) internal returns (uint)
"""""""""""""""""""""""""""""""""""""""""""""""""

Checks that b is not greater than a before subtracting.

safeAdd(uint a, uint b) internal returns (uint)
"""""""""""""""""""""""""""""""""""""""""""""""""

Checks that the result is greater than both a and b.
