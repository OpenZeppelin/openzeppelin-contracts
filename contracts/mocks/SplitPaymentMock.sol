pragma solidity ^0.4.24;

import "../payment/SplitPayment.sol";

contract SplitPaymentMock is SplitPayment {
  constructor(address[] payees, uint256[] shares) public {
    SplitPayment.initialize(payees, shares);
  }
}
