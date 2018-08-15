pragma solidity ^0.4.24;


import "../payment/PullPayment.sol";


// mock class using PullPayment
contract PullPaymentMock is PullPayment {

  constructor() public payable { }

  // test helper function to call asyncTransfer
  function callTransfer(address _dest, uint256 _amount) public {
    asyncTransfer(_dest, _amount);
  }

}
