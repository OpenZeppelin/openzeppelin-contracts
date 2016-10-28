pragma solidity ^0.4.0;
import './PullPayment.sol';
import './Killable.sol';

/*
 * Bounty
 * This bounty will pay out to a researcher if he/she breaks invariant logic of
 * the contract you bet reward against.
 */

contract Factory {
  function deployContract() returns (address);
}

contract Target {
  function checkInvariant() returns(bool);
}

contract Bounty is PullPayment, Killable {
  Target target;
  bool public claimed;
  address public factoryAddress;
  mapping(address => address) public researchers;

  event TargetCreated(address createdAddress);

  function() payable {
    if (claimed) throw;
  }

  modifier withAddress(address _address) {
    if(_address == 0) throw;
    _;
  }

  function Bounty(address _factoryAddress) withAddress(_factoryAddress){
    factoryAddress = _factoryAddress;
  }

  function createTarget() returns(Target) {
    target = Target(Factory(factoryAddress).deployContract());
    researchers[target] = msg.sender;
    TargetCreated(target);
    return target;
  }

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
