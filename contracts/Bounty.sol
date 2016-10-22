pragma solidity ^0.4.0;
import './PullPayment.sol';

/*
 * Bounty
 * This bounty will pay out if you can cause a SimpleToken's balance
 * to be lower than its totalSupply, which would mean that it doesn't
 * have sufficient ether for everyone to withdraw.
 */

contract Factory {
  function deployContract() returns (address);
}

contract Target {
  function checkInvariant() returns(bool);
}

contract Bounty is PullPayment {
  Target target;
  bool public claimed;
  mapping(address => address) public researchers;

  function() {
    if (claimed) throw;
  }

  function createTarget(address factoryAddress) returns(Target) {
    target = Target(Factory(factoryAddress).deployContract());
    researchers[target] = msg.sender;
    return target;
  }

  function checkInvariant() returns(bool){
    return target.checkInvariant();
  }

  function claim(Target target) {
    address researcher = researchers[target];
    if (researcher == 0) throw;
    // Check Target contract invariants
    if (!target.checkInvariant()) {
      throw;
    }
    asyncSend(researcher, this.balance);
    claimed = true;
  }

}
