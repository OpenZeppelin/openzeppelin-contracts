pragma solidity ^0.4.8;


/**
 * LimitBalance
 * Simple contract to limit the balance of child contract.
 * Note this doesn't prevent other contracts to send funds 
 * by using selfdestruct(address);
 * See: https://github.com/ConsenSys/smart-contract-best-practices#remember-that-ether-can-be-forcibly-sent-to-an-account
 */
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
