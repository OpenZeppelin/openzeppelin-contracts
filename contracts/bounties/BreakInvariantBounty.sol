pragma solidity ^0.4.24;


import "../payment/PullPayment.sol";


/**
 * @title BreakInvariantBounty
 * @dev This bounty will pay out to a researcher if they break invariant logic of the contract.
 */
contract BreakInvariantBounty is PullPayment, Ownable {
  bool private claimed_;
  mapping(address => address) private researchers;

  event TargetCreated(address createdAddress);

  /**
   * @dev Fallback function allowing the contract to receive funds, if they haven't already been claimed.
   */
  function() external payable {
    require(!claimed_);
  }

  /**
   * @dev Determine if the bounty was claimed.
   * @return true if the bounty was claimed, false otherwise.
   */
  function claimed() public view returns(bool) {
    return claimed_;
  }

  /**
   * @dev Create and deploy the target contract (extension of Target contract), and sets the
   * msg.sender as a researcher
   * @return A target contract
   */
  function createTarget() public returns(Target) {
    Target target = Target(_deployContract());
    researchers[target] = msg.sender;
    emit TargetCreated(target);
    return target;
  }

  /**
   * @dev Transfers the contract funds to the researcher that proved the contract is broken.
   * @param _target contract
   */
  function claim(Target _target) public {
    address researcher = researchers[_target];
    require(researcher != address(0));
    // Check Target contract invariants
    require(!_target.checkInvariant());
    _asyncTransfer(researcher, address(this).balance);
    claimed_ = true;
  }

  /**
   * @dev Transfers the current balance to the owner and terminates the contract.
   */
  function destroy() public onlyOwner {
    selfdestruct(owner());
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
