pragma solidity ^0.4.23;


import "./PullPayment.sol";


/**
 * @title CancellablePullPayment
 * @dev PullPayment contract supporting cancelling an issued payment.
 */
contract CancellablePullPayment is PullPayment {

  /**
  * @dev Called by the payer to cancel the stored amount for an address.
  * @param _payee The destination address of the funds.
  */
  function cancelPayment(address _payee) internal {
    uint256 payment = payments[_payee];

    require(payment != 0);

    payments[_payee] = 0;
    totalPayments = totalPayments.sub(payment);
  }
}
