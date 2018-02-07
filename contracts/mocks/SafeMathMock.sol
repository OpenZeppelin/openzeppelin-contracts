pragma solidity ^0.4.18;


import "../math/SafeMath.sol";


contract SafeMathMock {
  uint256 public result;

  function multiply(uint256 a, uint256 b) public {
    result = SafeMath.mul(a, b);
  }

  function subtract(uint256 a, uint256 b) public {
    result = SafeMath.sub(a, b);
  }

  function add(uint256 a, uint256 b) public {
    result = SafeMath.add(a, b);
  }

  function fxpMul(uint256 a, uint256 b, uint256 base) public {
    result = SafeMath.fxpMul(a, b, base);
  }

  function fxpDiv(uint256 a, uint256 b, uint256 base) public {
    result = SafeMath.fxpDiv(a, b, base);
  }
}
