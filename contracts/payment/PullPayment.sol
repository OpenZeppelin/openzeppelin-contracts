pragma solidity ^0.4.8;


import '../SafeMath.sol';


/*
 * PullPayment
 * Base contract supporting async send for pull payments.
 * Inherit from this contract and use asyncSend instead of send.
 */
contract PullPayment is SafeMath {
  mapping(address => uint) public payments;
  uint public totalPayments;

  // store sent amount as credit to be pulled, called by payer
  function asyncSend(address dest, uint amount) internal {
    payments[dest] = safeAdd(payments[dest], amount);
    totalPayments = safeAdd(totalPayments, amount);
  }

  // withdraw accumulated balance, called by payee
  function withdrawPayments() {
    address payee = msg.sender;
    uint payment = payments[payee];

    if (payment == 0) {
      throw;
    }

    if (this.balance < payment) {
      throw;
    }

    totalPayments = safeSub(totalPayments, payment);
    payments[payee] = 0;

    if (!payee.send(payment)) {
      throw;
    }
  }
}
