pragma solidity ^0.4.11;

import '../../contracts/payment/SplitPayment.sol';

// mock class using SplitPayment
contract SplitPaymentMock is SplitPayment {
  function SplitPaymentMock(address[] _payees, uint256[] _shares) 
    SplitPayment(_payees, _shares) payable {}
  function () payable {}
}
