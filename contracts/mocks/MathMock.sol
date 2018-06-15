pragma solidity ^0.4.24;


import "../../contracts/math/Math.sol";


contract MathMock {
  uint64 public result64;
  uint256 public result256;

  function max64(uint64 a, uint64 b) public {
    result64 = Math.max64(a, b);
  }

  function min64(uint64 a, uint64 b) public {
    result64 = Math.min64(a, b);
  }

  function max256(uint256 a, uint256 b) public {
    result256 = Math.max256(a, b);
  }

  function min256(uint256 a, uint256 b) public {
    result256 = Math.min256(a, b);
  }
}
