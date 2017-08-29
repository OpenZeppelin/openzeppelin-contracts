pragma solidity ^0.4.15;

import '../../contracts/payment/SplitPayment.sol';

// mock class using SplitPayment
contract SplitPaymentMock is SplitPayment {
  function SplitPaymentMock() SplitPayment(0) payable { }
  function () payable {}
}
