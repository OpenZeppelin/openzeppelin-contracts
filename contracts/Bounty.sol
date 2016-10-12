pragma solidity ^0.4.0;
import './PullPaymentCapable.sol';
import './Token.sol';

/*
 * Bounty
 * This bounty will pay out if you can cause a Token's balance
 * to be lower than its totalSupply, which would mean that it doesn't 
 * have sufficient ether for everyone to withdraw.
 */
contract Bounty is PullPaymentCapable {

  bool public claimed;
  mapping(address => address) public researchers;

  function() {
    if (claimed) throw;
  }

  function createTarget() returns(Token) {
    Token target = new Token(0);
    researchers[target] = msg.sender;
    return target;
  }

  function claim(Token target) {
    address researcher = researchers[target];
    if (researcher == 0) throw;
    // check Token contract invariants
    if (target.totalSupply() == target.balance) {
      throw;
    }
    asyncSend(researcher, this.balance);
    claimed = true;
  }

}
