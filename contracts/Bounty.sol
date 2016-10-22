pragma solidity ^0.4.0;
import './PullPayment.sol';

/*
 * Bounty
 * This bounty will pay out if you can cause a SimpleToken's balance
 * to be lower than its totalSupply, which would mean that it doesn't
 * have sufficient ether for everyone to withdraw.
 */

contract Target {
  function checkInvarient() returns(bool){
    return true;
  }
}

contract Bounty is PullPayment {
  Target target;
  bool public claimed;
  mapping(address => address) public researchers;

  function() {
    if (claimed) throw;
  }

  function createTarget() returns(Target) {
    target = new Target();
    researchers[target] = msg.sender;
    return target;
  }

  function checkInvarient() returns(bool){
    return target.checkInvarient();
  }

  function claim(Target target) {
    address researcher = researchers[target];
    if (researcher == 0) throw;
    // Check Target contract invariants
    // Customize this to the specifics of your contract
    if (!target.checkInvarient()) {
      throw;
    }
    asyncSend(researcher, this.balance);
    claimed = true;
  }

}
