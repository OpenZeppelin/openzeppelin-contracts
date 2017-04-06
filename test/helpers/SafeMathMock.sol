pragma solidity ^0.4.8;


import '../../contracts/SafeMath.sol';


contract SafeMathMock {
  uint public result;

  function multiply(uint a, uint b) {
    result = SafeMath.safeMul(a, b);
  }

  function subtract(uint a, uint b) {
    result = SafeMath.safeSub(a, b);
  }

  function add(uint a, uint b) {
    result = SafeMath.safeAdd(a, b);
  }
}
