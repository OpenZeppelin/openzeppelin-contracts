pragma solidity ^0.4.24;


import "../../contracts/math/Math.sol";


contract MathMock {
  uint64 public result64;
  uint256 public result256;

  function max64(uint64 _a, uint64 _b) public {
    result64 = Math.max64(_a, _b);
  }

  function min64(uint64 _a, uint64 _b) public {
    result64 = Math.min64(_a, _b);
  }

  function max256(uint256 _a, uint256 _b) public {
    result256 = Math.max256(_a, _b);
  }

  function min256(uint256 _a, uint256 _b) public {
    result256 = Math.min256(_a, _b);
  }
}
