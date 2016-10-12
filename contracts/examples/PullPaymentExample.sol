pragma solidity ^0.4.0;

import '../PullPayment.sol';

// Example class using PullPayment
contract PullPaymentExample is PullPayment {
  // test helper function to call asyncSend
  function callSend(address dest, uint amount) external {
    asyncSend(dest, amount);
  }
}
