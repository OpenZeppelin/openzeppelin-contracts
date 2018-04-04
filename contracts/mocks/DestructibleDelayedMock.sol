pragma solidity ^0.4.18;

import "../lifecycle/DestructibleDelayed.sol";

// mock class using BasicToken
contract DestructibleDelayedMock is DestructibleDelayed {

  //Test assumes 2 weeks delay
  uint256 public SELFDESTRUCTION_DELAY = 2 weeks; 

  function DestructibleDelayedMock() public payable {}

 }