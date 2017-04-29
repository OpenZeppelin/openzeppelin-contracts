pragma solidity ^0.4.8;


import './payment/PullPayment.sol';
import './lifecycle/Destructible.sol';


/**
 * @title Bounty
 * @dev This bounty will pay out to a researcher if they break invariant logic of the contract.
 */
contract Bounty is PullPayment, Destructible {
  bool public claimed;
  mapping(address => address) public researchers;

  event TargetCreated(address createdAddress);

  /**
   * @dev Function that allows the contract to recieve funds, if it hasn't been claimed.
   */
  function() payable {
    if (claimed) {
      throw;
    }
  }

  /**
   * @dev Create and deploy the target contract(extension of Target contract), and sets the msg.sender as a researcher
   * @return A target contract
   */
  function createTarget() returns(Target) {
    Target target = Target(deployContract());
    researchers[target] = msg.sender;
    TargetCreated(target);
    return target;
  }

  /**
   * @dev Internal function to deploy the target contract.
   * @return A target contract address
   */
  function deployContract() internal returns(address);

  /**
   * @dev Sends the contract funds to the researcher that proved the contract is broken.
   * @param Target contract
   */
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


/**
 * @title Target
 * @dev Your main contract should inherit from this class and implement the checkInvariant method.
 */
contract Target {

   /**
    * @dev Funtion tha should check everything your contract assumes to be true all the time. If this function returns false, it means your contract was broken in some way and is in an inconsistent state. This is what security researchers will try to acomplish when trying to get the bounty.
    * @return A boolean that indicates if the contract is broken or not.
    */
  function checkInvariant() returns(bool);
}
