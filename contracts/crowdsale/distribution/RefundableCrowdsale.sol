pragma solidity ^0.4.24;


import "../../math/SafeMath.sol";
import "./FinalizableCrowdsale.sol";
import "../../payment/RefundEscrow.sol";


/**
 * @title RefundableCrowdsale
 * @dev Extension of Crowdsale contract that adds a funding goal, and
 * the possibility of users getting a refund if goal is not met.
 */
contract RefundableCrowdsale is FinalizableCrowdsale {
  using SafeMath for uint256;

  // minimum amount of funds to be raised in weis
  uint256 private goal_;

  // refund escrow used to hold funds while crowdsale is running
  RefundEscrow private escrow_;

  /**
   * @dev Constructor, creates RefundEscrow.
   * @param _goal Funding goal
   */
  constructor(uint256 _goal) public {
    require(_goal > 0);
    escrow_ = new RefundEscrow(wallet());
    goal_ = _goal;
  }

  /**
   * @return minimum amount of funds to be raised in wei.
   */
  function goal() public view returns(uint256) {
    return goal_;
  }

  /**
   * @dev Investors can claim refunds here if crowdsale is unsuccessful
   * @param _beneficiary Whose refund will be claimed.
   */
  function claimRefund(address _beneficiary) public {
    require(finalized());
    require(!goalReached());

    escrow_.withdraw(_beneficiary);
  }

  /**
   * @dev Checks whether funding goal was reached.
   * @return Whether funding goal was reached
   */
  function goalReached() public view returns (bool) {
    return weiRaised() >= goal_;
  }

  /**
   * @dev escrow finalization task, called when owner calls finalize()
   */
  function _finalization() internal {
    if (goalReached()) {
      escrow_.close();
      escrow_.beneficiaryWithdraw();
    } else {
      escrow_.enableRefunds();
    }

    super._finalization();
  }

  /**
   * @dev Overrides Crowdsale fund forwarding, sending funds to escrow.
   */
  function _forwardFunds() internal {
    escrow_.deposit.value(msg.value)(msg.sender);
  }

}
