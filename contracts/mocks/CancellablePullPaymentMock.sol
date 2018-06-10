pragma solidity ^0.4.23;


import "../payment/CancellablePullPayment.sol";


// mock class using CancellablePullPayment
contract CancellablePullPaymentMock is CancellablePullPayment {

  constructor() public payable { }

  // test helper function to call asyncSend
  function callSend(address dest, uint256 amount) public {
    asyncSend(dest, amount);
  }

  // test helper function to call cancelPayment
  function callCancel(address dest) public {
    cancelPayment(dest);
  }
}
