pragma solidity ^0.4.18;

import "../lifecycle/DestructibleDelayed.sol";

// mock class using BasicToken
contract DestructibleDelayedMock is DestructibleDelayed {

  function DestructibleDelayedMock(uint256 _destructionDelay) 
    public 
    payable 
    DestructibleDelayed(_destructionDelay)
  {
  }

 }