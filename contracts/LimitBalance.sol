pragma solidity ^0.4.4;
contract LimitBalance {

  uint public limit;

  function LimitBalance(uint _limit) {
    limit = _limit;
  }

  modifier limitedPayable() { 
    if (this.balance > limit) {
      throw;
    }
    _;
    
  }

}
