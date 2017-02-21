pragma solidity ^0.4.8;


import './payment/PullPayment.sol';
import './lifecycle/Killable.sol';


/*
 * Bounty
 * 
 * This bounty will pay out to a researcher if they break invariant logic of the contract.
 */
contract Bounty is PullPayment, Killable {
  bool public claimed;
  mapping(address => address) public researchers;

  event TargetCreated(address createdAddress);

  function() payable {
    if (claimed) {
      throw;
    }
  }

  function createTarget() returns(Target) {
    Target target = Target(deployContract());
    researchers[target] = msg.sender;
    TargetCreated(target);
    return target;
  }

  function deployContract() internal returns(address);

  function claim(Target target) {
    address researcher = researchers[target];
    if (researcher == 0) {
      throw;
    }
    // Check Target contract invariants
    if (target.checkInvariant()) {
      throw;
    }
    asyncSend(researcher, this.balance);
    claimed = true;
  }

}


/*
 * Target
 * 
 * Your main contract should inherit from this class and implement the checkInvariant method. This is a function that should check everything your contract assumes to be true all the time. If this function returns false, it means your contract was broken in some way and is in an inconsistent state. This is what security researchers will try to acomplish when trying to get the bounty.
 */
contract Target {
  function checkInvariant() returns(bool);
}

