pragma solidity ^0.4.4;
import './PullPayment.sol';
import './Killable.sol';

/*
 * Bounty
 * This bounty will pay out to a researcher if he/she breaks invariant logic of
 * the contract you bet reward against.
 */

contract Target {
  function checkInvariant() returns(bool);
}

contract Bounty is PullPayment, Killable {
  Target target;
  bool public claimed;
  mapping(address => address) public researchers;

  event TargetCreated(address createdAddress);

  function() payable {
    if (claimed) throw;
  }

  function createTarget() returns(Target) {
    target = Target(deployContract());
    researchers[target] = msg.sender;
    TargetCreated(target);
    return target;
  }

  function deployContract() internal returns(address);

  function checkInvariant() returns(bool){
    return target.checkInvariant();
  }

  function claim(Target target) {
    address researcher = researchers[target];
    if (researcher == 0) throw;
    // Check Target contract invariants
    if (target.checkInvariant()) {
      throw;
    }
    asyncSend(researcher, this.balance);
    claimed = true;
  }

}
