pragma solidity ^0.4.24;


import "../math/GentleSafeMath.sol";


contract GentleSafeMathMock {

  function mul(uint256 a, uint256 b) public pure returns (uint256) {
    return GentleSafeMath.mul(a, b);
  }

  function div(uint256 a, uint256 b) public pure returns (uint256) {
    return GentleSafeMath.div(a, b);
  }

  function sub(uint256 a, uint256 b) public pure returns (uint256) {
    return GentleSafeMath.sub(a, b);
  }

  function add(uint256 a, uint256 b) public pure returns (uint256) {
    return GentleSafeMath.add(a, b);
  }
}
