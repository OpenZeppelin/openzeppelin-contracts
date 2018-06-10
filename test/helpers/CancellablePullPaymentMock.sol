pragma solidity ^0.4.11;


import '../../contracts/payment/CancellablePullPayment.sol';


// mock class using CancellablePullPayment
contract CancellablePullPaymentMock is CancellablePullPayment {

  function CancellablePullPaymentMock() payable { }

  // test helper function to call asyncSend
  function callSend(address dest, uint amount) {
    asyncSend(dest, amount);
  }

  // test helper function to call cancelPayments
  function callCancelPayments(address payee) {
    cancelPayments(payee);
  }
}
