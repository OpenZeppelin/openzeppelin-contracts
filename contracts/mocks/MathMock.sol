pragma solidity ^0.4.24;


import "../../contracts/math/Math.sol";


contract MathMock {
  uint256 public result;

  function max(uint256 _a, uint256 _b) public {
    result = Math.max(_a, _b);
  }

  function min(uint256 _a, uint256 _b) public {
    result = Math.min(_a, _b);
  }
}
