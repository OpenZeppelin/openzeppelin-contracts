pragma solidity ^0.4.11;


import '../../contracts/math/SafeMath.sol';


contract SafeMathMock {
  uint public result;

  function multiply(uint a, uint b) {
    result = SafeMath.mul(a, b);
  }

  function subtract(uint a, uint b) {
    result = SafeMath.sub(a, b);
  }

  function add(uint a, uint b) {
    result = SafeMath.add(a, b);
  }
}
