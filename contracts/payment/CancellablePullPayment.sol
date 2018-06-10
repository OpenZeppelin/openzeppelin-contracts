pragma solidity ^0.4.11;


import "./PullPayment.sol";


/*
 * @title CancellablePullPayment
 * 
 * @dev Inherits from PullPayment and allows the payment sender to cancel
 * @dev a payment before it's withdrawn by the reciever.
 * @dev Inherit from this contract and use asyncSend instead of send.
 */

contract CancellablePullPayment is PullPayment {

  mapping(address => mapping(address => uint )) public paymentsByPayer;

  /**
  * @dev Adds to asyncSender from PullPayment adding tracking of both the payer, payee, and amount.
  * @param dest The destination address of the funds.
  * @param amount The amount to transfer.
  */

  function asyncSend(address dest, uint amount) internal {
    paymentsByPayer[msg.sender][dest] = amount;
    super.asyncSend(dest, amount);
  }

  /**
  * @dev Called by the payer to withdraw all payments made to given payee
  * @param payee The address the payer is removing pending payments from.
  */

  function cancelPayments(address payee) internal {
    address payer = msg.sender;
    uint refund = paymentsByPayer[payer][payee];

    if (refund == 0) {
      throw;
    }

    if (this.balance < refund) {
      throw;
    }

    totalPayments = totalPayments.sub(refund);
    payments[payee] = payments[payee].sub(refund);
    paymentsByPayer[payer][payee] = 0;

    if (!payer.send(refund)) {
      throw;
    }
  }
}