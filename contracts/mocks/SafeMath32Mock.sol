pragma solidity ^0.4.24;

import "../math/SafeMath32.sol";

contract SafeMath32Mock {

  function mul(uint32 a, uint32 b) public pure returns (uint32) {
    return SafeMath32.mul(a, b);
  }

  function div(uint32 a, uint32 b) public pure returns (uint32) {
    return SafeMath32.div(a, b);
  }

  function sub(uint32 a, uint32 b) public pure returns (uint32) {
    return SafeMath32.sub(a, b);
  }

  function add(uint32 a, uint32 b) public pure returns (uint32) {
    return SafeMath32.add(a, b);
  }

  function mod(uint32 a, uint32 b) public pure returns (uint32) {
    return SafeMath32.mod(a, b);
  }
}
