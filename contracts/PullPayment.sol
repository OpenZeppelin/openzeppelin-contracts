pragma solidity ^0.4.0;
/*
 * PullPayment
 * Base contract supporting async send for pull payments.
 * Inherit from this contract and use asyncSend instead of send.
 */
contract PullPayment {
  mapping(address => uint) public payments;

  // store sent amount as credit to be pulled, called by payer
  function asyncSend(address dest, uint amount) internal {
    payments[dest] += amount;
  }

  // withdraw accumulated balance, called by payee
  function withdrawPayments() external {
    uint payment = payments[msg.sender];
    payments[msg.sender] = 0;
    if (!msg.sender.send(payment)) {
      payments[msg.sender] = payment;
    }
  }
}
