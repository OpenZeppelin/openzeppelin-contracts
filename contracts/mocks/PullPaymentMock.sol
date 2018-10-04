pragma solidity ^0.4.24;


import "../payment/PullPayment.sol";


// mock class using PullPayment
contract PullPaymentMock is PullPayment {

  constructor() public payable {
    PullPayment.initialize();
  }

  // test helper function to call asyncTransfer
  function callTransfer(address dest, uint256 amount) public {
    _asyncTransfer(dest, amount);
  }

}
