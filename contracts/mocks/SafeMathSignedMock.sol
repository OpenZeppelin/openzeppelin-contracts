pragma solidity ^0.4.18;


import "../math/SafeMath.sol";


contract SafeMathSignedMock {
  int256 public result;

  function multiply(int256 a, int256 b) public {
    result = SafeMath.mul(a, b);
  }

  function subtract(int256 a, int256 b) public {
    result = SafeMath.sub(a, b);
  }

  function add(int256 a, int256 b) public {
    result = SafeMath.add(a, b);
  }

}