pragma solidity ^0.4.15;

import '../../contracts/payment/SplitPullPayment.sol';

// mock class using SplitPullPaymentMock
contract SplitPullPaymentMock is SplitPullPayment {
  function SplitPullPaymentMock() SplitPayment(0) payable { }
  function () payable {}
}
