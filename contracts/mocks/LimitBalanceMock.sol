pragma solidity ^0.4.18;


import "../LimitBalance.sol";


// mock class using LimitBalance
contract LimitBalanceMock is LimitBalance(1000) {

  function limitedDeposit() public payable limitedPayable {
  }

}
