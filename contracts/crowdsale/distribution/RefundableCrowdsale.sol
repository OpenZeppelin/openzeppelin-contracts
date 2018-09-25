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
  uint256 private _goal;

  // refund escrow used to hold funds while crowdsale is running
  RefundEscrow private _escrow;

  /**
   * @dev Constructor, creates RefundEscrow.
   * @param goal Funding goal
   */
  constructor(uint256 goal) public {
    require(goal > 0);
    _escrow = new RefundEscrow(wallet());
    _goal = goal;
  }

  /**
   * @return minimum amount of funds to be raised in wei.
   */
  function goal() public view returns(uint256) {
    return _goal;
  }

  /**
   * @dev Investors can claim refunds here if crowdsale is unsuccessful
   * @param beneficiary Whose refund will be claimed.
   */
  function claimRefund(address beneficiary) public {
    require(finalized());
    require(!goalReached());

    _escrow.withdraw(beneficiary);
  }

  /**
   * @dev Checks whether funding goal was reached.
   * @return Whether funding goal was reached
   */
  function goalReached() public view returns (bool) {
    return weiRaised() >= _goal;
  }

  /**
   * @dev escrow finalization task, called when finalize() is called
   */
  function _finalization() internal {
    if (goalReached()) {
      _escrow.close();
      _escrow.beneficiaryWithdraw();
    } else {
      _escrow.enableRefunds();
    }

    super._finalization();
  }

  /**
   * @dev Overrides Crowdsale fund forwarding, sending funds to escrow.
   */
  function _forwardFunds() internal {
    _escrow.deposit.value(msg.value)(msg.sender);
  }

}
