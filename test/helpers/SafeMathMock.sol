pragma solidity ^0.4.8;


import '../../contracts/SafeMath.sol';


contract SafeMathMock is SafeMath {
  uint public result;

  function multiply(uint a, uint b) {
    result = safeMul(a, b);
  }

  function subtract(uint a, uint b) {
    result = safeSub(a, b);
  }

  function add(uint a, uint b) {
    result = safeAdd(a, b);
  }
}
