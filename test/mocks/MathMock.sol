pragma solidity ^0.4.18;


import "../../contracts/math/Math.sol";


contract MathMock {
  uint64 public result;

  function max64(uint64 a, uint64 b) public {
    result = Math.max64(a, b);
  }

  function min64(uint64 a, uint64 b) public {
    result = Math.min64(a, b);
  }
}
