pragma solidity ^0.4.24;

import "../payment/PullPayment.sol";
import "../ownership/Ownable.sol";

/**
 * @title BreakInvariantBounty
 * @dev This bounty will pay out to a researcher if they break invariant logic of the contract.
 */
contract BreakInvariantBounty is PullPayment, Ownable {
  bool private _claimable = true;
  mapping(address => address) private _researchers;

  event TargetCreated(address createdAddress);
  event BountyCanceled();

  /**
   * @dev Fallback function allowing the contract to receive funds, if they haven't already been claimed.
   */
  function() external payable {
    require(_claimable);
  }

  /**
   * @dev Determine if the bounty is claimable.
   * @return false if the bounty was claimed, true otherwise.
   */
  function claimable() public view returns(bool) {
    return _claimable;
  }

  /**
   * @dev Create and deploy the target contract (extension of Target contract), and sets the
   * msg.sender as a researcher
   * @return A target contract
   */
  function createTarget() public returns(Target) {
    Target target = Target(_deployContract());
    _researchers[target] = msg.sender;
    emit TargetCreated(target);
    return target;
  }

  /**
   * @dev Transfers the contract funds to the researcher that proved the contract is broken.
   * @param target contract
   */
  function claim(Target target) public {
    require(_claimable);
    address researcher = _researchers[target];
    require(researcher != address(0));
    // Check Target contract invariants
    require(!target.checkInvariant());
    _asyncTransfer(researcher, address(this).balance);
    _claimable = false;
  }

  /**
   * @dev Cancels the bounty and transfers all funds to the owner
   */
  function cancelBounty() public onlyOwner{
    require(_claimable);
    _asyncTransfer(owner(), address(this).balance);
    _claimable = false;
    emit BountyCanceled();
  }

  /**
   * @dev Internal function to deploy the target contract.
   * @return A target contract address
   */
  function _deployContract() internal returns(address);

}

/**
 * @title Target
 * @dev Your main contract should inherit from this class and implement the checkInvariant method.
 */
contract Target {

   /**
    * @dev Checks all values a contract assumes to be true all the time. If this function returns
    * false, the contract is broken in some way and is in an inconsistent state.
    * In order to win the bounty, security researchers will try to cause this broken state.
    * @return True if all invariant values are correct, false otherwise.
    */
  function checkInvariant() public returns(bool);
}
