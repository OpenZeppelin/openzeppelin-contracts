pragma solidity ^0.4.0;
import './PullPayment.sol';
import './../token/SimpleToken.sol';

/*
 * Bounty
 * This bounty will pay out if you can cause a SimpleToken's balance
 * to be lower than its totalSupply, which would mean that it doesn't 
 * have sufficient ether for everyone to withdraw.
 */
contract SimpleTokenBounty is PullPayment {

  bool public claimed;
  mapping(address => address) public researchers;

  function() {
    if (claimed) throw;
  }

  function createTarget() returns(SimpleToken) {
    SimpleToken target = new SimpleToken();
    researchers[target] = msg.sender;
    return target;
  }

  function claim(SimpleToken target) {
    address researcher = researchers[target];
    if (researcher == 0) throw;
    // Check SimpleToken contract invariants
    // Customize this to the specifics of your contract
    if (target.totalSupply() == target.balance) {
      throw;
    }
    asyncSend(researcher, this.balance);
    claimed = true;
  }

}
