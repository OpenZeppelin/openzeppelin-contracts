pragma solidity ^0.4.18;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }

  /**
   * @dev Multiply two fixed point decimals (represented as unsigned integers). Rounds down if digits cannot be represented with the
   * precision defined by `base`
   * @param a A fixed point decimal factor represented as an unsigned integer with precision defined by `base`
   * @param b A fixed point decimal factor represented as an unsigned integer with precision defined by `base`
   * @param base The base unit representing the number 1.0 and defines the precision for the fixed point decimals
   */
  function fxpMul(uint256 a, uint256 b, uint256 base) internal pure returns (uint256) {
    return div(mul(a, b), base);
  }

  /**
   * @dev Divide two fixed point decimals (represented as unsigned integers). Rounds down if digits cannot be represented with the
   * precision defined by `base`
   * @param a A fixed point decimal dividend represented as an unsigned integer with precision defined by `base`
   * @param b A fixed point decimal divisor represented as an unsigned integer with precision defined by `base`
   * @param base The base unit representing the number 1.0 and defines the precision for the fixed point decimals
   */
  function fxpDiv(uint256 a, uint256 b, uint256 base) internal pure returns (uint256) {
    return div(mul(a, base), b);
  }
}
