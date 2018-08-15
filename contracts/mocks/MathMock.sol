pragma solidity ^0.4.24;


import "../../contracts/math/Math.sol";


contract MathMock {
  function max(uint256 _a, uint256 _b) public pure returns (uint256) {
    return Math.max(_a, _b);
  }

  function min(uint256 _a, uint256 _b) public pure returns (uint256) {
    return Math.min(_a, _b);
  }
}
