pragma solidity ^0.4.15;

import './PullPayment.sol';
import './SplitPayment.sol';

/**
 * @title SplitPullPayment
 * @dev Contract supporting the distribution of funds combined with withdrawals through PullPayment.
 */
contract SplitPullPayment is SplitPayment, PullPayment {
  /**
   * @dev Return the total amount of funds available for distribution. 
   * @dev Override from SplitPayment to take into account credited funds for pull payments.
   */
  function toDistribute() internal returns (uint256) {
    return this.balance.sub(totalPayments);
  }

  /**
   * @dev Perform the payment to a payee. 
   * @dev Override from SplitPayment to do an asyncSend for later withdrawal.
   * @param _payee The address of the payee to be paid.
   * @param _amount The amount for the payment.
   */
  function pay(address _payee, uint256 _amount) internal {
    asyncSend(_payee, _amount);
  }
}
