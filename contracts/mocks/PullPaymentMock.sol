pragma solidity ^0.4.18;


import "../payment/PullPayment.sol";


// mock class using PullPayment
contract PullPaymentMock is PullPayment {

  function PullPaymentMock() public payable { }

  // test helper function to call asyncSend
  function callSend(address dest, uint256 amount) public {
    asyncSend(dest, amount);
  }

}
