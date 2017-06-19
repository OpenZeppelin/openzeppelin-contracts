pragma solidity ^0.4.11;


/**
 * Math operations with safety checks
 */
contract SafeMath {
  function mul(uint a, uint b) public returns (uint) {
    uint c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }

  function div(uint a, uint b) public returns (uint) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint a, uint b) public returns (uint) {
    assert(b <= a);
    return a - b;
  }

  function add(uint a, uint b) public returns (uint) {
    uint c = a + b;
    assert(c >= a);
    return c;
  }

  function max64(uint64 a, uint64 b) public constant returns (uint64) {
    return a >= b ? a : b;
  }

  function min64(uint64 a, uint64 b) public constant returns (uint64) {
    return a < b ? a : b;
  }

  function max256(uint256 a, uint256 b) public constant returns (uint256) {
    return a >= b ? a : b;
  }

  function min256(uint256 a, uint256 b) public constant returns (uint256) {
    return a < b ? a : b;
  }

}
