pragma solidity ^0.4.23;


import "../payment/PullPayment.sol";


// mock class using PullPayment
contract PullPaymentMock is PullPayment {

  constructor() public payable { }

  // test helper function to call asyncSend
  function callSend(address dest, uint256 amount) public {
    asyncSend(dest, amount);
  }

}
