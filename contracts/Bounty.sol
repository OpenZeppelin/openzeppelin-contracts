pragma solidity ^0.4.0;
import './PullPayment.sol';
import './examples/ExampleToken.sol';

/*
 * Bounty
 * This bounty will pay out if you can cause a ExampleToken's balance
 * to be lower than its totalSupply, which would mean that it doesn't 
 * have sufficient ether for everyone to withdraw.
 */
contract Bounty is PullPayment {

  bool public claimed;
  mapping(address => address) public researchers;

  function() {
    if (claimed) throw;
  }

  function createTarget() returns(ExampleToken) {
    ExampleToken target = new ExampleToken();
    researchers[target] = msg.sender;
    return target;
  }

  function claim(ExampleToken target) {
    address researcher = researchers[target];
    if (researcher == 0) throw;
    // check ExampleToken contract invariants
    if (target.totalSupply() == target.balance) {
      throw;
    }
    asyncSend(researcher, this.balance);
    claimed = true;
  }

}
