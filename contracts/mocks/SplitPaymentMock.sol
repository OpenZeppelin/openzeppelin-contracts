pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../payment/SplitPayment.sol";

contract SplitPaymentMock is Initializable, SplitPayment {
  constructor(address[] payees, uint256[] shares) public {
    SplitPayment.initialize(payees, shares);
  }
}
